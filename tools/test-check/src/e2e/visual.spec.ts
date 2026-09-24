// Proves that the visual suite (tools/visual, ADR 0027) fails on each violation it guards against, and only on those.
// fixtures/visual is a Storybook of fixture stories built with the real main config, preview and head, and a
// baselines folder; each story breaks one check and Clean breaks none.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';
import { runSuite, workspaceRoot, type SuiteRun, type TestResult } from './playwright-report.ts';

const fixtures = join('tools', 'test-check', 'fixtures', 'visual');
const site = join('dist', 'tools', 'test-check', 'visual-storybook');

describe('visual suite', () => {
  let run: SuiteRun;

  before(() => {
    const build = spawnSync(
      join(workspaceRoot, 'node_modules', '.bin', 'storybook'),
      ['build', '--config-dir', join(fixtures, '.storybook'), '--output-dir', join(workspaceRoot, site), '--quiet'],
      { cwd: workspaceRoot, encoding: 'utf8' },
    );
    assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
    run = runSuite(
      'tools/visual/playwright.config.ts',
      { AVELUNE_VISUAL_SITE: site, AVELUNE_VISUAL_BASELINES: join(fixtures, 'baselines') },
      ['--project=light-1280', '--project=baselines'],
    );
  });

  const result = (title: string): TestResult => {
    const found = run.tests.find((test) => test.title === title);
    assert.ok(found, `no test "${title}" in:\n${run.tests.map((test) => test.title).join('\n')}\n${run.log}`);
    return found;
  };
  const fails = (title: string, pattern: RegExp) => {
    const test = result(title);
    assert.equal(test.passed, false, `${title} passed`);
    assert.match(test.errors.join('\n'), pattern);
  };
  const passes = (title: string) => {
    const test = result(title);
    assert.equal(test.passed, true, `${title} failed:\n${test.errors.join('\n')}`);
  };

  it('fails the run', () => {
    assert.notEqual(run.status, 0, run.log);
  });

  it('passes a story that matches its baseline and has no violation', () => {
    passes('fixtures-visual--clean › matches its baseline');
    passes('fixtures-visual--clean › has no axe violations');
  });

  it('fails a story whose screenshot differs from its baseline', () => {
    fails('fixtures-visual--changed › matches its baseline', /Screenshot comparison failed|pixels .*different/);
    passes('fixtures-visual--changed › has no axe violations');
  });

  it('fails a story without a baseline, and writes none', () => {
    fails('fixtures-visual--unbaselined › matches its baseline', /A snapshot doesn't exist/);
    assert.equal(existsSync(join(workspaceRoot, fixtures, 'baselines', 'fixtures-visual--unbaselined')), false);
  });

  it('fails a story with an axe violation', () => {
    passes('fixtures-visual--axe-violation › matches its baseline');
    fails('fixtures-visual--axe-violation › has no axe violations', /button-name/);
  });

  it('fails a story whose text falls back from the kit font', () => {
    fails('fixtures-visual--font-fallback › matches its baseline', /fonts\.css declares Avelune Sans/);
  });

  it('fails a story whose play function fails', () => {
    for (const check of ['matches its baseline', 'has no axe violations']) {
      fails(
        `fixtures-visual--play-failure › ${check}`,
        /could not render the story cleanly:.*Fixture: the play function fails/s,
      );
    }
  });

  it('fails a baseline that belongs to no story', () => {
    fails('every baseline belongs to a story and a project', /fixtures-visual--removed\/light-1280\.png/);
  });

  it('runs exactly these tests', () => {
    assert.equal(run.tests.length, 13, run.tests.map((test) => test.title).join('\n'));
    assert.equal(
      run.tests.filter((test) => !test.passed).length,
      7,
      run.tests
        .filter((test) => !test.passed)
        .map((test) => test.title)
        .join('\n'),
    );
  });
});
