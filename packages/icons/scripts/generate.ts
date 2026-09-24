// The kit's icon data from lucide-static (ADR 0020, 0033).
//
//   node scripts/generate.ts            fail when src/icons.ts or LICENSE-lucide.txt is not what icons.config.ts and
//                                       the installed lucide-static generate (CI; also catches hand edits)
//   node scripts/generate.ts --update   regenerate both (local, then review the diff)
//   node scripts/generate.ts <dir>      check a copy of the package in <dir> instead (used by the tests)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { kitIcons } from './icons.config.ts';
import { IconError, iconsModule, selectIcons } from './icons.ts';

const repositoryPackage = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const update = args.includes('--update');
const packageRoot = resolve(args.find((arg) => !arg.startsWith('--')) ?? repositoryPackage);

const nodesFile = createRequire(import.meta.url).resolve('lucide-static/icon-nodes.json');
const lucideRoot = dirname(nodesFile);
const lucide: unknown = JSON.parse(readFileSync(join(lucideRoot, 'package.json'), 'utf8'));
const version = typeof lucide === 'object' && lucide !== null ? String(Reflect.get(lucide, 'version')) : 'unknown';

let icons;
try {
  icons = selectIcons(kitIcons, JSON.parse(readFileSync(nodesFile, 'utf8')));
} catch (error) {
  if (error instanceof IconError) {
    console.error(`icons: scripts/icons.config.ts does not match lucide-static ${version}:\n${error.message}`);
    process.exit(1);
  }
  throw error;
}

const moduleFile = join(packageRoot, 'src', 'icons.ts');
// Formatted with the repository's Prettier config, so the committed file passes `prettier --check` unchanged.
const prettierConfig = (await resolveConfig(join(repositoryPackage, 'src', 'icons.ts'))) ?? {};
const outputs = new Map([
  [
    moduleFile,
    await format(iconsModule(icons, `lucide-static ${version}`), { ...prettierConfig, filepath: moduleFile }),
  ],
  [join(packageRoot, 'LICENSE-lucide.txt'), readFileSync(join(lucideRoot, 'LICENSE'), 'utf8')],
]);

let stale = false;
for (const [file, content] of outputs) {
  const name = relative(process.cwd(), file);
  let current: string | undefined;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    current = undefined;
  }
  if (current === content) {
    console.log(`icons: ${name} is up to date`);
  } else if (update) {
    writeFileSync(file, content);
    console.log(`icons: wrote ${name}`);
  } else {
    console.error(`icons: ${name} is not what icons.config.ts and lucide-static ${version} generate.`);
    stale = true;
  }
}
if (stale) {
  console.error('Run `pnpm nx run icons:generate --update` and review the diff.');
  process.exit(1);
}
