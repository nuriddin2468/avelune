// Proves the commit-msg hook's rules (brief §3, AGENTS.md "Commits"): commitlint with the workspace config rejects a
// wrong type, a scope that is no Nx project or repository scope, a sentence-case subject and an overlong body line.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixtures = join(import.meta.dirname, '..', 'fixtures', 'commits');

function commitlint(fixture: string): { status: number | null; output: string } {
  const run = spawnSync(
    join(workspaceRoot, 'node_modules', '.bin', 'commitlint'),
    ['--edit', join(fixtures, fixture)],
    { cwd: workspaceRoot, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } },
  );
  return { status: run.status, output: `${run.stdout}\n${run.stderr}` };
}

describe('commitlint', () => {
  it('accepts a conventional message with a project scope', () => {
    const { status, output } = commitlint('good.txt');
    assert.equal(status, 0, output);
  });

  for (const [fixture, rule] of [
    ['bad-type.txt', 'type-enum'],
    ['unknown-scope.txt', 'scope-enum'],
    ['sentence-case-subject.txt', 'subject-case'],
    ['long-body-line.txt', 'body-max-line-length'],
  ] as const) {
    it(`rejects ${fixture} with ${rule}`, () => {
      const { status, output } = commitlint(fixture);
      assert.notEqual(status, 0, output);
      assert.match(output, new RegExp(`\\[${rule}\\]`));
    });
  }
});
