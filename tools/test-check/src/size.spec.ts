// Proves that ui:size fails when an entry point exceeds its budget or declares none (brief §5.4, ADR 0028). The
// fixture configs in fixtures/size-limit run the real checks (packages/ui/scripts/size-limit.mts) on a miniature
// library.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixtures = join(import.meta.dirname, '..', 'fixtures', 'size-limit');

function sizeLimit(config: string): { status: number | null; output: string } {
  const run = spawnSync(join(workspaceRoot, 'node_modules', '.bin', 'size-limit'), ['--config', config, '--json'], {
    cwd: fixtures,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  return { status: run.status, output: `${run.stdout}\n${run.stderr}` };
}

describe('ui:size', () => {
  it('runs the real checks on the library build', () => {
    const project: unknown = JSON.parse(readFileSync(join(workspaceRoot, 'packages', 'ui', 'project.json'), 'utf8'));
    const targets: unknown = typeof project === 'object' && project !== null ? Reflect.get(project, 'targets') : null;
    const size: unknown = typeof targets === 'object' && targets !== null ? Reflect.get(targets, 'size') : null;
    const options: unknown = typeof size === 'object' && size !== null ? Reflect.get(size, 'options') : null;
    assert.ok(typeof size === 'object' && size !== null);
    assert.deepEqual(Reflect.get(size, 'dependsOn'), ['build-lib']);
    assert.ok(typeof options === 'object' && options !== null);
    assert.equal(Reflect.get(options, 'command'), 'size-limit --config scripts/size-limit.mts');
  });

  it('fails an entry point over its budget and passes one within it', () => {
    const { status, output } = sizeLimit('size-limit.mts');
    assert.notEqual(status, 0, output);
    const results: unknown = JSON.parse(output.slice(output.indexOf('['), output.lastIndexOf(']') + 1));
    assert.ok(Array.isArray(results));
    const outcome = (result: unknown): string =>
      typeof result === 'object' && result !== null
        ? `${String(Reflect.get(result, 'name'))} ${Reflect.get(result, 'passed') === true ? 'passed' : 'failed'}`
        : String(result);
    assert.deepEqual(results.map(outcome), ['@avelune/ui/over failed', '@avelune/ui/within passed']);
  });

  it('fails when an entry point declares no budget', () => {
    const { status, output } = sizeLimit('unbudgeted.size-limit.mts');
    assert.notEqual(status, 0, output);
    assert.match(output, /plain\/entry\.json must declare \\"sizeLimit\\"/);
  });
});
