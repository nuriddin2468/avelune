// tools/tokens-check CLI. Checks a token package directory (default: packages/tokens) and exits 1 on any violation.
//
//   node src/cli.ts [package-dir]
import { join, resolve } from 'node:path';
import { checkTokens, type Violation } from './check.ts';
import { readFiles } from './files.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const packageDir = resolve(process.argv[2] ?? join(workspaceRoot, 'packages', 'tokens'));
const { violations, tokens, pairs, themes } = checkTokens(readFiles(packageDir));

const format = (violation: Violation) =>
  `  [${violation.rule}] ${[violation.file, violation.token].filter(Boolean).join(' › ')}: ${violation.message}`;

if (violations.length > 0) {
  console.error(
    `tokens-check: ${violations.length} violation(s) in ${packageDir}\n${violations.map(format).join('\n')}`,
  );
  process.exit(1);
}
console.log(`tokens-check: ${tokens} tokens and ${pairs} contrast checks (${themes.join(', ')}) passed`);
