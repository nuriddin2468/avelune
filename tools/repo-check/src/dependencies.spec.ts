// The dependency policy (ADR 0012): pnpm's effective configuration, as `pnpm config list` reports it, refuses versions
// younger than 24 hours without exceptions, enforces engines, and runs install scripts for esbuild only. Changing any
// of these is a guardrail change and must show up here.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const config: unknown = JSON.parse(
  execFileSync('pnpm', ['config', 'list', '--json'], { cwd: workspaceRoot, encoding: 'utf8' }),
);
const setting = (name: string): unknown => Reflect.get(Object(config), name);

describe('pnpm policy', () => {
  it('refuses versions younger than 24 hours, with no exceptions', () => {
    assert.equal(setting('minimumReleaseAge'), 1440);
    assert.equal(setting('minimumReleaseAgeExclude'), undefined);
  });

  it('fails on a Node or pnpm version outside engines', () => {
    assert.equal(setting('engineStrict'), true);
  });

  it('runs install scripts for esbuild only', () => {
    const allowBuilds = Object(setting('allowBuilds')) as Record<string, unknown>;
    assert.deepEqual(
      Object.entries(allowBuilds)
        .filter(([, allowed]) => allowed === true)
        .map(([name]) => name),
      ['esbuild'],
    );
  });

  it('pins pnpm itself', () => {
    const manifest: unknown = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf8'));
    assert.equal(Reflect.get(Object(manifest), 'packageManager'), 'pnpm@11.27.1');
  });
});
