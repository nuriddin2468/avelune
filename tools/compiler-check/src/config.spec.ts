import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { checkConfig, checkWorkspace } from './config.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const configs = join(import.meta.dirname, '..', 'fixtures', 'configs');

describe('compiler-check', () => {
  it('accepts every tsconfig of the workspace', () => {
    const report = checkWorkspace(workspaceRoot);
    assert.deepEqual(report.findings, []);
    for (const config of [
      'tsconfig.base.json',
      'packages/ui/tsconfig.lib.json',
      'tools/compiler-check/tsconfig.json',
    ]) {
      assert.ok(report.configs.includes(config), `${config} was not found`);
    }
    assert.deepEqual(
      report.configs.filter((config) => config.includes('fixtures/')),
      [],
      'fixtures are deliberate violations and must not be checked as workspace configs',
    );
  });

  // Each fixture weakens one option; its first line names the option the check must report, and nothing else.
  for (const file of readdirSync(configs).sort()) {
    const expected = /^\/\* Expect: (\S+)/.exec(readFileSync(join(configs, file), 'utf8'))?.[1];
    it(`rejects ${file} (${expected ?? 'no Expect line'})`, () => {
      assert.ok(expected, `${file} has no "/* Expect:" line`);
      const findings = checkConfig(join(configs, file), configs);
      assert.deepEqual(
        findings.map((finding) => finding.option),
        [expected],
        findings.map((finding) => `  ${finding.message}`).join('\n'),
      );
    });
  }
});
