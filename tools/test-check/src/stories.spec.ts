// Proves that storybook:test fails on an axe violation and on a failing play function (brief §5.4, ADR 0026). The
// fixture Storybook in fixtures/storybook reuses the real preview and main config and holds one violation of each;
// the axe failure also proves that the real preview sets parameters.a11y.test to 'error'.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixtures = join(import.meta.dirname, '..', 'fixtures', 'storybook');

describe('storybook:test', () => {
  it('runs the fixtures with the real story-test setup', () => {
    // fixtures/storybook/.storybook reuses the real main config and preview (and so parameters.a11y.test = 'error');
    // its vitest config must be the real one but for the project name.
    const vitestConfig = (path: string) =>
      readFileSync(path, 'utf8')
        .replace(/^\/\/.*\n/gm, '')
        .replace(/name: '[^']+'/, "name: '…'");
    assert.equal(
      vitestConfig(join(fixtures, 'vitest.config.ts')),
      vitestConfig(join(workspaceRoot, 'apps', 'storybook', 'vitest.config.ts')),
    );
  });

  it('fails the run for a story with an axe violation and for a failing play function', () => {
    const run = spawnSync(
      join(workspaceRoot, 'node_modules', '.bin', 'vitest'),
      ['run', '--config', join(fixtures, 'vitest.config.ts')],
      { cwd: workspaceRoot, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', CI: 'true' } },
    );
    const output = `${run.stdout}\n${run.stderr}`;
    assert.notEqual(run.status, 0, output);
    assert.match(output, /a11y-violation\.stories\.ts > Unnamed Button/);
    assert.match(output, /Buttons must have discernible text \(button-name\)/);
    assert.match(output, /play-failure\.stories\.ts > Wrong Text/);
    assert.match(output, /expected 'Saved' to contain 'Deleted'/);
    assert.match(output, /Tests {2}2 failed \(2\)/);
  });
});
