// manifest-check CLI (ADR 0090): the components manifest of the built Storybook holds every component and directive
// of @avelune/ui, every input and output, and a snippet an application can copy for every story.
//
//   node src/cli.ts    fail on anything an agent reading the manifest through the MCP docs toolset would miss
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseApiReport, reportEntry } from './api-report.ts';
import { manifestProblems } from './check.ts';
import { exempt } from './config.ts';
import { kitFrames } from './frames.ts';
import { readManifest, storiesEntry } from './manifest.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const apiRoot = join(workspaceRoot, 'packages', 'ui', 'api');
const components = readdirSync(apiRoot).flatMap((file) => {
  const entry = reportEntry(file);
  return entry === undefined ? [] : parseApiReport(entry, readFileSync(join(apiRoot, file), 'utf8'));
});
const entries = readManifest(join(workspaceRoot, 'dist', 'apps', 'storybook'));
const problems = manifestProblems({
  components,
  entries,
  frames: kitFrames(join(workspaceRoot, 'packages', 'ui')),
  exempt,
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
