// Proves the workspace ESLint config (eslint.config.mjs): each fixture in fixtures/config is linted as if it were the
// file named on its "Lint as" line, and must produce exactly the rules on its "Expect" line (brief §5).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { plugin } from './index.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixtures = join(import.meta.dirname, '..', 'fixtures', 'config');

interface Fixture {
  readonly file: string;
  readonly text: string;
  /** Workspace-relative path the fixture is linted as. */
  readonly lintAs: string;
  /** Rule ids the fixture must produce, sorted. */
  readonly expected: readonly string[];
}

function readFixture(file: string): Fixture {
  const text = readFileSync(join(fixtures, file), 'utf8');
  const lintAs = /Lint as: (\S+)/.exec(text)?.[1];
  const expect = /Expect: ([^\n]+?)(?: -->)?$/m.exec(text)?.[1];
  if (lintAs === undefined || expect === undefined) {
    throw new Error(`${file} needs "Lint as:" and "Expect:" lines`);
  }
  const rules = expect.replace(/\s*\(.*\)$/, '');
  return { file, text, lintAs, expected: rules === 'none' ? [] : rules.split(/,\s*/).sort() };
}

const cases = readdirSync(fixtures).sort().map(readFixture);

// A fixture linted as an existing file gets full type information: the project service uses the fixture's text in
// place of the file's. A path that does not exist has no project, so type-aware rules are switched off for it:
// typescript-eslint's own, and the angular-eslint rules that read the type checker.
const typed = new ESLint({ cwd: workspaceRoot });
const untyped = new ESLint({
  cwd: workspaceRoot,
  overrideConfig: [
    tseslint.configs.disableTypeChecked,
    {
      rules: {
        '@angular-eslint/no-developer-preview': 'off',
        '@angular-eslint/prefer-signal-model': 'off',
        '@angular-eslint/reactive-context-must-read-signal': 'off',
      },
    },
  ],
});

async function lint(fixture: Fixture): Promise<readonly Linter.LintMessage[]> {
  const filePath = join(workspaceRoot, fixture.lintAs);
  const eslint = existsSync(filePath) ? typed : untyped;
  const [result] = await eslint.lintText(fixture.text, { filePath });
  return result?.messages ?? [];
}

describe('workspace ESLint config', () => {
  for (const fixture of cases) {
    it(`${fixture.file} as ${fixture.lintAs} → ${fixture.expected.join(', ') || 'no findings'}`, async () => {
      const messages = await lint(fixture);
      assert.deepEqual(
        [...new Set(messages.map((message) => message.ruleId ?? `(fatal) ${message.message}`))].sort(),
        fixture.expected,
        messages.map((message) => `  ${String(message.ruleId)} ${message.line}: ${message.message}`).join('\n'),
      );
      assert.ok(
        messages.every((message) => message.severity === 2),
        'every finding is an error',
      );
    });
  }

  it('has a fixture for every rule of the avelune plugin', () => {
    const proven = new Set(cases.flatMap((fixture) => fixture.expected));
    assert.deepEqual(
      Object.keys(plugin.rules)
        .map((rule) => `avelune/${rule}`)
        .filter((rule) => !proven.has(rule)),
      [],
    );
  });

  it('turns every rule it enables into an error, never a warning', async () => {
    for (const path of [
      'packages/ui/icon/icon.ts',
      'apps/showcase/src/app/app.ts',
      'apps/showcase/src/app/app.html',
      'tools/fonts/src/cli.ts',
      'eslint.config.mjs',
    ]) {
      const config: unknown = await typed.calculateConfigForFile(join(workspaceRoot, path));
      const rules: unknown = typeof config === 'object' && config !== null ? Reflect.get(config, 'rules') : undefined;
      const warnings = Object.entries(typeof rules === 'object' && rules !== null ? rules : {}).filter(
        ([, entry]) => (Array.isArray(entry) ? entry[0] : entry) === 1,
      );
      assert.deepEqual(warnings, [], `warnings in the config for ${path}`);
    }
  });
});
