// Proves that both browser suites refuse to run outside the pinned container (ADR 0010): a host-side run would make
// or compare screenshots with another browser build, OS and CPU. Which facts identify the container is unit-tested
// in tools/visual (environment.spec.ts).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');

/** This environment without the variable that container.ts sets, as on any machine outside the container. */
const hostEnv = Object.fromEntries(Object.entries(process.env).filter(([name]) => name !== 'AVELUNE_PLAYWRIGHT_IMAGE'));

describe('browser suites on the host', () => {
  for (const config of ['tools/visual/playwright.config.ts', 'tools/invariants/playwright.config.ts']) {
    it(`${config} refuses to start`, () => {
      const run = spawnSync(
        process.execPath,
        [join(workspaceRoot, 'node_modules', '@playwright', 'test', 'cli.js'), 'test', '--config', config, '--list'],
        { cwd: workspaceRoot, encoding: 'utf8', env: { ...hostEnv, FORCE_COLOR: '0' } },
      );
      const output = `${run.stdout}\n${run.stderr}`;
      assert.notEqual(run.status, 0, output);
      assert.match(output, /The browser suites run only in mcr\.microsoft\.com\/playwright:v1\.63\.0-noble@sha256:/);
    });
  }
});
