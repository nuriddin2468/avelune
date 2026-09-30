// manifest-check:foundations (ADR 0102): the token reference of each Foundations docs page, generated from
// @avelune/tokens between its `{/* tokens:<group> */}` markers.
//
//   node src/foundations-cli.ts            fail when a table is stale, a group holds no token or a token is in none
//   node src/foundations-cli.ts --update   regenerate the tables
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens, type TokenDefinition } from '@avelune/tokens';
import { format, resolveConfig } from 'prettier';
import { fillTables, referenceProblems, type ReferenceToken } from './foundations.ts';

const folder = join(import.meta.dirname, '..', '..', '..', 'apps', 'storybook', 'src', 'foundations');
const definitions: Readonly<Record<string, TokenDefinition>> = tokens;
const reference = Object.entries(definitions).map(([name, token]): ReferenceToken => ({
  name,
  cssVar: token.cssVar,
  css: token.css,
  ...(token.dark === undefined ? {} : { dark: token.dark.css }),
  ...(token.compact === undefined ? {} : { compact: token.compact.css }),
  ...(token.reduced === undefined ? {} : { reduced: token.reduced.css }),
  ...(token.description === undefined ? {} : { description: token.description }),
}));

const pages = new Map(
  readdirSync(folder)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => [file, readFileSync(join(folder, file), 'utf8')] as const),
);
const problems = referenceProblems(pages, reference);

/** The page with its tables regenerated, formatted with the repository's Prettier config as `prettier --check` wants. */
async function regenerated(file: string, mdx: string): Promise<string> {
  const path = join(folder, file);
  return format(fillTables(mdx, reference), { ...((await resolveConfig(path)) ?? {}), filepath: path });
}

const stale: string[] = [];
for (const [file, mdx] of pages) {
  const next = await regenerated(file, mdx);
  if (next === mdx) continue;
  stale.push(file);
  if (process.argv.includes('--update')) {
    writeFileSync(join(folder, file), next);
    console.log(`manifest-check:foundations: regenerated the tables of ${file}`);
  }
}
if (!process.argv.includes('--update')) {
  problems.push(...stale.map((file) => `${file}: a token table is stale: run with --update`));
}
if (problems.length > 0) {
  for (const problem of problems) console.error(`manifest-check:foundations: ${problem}`);
  process.exit(1);
}
console.log(
  `manifest-check:foundations: ${String(reference.length)} tokens on ${String(pages.size)} Foundations pages`,
);
