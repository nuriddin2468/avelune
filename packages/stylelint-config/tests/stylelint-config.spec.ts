// Proves @avelune/stylelint-config as an application loads it: `extends` resolves the built dist/index.js by the
// package's name, each rule group rejects its violation, and a legacy override turns errors into warnings (ADR 0104).
import config from '../dist/index.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import stylelint from 'stylelint';

const packageDir = join(import.meta.dirname, '..');

/** The rule and severity of every finding for `code` linted as `file` by an application's config. */
async function lint(
  code: string,
  file = 'src/app/card.css',
  legacy: readonly string[] = [],
): Promise<readonly string[]> {
  const { results } = await stylelint.lint({
    code,
    codeFilename: join(packageDir, file),
    configBasedir: packageDir,
    config: {
      extends: ['@avelune/stylelint-config'],
      overrides: legacy.length === 0 ? [] : [{ files: [...legacy], defaultSeverity: 'warning' }],
    },
  });
  const result = results[0];
  assert.ok(result !== undefined);
  assert.deepEqual(result.invalidOptionWarnings, []);
  return [...new Set(result.warnings.map((warning) => `${warning.rule} ${warning.severity}`))].sort();
}

const clean = `
.card {
  --card-gap: var(--ave-space-4);

  display: grid;
  gap: var(--card-gap);
  padding-inline: var(--ave-space-4);
  color: var(--ave-color-fg-default);
  background-color: var(--ave-color-bg-surface);
  border-radius: var(--ave-radius-md);
  transition-property: background-color;
  transition-duration: var(--ave-duration-fast);

  &:hover {
    background-color: var(--ave-color-bg-hover);
  }
}

@media (min-width: 600px) {
  .card {
    grid-template-columns: 1fr 1fr;
  }
}
`;

/** One violation per rule group, and the rules it must produce. */
const violations: readonly (readonly [string, string, readonly string[]])[] = [
  ['a raw colour', '.a { color: #e95420; }', ['color-no-hex', 'scale-unlimited/declaration-strict-value']],
  ['a named colour', '.a { color: red; }', ['color-named', 'scale-unlimited/declaration-strict-value']],
  ['a colour function', '.a { background-color: oklch(0.6 0.2 40); }', ['function-disallowed-list']],
  [
    'a raw length',
    '.a { padding-inline: 12px; }',
    ['scale-unlimited/declaration-strict-value', 'unit-disallowed-list'],
  ],
  ['!important', '.a { display: none !important; }', ['declaration-no-important']],
  ['an id selector', '#a { display: none; }', ['selector-max-id']],
  ['::ng-deep', '::ng-deep .a { display: none; }', ['selector-disallowed-list']],
  ['a motion shorthand', '.a { transition: all var(--ave-duration-fast); }', ['property-disallowed-list']],
  ['transition of all', '.a { transition-property: all; }', ['declaration-property-value-disallowed-list']],
  ['local keyframes', '@keyframes spin { to { rotate: 1turn; } }', ['at-rule-disallowed-list']],
  ['an outline', '.a { outline: none; }', ['property-disallowed-list']],
  [':focus', '.a:focus { color: var(--ave-color-fg-default); }', ['selector-pseudo-class-disallowed-list']],
  ['a physical property', '.a { margin-left: var(--ave-space-4); }', ['logical-css/require-logical-properties']],
  ['a raw breakpoint', '@media (min-width: 700px) { .a { display: none; } }', ['avelune/media-query-tokens']],
  ['a nested descendant', '.a { .b { display: none; } }', ['avelune/nesting-same-element']],
  ['a token declared', '.a { --ave-color-bg-canvas: var(--ave-color-bg-surface); }', ['avelune/no-token-declarations']],
  ['an unknown token', '.a { color: var(--ave-color-fg-defualt); }', ['avelune/known-tokens']],
];

describe('an application’s CSS', () => {
  it('accepts tokens, logical properties, its own properties and the kit’s breakpoints', async () => {
    assert.deepEqual(await lint(clean), []);
  });

  for (const [name, code, rules] of violations) {
    it(`rejects ${name}`, async () => {
      assert.deepEqual(await lint(code), rules.map((rule) => `${rule} error`).sort());
    });
  }

  it('has a violation for every avelune rule it enables', () => {
    const proven = new Set(violations.flatMap(([, , rules]) => rules));
    const enabled = Object.keys(config.rules ?? {}).filter((rule) => rule.startsWith('avelune/'));
    assert.ok(enabled.length > 0);
    assert.deepEqual(
      enabled.filter((rule) => !proven.has(rule)),
      [],
    );
  });

  it('warns on legacy paths and fails everywhere else', async () => {
    const raw = '.a { color: #e95420; }';
    assert.deepEqual(await lint(raw, 'src/app/legacy/old.css', ['src/app/legacy/**']), [
      'color-no-hex warning',
      'scale-unlimited/declaration-strict-value warning',
    ]);
    assert.deepEqual(await lint(raw, 'src/app/new.css', ['src/app/legacy/**']), [
      'color-no-hex error',
      'scale-unlimited/declaration-strict-value error',
    ]);
  });
});

describe('the bundle', () => {
  it('is what an application gets for the package’s name', () => {
    assert.equal(
      import.meta.resolve('@avelune/stylelint-config'),
      pathToFileURL(join(packageDir, 'dist', 'index.js')).href,
    );
  });

  it('imports only the packages its manifest names, and Node’s built-ins', () => {
    const manifest: unknown = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
    const declared = ['peerDependencies', 'dependencies'].flatMap((field) => {
      const section: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, field) : null;
      return typeof section === 'object' && section !== null ? Object.keys(section) : [];
    });
    const bundle = readFileSync(join(packageDir, 'dist', 'index.js'), 'utf8');
    const imported = [...bundle.matchAll(/^import\b[^;]*?from "([^"]+)"/gm)].map((match) => match[1] ?? '');
    assert.ok(imported.length > 0);
    assert.deepEqual(
      imported.filter(
        (specifier) =>
          !specifier.startsWith('node:') &&
          !declared.some((name) => specifier === name || specifier.startsWith(`${name}/`)),
      ),
      [],
    );
  });
});
