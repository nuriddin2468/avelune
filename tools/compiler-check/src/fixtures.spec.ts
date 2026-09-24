import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import ts from 'typescript';
import { compile, knownExtendedDiagnostics } from './compile.ts';
import { checkConfig } from './config.ts';
import { provableOptions, strictFlags } from './requirements.ts';

const fixtures = join(import.meta.dirname, '..', 'fixtures');
const violations = join(fixtures, 'violations');
const project = join(violations, 'tsconfig.json');

interface Fixture {
  readonly file: string;
  /** The option or extended diagnostic the fixture violates; `null` for the control fixture. */
  readonly proves: string | null;
  /** The diagnostic codes the fixture must produce, sorted; each must be an error. */
  readonly expected: readonly string[];
}

/** Each fixture names what it proves and what it must produce in its first lines. */
function readFixture(file: string): Fixture {
  const text = readFileSync(join(violations, file), 'utf8');
  const proves = /^\/\/ Proves: (\S+)$/m.exec(text)?.[1];
  const expected = /^\/\/ Expect: (.+)$/m.exec(text)?.[1];
  if (expected === undefined) {
    throw new Error(`${file} has no "// Expect:" line`);
  }
  const codes = expected === 'none' ? [] : expected.split(',').map((code) => code.trim());
  return { file, proves: proves ?? null, expected: codes.sort() };
}

const cases = readdirSync(violations)
  .filter((file) => file.endsWith('.ts'))
  .sort()
  .map(readFixture);
const diagnostics = compile(project);

describe('violation fixtures', () => {
  it('are compiled with the workspace options and nothing else', () => {
    const { config } = ts.readConfigFile(project, ts.sys.readFile);
    assert.deepEqual(Object.keys(config ?? {}).sort(), ['extends', 'include']);
    assert.deepEqual(checkConfig(project, fixtures), []);
  });

  it('report diagnostics only inside the fixtures', () => {
    const files = new Set(cases.map((fixture) => fixture.file));
    assert.deepEqual(
      diagnostics.filter((diagnostic) => !files.has(diagnostic.file)),
      [],
    );
  });

  it('cover every required option and every extended diagnostic of the installed compiler', () => {
    const required = new Set([
      ...provableOptions(),
      ...knownExtendedDiagnostics(join(fixtures, 'diagnostic-names', 'tsconfig.json')),
    ]);
    const proven = new Set(cases.flatMap((fixture) => (fixture.proves === null ? [] : [fixture.proves])));
    assert.deepEqual([...required].filter((option) => !proven.has(option)).sort(), [], 'options without a fixture');
    assert.deepEqual([...proven].filter((option) => !required.has(option)).sort(), [], 'fixtures of unknown options');
  });

  for (const fixture of cases) {
    const label = fixture.proves ?? 'nothing (control)';
    it(`${fixture.file}: ${label} → ${fixture.expected.join(', ') || 'no diagnostics'}`, () => {
      const found = diagnostics.filter((diagnostic) => diagnostic.file === fixture.file);
      assert.deepEqual(
        found.map((diagnostic) => diagnostic.code).sort(),
        fixture.expected,
        found.map((diagnostic) => `  ${diagnostic.code} line ${diagnostic.line}: ${diagnostic.message}`).join('\n'),
      );
      assert.deepEqual(
        found.filter((diagnostic) => diagnostic.category !== 'error'),
        [],
        'every diagnostic must fail the build',
      );
    });
  }
});

describe('requirements', () => {
  it('list every flag that TypeScript turns on with `strict`', () => {
    // Not in TypeScript's public types; read at runtime so that a new strict flag in an upgrade fails here.
    const declarations: unknown = Reflect.get(ts, 'optionDeclarations');
    assert.ok(Array.isArray(declarations), 'ts.optionDeclarations is gone; check the strict flags by hand');
    const strict = declarations.flatMap((declaration: unknown) =>
      typeof declaration === 'object' &&
      declaration !== null &&
      Reflect.get(declaration, 'strictFlag') === true &&
      typeof Reflect.get(declaration, 'name') === 'string'
        ? [String(Reflect.get(declaration, 'name'))]
        : [],
    );
    assert.deepEqual([...strictFlags].sort(), strict.sort());
  });
});
