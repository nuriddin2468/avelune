// Proves the formatting gate: the workspace Prettier config rejects code it would reformat, and leaves prose alone
// (.md is formatted by hand, see .prettierignore).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import * as prettier from 'prettier';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixture = join(import.meta.dirname, '..', 'fixtures', 'prettier', 'unformatted.ts');
// Resolved for a real source path: the fixture folder itself is in .prettierignore so the repository check skips it.
const options = { ...(await prettier.resolveConfig(join(workspaceRoot, 'tools', 'repo-check', 'src', 'cli.ts'))) };

describe('prettier', () => {
  it('rejects code outside the workspace style and accepts it once formatted', async () => {
    const source = readFileSync(fixture, 'utf8');
    assert.equal(await prettier.check(source, { ...options, filepath: fixture }), false);
    const formatted = await prettier.format(source, { ...options, filepath: fixture });
    assert.equal(await prettier.check(formatted, { ...options, filepath: fixture }), true);
    assert.match(formatted, /export const label = 'Save changes';/);
  });

  it('checks code and leaves Markdown out', async () => {
    const ignorePath = join(workspaceRoot, '.prettierignore');
    const info = (file: string) => prettier.getFileInfo(join(workspaceRoot, file), { ignorePath });
    assert.equal((await info('tools/repo-check/src/cli.ts')).ignored, false);
    assert.equal((await info('docs/ROADMAP.md')).ignored, true);
  });
});
