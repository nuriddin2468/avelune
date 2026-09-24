// tools/compiler-check CLI. Resolves every tsconfig*.json in the workspace and exits 1 if any of them is weaker than
// the required compiler strictness (src/requirements.ts, ADR 0022).
//
//   node src/cli.ts
import { join } from 'node:path';
import { checkWorkspace } from './config.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const { configs, findings } = checkWorkspace(workspaceRoot);

if (findings.length > 0) {
  console.error(
    `compiler-check: ${findings.length} finding(s)\n${findings.map((finding) => `  ${finding.file}: ${finding.message}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(`compiler-check: ${configs.length} tsconfig files resolve to the required strictness`);
