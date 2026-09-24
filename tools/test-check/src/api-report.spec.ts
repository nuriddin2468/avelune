// Proves that ui:api-report fails on an export without a release tag and on a public API that changed without its
// report (ADR 0007). fixtures/api-report is a miniature library (library/: entry points and committed reports) and its
// build output (build/: the .d.ts ng-packagr would write); the real script checks it.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixtures = join(import.meta.dirname, '..', 'fixtures', 'api-report');

describe('ui:api-report', () => {
  const run = spawnSync(
    process.execPath,
    [
      join(workspaceRoot, 'packages', 'ui', 'scripts', 'api-report.mjs'),
      '--package',
      join(fixtures, 'library'),
      '--build',
      join(fixtures, 'build'),
    ],
    { cwd: workspaceRoot, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0' } },
  );
  const output = `${run.stdout}\n${run.stderr}`;

  it('fails the run', () => {
    assert.notEqual(run.status, 0, output);
  });

  it('passes entry points whose reports are current', () => {
    assert.match(output, /api-report: @avelune\/ui unchanged/);
    assert.match(output, /api-report: @avelune\/ui\/clean unchanged/);
  });

  it('fails a changed public API whose report was not updated', () => {
    assert.match(output, /You have changed the API signature/);
    assert.match(output, /api-report: @avelune\/ui\/stale FAILED/);
  });

  it('fails an export without a release tag', () => {
    assert.match(output, /\(ae-missing-release-tag\) "aveVersion" is part of the package's API/);
    assert.match(output, /api-report: @avelune\/ui\/untagged FAILED/);
  });
});
