// Proves that ui:test fails when coverage is below its thresholds (brief §5.4, ADR 0026). The "coverage-gap"
// configuration of ui:test runs the fixtures in fixtures/coverage-gap with the same thresholds as the real run.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');

interface TestTarget {
  readonly options: Readonly<Record<string, unknown>>;
  readonly configurations: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}

function uiTestTarget(): TestTarget {
  const project: unknown = JSON.parse(readFileSync(join(workspaceRoot, 'packages', 'ui', 'project.json'), 'utf8'));
  const targets: unknown = typeof project === 'object' && project !== null ? Reflect.get(project, 'targets') : null;
  const test: unknown = typeof targets === 'object' && targets !== null ? Reflect.get(targets, 'test') : null;
  if (typeof test !== 'object' || test === null) {
    throw new Error('packages/ui/project.json has no test target');
  }
  const options: unknown = Reflect.get(test, 'options');
  const configurations: unknown = Reflect.get(test, 'configurations');
  if (
    typeof options !== 'object' ||
    options === null ||
    typeof configurations !== 'object' ||
    configurations === null
  ) {
    throw new Error('ui:test needs options and configurations');
  }
  return { options: { ...options }, configurations: { ...configurations } } as const satisfies TestTarget;
}

describe('ui:test coverage', () => {
  it('requires 90% of statements, branches, functions and lines in every file, in a real browser', () => {
    const { options } = uiTestTarget();
    assert.deepEqual(options['coverageThresholds'], {
      perFile: true,
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    });
    assert.equal(options['coverage'], true);
    assert.deepEqual(options['browsers'], ['chromium']);
  });

  it('checks the fixtures with the real thresholds: the configuration changes only what runs', () => {
    const gap = uiTestTarget().configurations['coverage-gap'] ?? {};
    assert.deepEqual(Object.keys(gap).sort(), ['coverageExclude', 'coverageInclude', 'include', 'tsConfig']);
  });

  it('fails the run for a file with an untested branch and for a file no test imports', () => {
    const run = spawnSync(
      join(workspaceRoot, 'node_modules', '.bin', 'nx'),
      ['run', 'ui:test:coverage-gap', '--skip-nx-cache'],
      {
        cwd: workspaceRoot,
        encoding: 'utf8',
        env: { ...process.env, NX_DAEMON: 'false', FORCE_COLOR: '0' },
      },
    );
    const output = `${run.stdout}\n${run.stderr}`;
    assert.notEqual(run.status, 0, output);
    assert.match(
      output,
      /Coverage for branches \(50%\) does not meet global threshold \(90%\) for .*coverage-gap\/gap\.ts/,
    );
    assert.match(
      output,
      /Coverage for lines \(0%\) does not meet global threshold \(90%\) for .*coverage-gap\/orphan\.ts/,
    );
  });
});
