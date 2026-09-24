// repo-check CLI: the repository-level rules that no linter covers (ADR 0029).
//
//   node src/cli.ts    fail when a project lacks exactly one layer or type tag, or when .browserslistrc breaks the
//                      browser floor rule of ADR 0014
import { join } from 'node:path';
import { angularFloor, configuredFloor, featureFloor, floorProblems } from './browser-floor.ts';
import { constrainedTags, tagProblems, workspaceProjects } from './tags.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const projects = workspaceProjects(workspaceRoot);
const problems = [
  ...tagProblems(projects, await constrainedTags(workspaceRoot)),
  ...floorProblems(configuredFloor(workspaceRoot), featureFloor(), angularFloor()),
];
if (problems.length > 0) {
  for (const problem of problems) console.error(`repo-check: ${problem}`);
  process.exit(1);
}
console.log(`repo-check: ${String(projects.length)} projects tagged; .browserslistrc follows ADR 0014`);
