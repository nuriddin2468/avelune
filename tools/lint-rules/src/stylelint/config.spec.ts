// Proves the workspace Stylelint config (stylelint.config.mjs): each fixture in fixtures/stylelint is linted as if it
// were the file on its "Lint as" line, and must produce exactly the rules on its "Expect" line (brief §5).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import stylelint from 'stylelint';
import { plugins } from './index.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');
const fixtures = join(import.meta.dirname, '..', '..', 'fixtures', 'stylelint');

interface Fixture {
  readonly file: string;
  readonly code: string;
  readonly lintAs: string;
  readonly expected: readonly string[];
}

function readFixture(file: string): Fixture {
  const code = readFileSync(join(fixtures, file), 'utf8');
  const lintAs = /Lint as: (\S+)/.exec(code)?.[1];
  const expect = /Expect: ([^*]+?)\s*\*\//.exec(code)?.[1];
  if (lintAs === undefined || expect === undefined) {
    throw new Error(`${file} needs "Lint as:" and "Expect:" comments`);
  }
  const rules = expect.replace(/\s*\(.*\)$/, '');
  return { file, code, lintAs, expected: rules === 'none' ? [] : rules.split(/,\s*/).sort() };
}

const cases = readdirSync(fixtures).sort().map(readFixture);

describe('workspace Stylelint config', () => {
  for (const fixture of cases) {
    it(`${fixture.file} as ${fixture.lintAs} → ${fixture.expected.join(', ') || 'no findings'}`, async () => {
      const { results } = await stylelint.lint({
        code: fixture.code,
        codeFilename: join(workspaceRoot, fixture.lintAs),
        cwd: workspaceRoot,
      });
      const findings = results[0]?.warnings ?? [];
      assert.deepEqual(
        [...new Set(findings.map((finding) => finding.rule))].sort(),
        fixture.expected,
        findings.map((finding) => `  ${finding.rule}: ${finding.text}`).join('\n'),
      );
    });
  }

  it('has a fixture for every avelune rule', () => {
    const proven = new Set(cases.flatMap((fixture) => fixture.expected));
    assert.deepEqual(
      plugins.flatMap((plugin) => ('ruleName' in plugin ? [plugin.ruleName] : [])).filter((rule) => !proven.has(rule)),
      [],
    );
  });

  it('makes every rule an error', async () => {
    const config = await stylelint.resolveConfig(join(workspaceRoot, 'packages', 'ui', 'sample', 'sample.css'));
    assert.ok(config !== undefined);
    assert.equal(config.defaultSeverity, 'error');
    const warnings = Object.entries(config.rules ?? {}).filter(([, setting]) => {
      const options: unknown = Array.isArray(setting) ? setting[1] : undefined;
      return typeof options === 'object' && options !== null && Reflect.get(options, 'severity') === 'warning';
    });
    assert.deepEqual(warnings, []);
  });
});
