// manifest-check CLI (ADR 0090, 0101, 0102): the manifests of the built Storybook hold every component, directive and
// other export of @avelune/ui with its inputs, outputs and fields, every public token and class, and a snippet an
// application can paste for every story.
//
//   node src/cli.ts    fail on anything an agent reading the manifest through the MCP docs toolset would miss
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseApiReport, parseExports, reportEntry } from './api-report.ts';
import { manifestProblems } from './check.ts';
import { exempt, exemptExports } from './config.ts';
import { kitFrames } from './frames.ts';
import { readManifest, storiesEntry } from './manifest.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const apiRoot = join(workspaceRoot, 'packages', 'ui', 'api');
const reports = readdirSync(apiRoot).flatMap((file) => {
  const entry = reportEntry(file);
  return entry === undefined ? [] : [{ entry, report: readFileSync(join(apiRoot, file), 'utf8') }];
});
const components = reports.flatMap(({ entry, report }) => parseApiReport(entry, report));
// Every public token (ADR 0017), and every class of the global stylesheet (ADR 0030).
const tokens = readFileSync(join(workspaceRoot, 'packages', 'tokens', 'dist', 'tokens.ts'), 'utf8');
const stylesRoot = join(workspaceRoot, 'packages', 'ui', 'styles');
const styles = readdirSync(stylesRoot)
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(join(stylesRoot, file), 'utf8'))
  .join('\n');
const entries = readManifest(join(workspaceRoot, 'dist', 'apps', 'storybook'));
const problems = manifestProblems({
  components,
  exports: reports.flatMap(({ entry, report }) => parseExports(entry, report)),
  entries,
  frames: kitFrames(join(workspaceRoot, 'packages', 'ui')),
  css: {
    variables: [...tokens.matchAll(/cssVar: "(--ave-[a-z0-9-]+)"/g)].map((match) => match[1] ?? ''),
    classes: [...new Set([...styles.matchAll(/\.(ave-[a-z0-9-]+)/g)].map((match) => match[1] ?? ''))],
  },
  exempt,
  exemptExports,
});
if (problems.length > 0) {
  for (const problem of problems) console.error(`manifest-check: ${problem}`);
  console.error(`manifest-check: ${String(problems.length)} problems`);
  process.exit(1);
}
const stories = entries
  .filter((entry) => storiesEntry(entry.storiesPath) !== undefined)
  .reduce((sum, entry) => sum + entry.stories.length, 0);
console.log(
  `manifest-check: ${String(components.length)} components and directives in the manifest, and a snippet for each of the kit's ${String(stories)} stories`,
);
