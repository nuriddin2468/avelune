import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { checkTokens, composite, rules, type Rule } from './check.ts';
import { overlay, readFiles } from './files.ts';

const fixtures = join(import.meta.dirname, '..', 'fixtures');
const valid = readFiles(join(fixtures, 'valid'));

/** Each fixture replaces one or two files of `valid` and must be rejected by the named rule. */
const cases: readonly { readonly name: string; readonly rule: Rule; readonly message: RegExp }[] = [
  { name: 'manifest-missing-file', rule: 'manifest', message: /listed in sources\.json but missing/ },
  { name: 'schema-no-type', rule: 'schema', message: /no \$type/ },
  { name: 'schema-dimension-unit', rule: 'schema', message: /a dimension is/ },
  { name: 'schema-hex-mismatch', rule: 'schema', message: /hex #fefefe does not match the components/ },
  { name: 'schema-unknown-type', rule: 'schema', message: /unknown \$type "spacing"/ },
  { name: 'reference-unresolved', rule: 'reference', message: /\{color\.grey\.500\} does not resolve/ },
  { name: 'reference-group', rule: 'reference', message: /\{color\.grey\} is a group/ },
  {
    name: 'reference-type-mismatch',
    rule: 'reference',
    message: /expects a dimension; \{font-weight\.400\} is a fontWeight/,
  },
  { name: 'reference-cycle', rule: 'reference', message: /reference cycle: control\.height\.(md|lg) → / },
  { name: 'naming-colour-word', rule: 'naming', message: /"grey" names a colour/ },
  { name: 'naming-number', rule: 'naming', message: /contains a number/ },
  { name: 'naming-case', rule: 'naming', message: /"largeGap" is not kebab case/ },
  {
    name: 'tier-skip',
    rule: 'tier',
    message: /a component token must reference the semantic tier; \{dimension\.32\} is primitive/,
  },
  { name: 'tier-literal', rule: 'tier', message: /semantic color values must reference the primitive tier/ },
  { name: 'tier-primitive-reference', rule: 'tier', message: /primitives hold values, not references/ },
  { name: 'line-height-grid', rule: 'line-height', message: /16px × 1\.4 = 22\.40px, not a multiple of 4/ },
  {
    name: 'overrides-dark-missing',
    rule: 'overrides',
    message: /missing: src\/semantic\.light\.tokens\.json declares it/,
  },
  {
    name: 'overrides-extra',
    rule: 'overrides',
    message: /overrides a token that src\/component\.tokens\.json does not declare/,
  },
  {
    name: 'contrast-light',
    rule: 'contrast',
    message: /^light: color\.fg\.default on color\.bg\.surface is 1\.6\d:1, below 4\.5:1/,
  },
  { name: 'contrast-dark', rule: 'contrast', message: /^dark: color\.fg\.default on color\.bg\.surface is 1\.00:1/ },
  { name: 'contrast-never-text', rule: 'contrast', message: /is never paired with text/ },
  { name: 'contrast-unknown-token', rule: 'contrast', message: /not a colour token in the light theme/ },
  {
    name: 'contrast-translucent-without-over',
    rule: 'contrast',
    message: /translucent background needs an "over" surface/,
  },
  { name: 'output-primitive', rule: 'output', message: /primitive emitted as --ave-color-grey-900/ },
  { name: 'output-missing-token', rule: 'output', message: /--ave-space-1 is not declared/ },
];

describe('tokens-check', () => {
  it('accepts the valid fixture', () => {
    assert.deepEqual(checkTokens(valid).violations, []);
  });

  it('accepts the repository tokens (after `nx build tokens`)', () => {
    const report = checkTokens(readFiles(join(import.meta.dirname, '..', '..', '..', 'packages', 'tokens')));
    assert.deepEqual(report.violations, []);
    assert.deepEqual(report.themes, ['light', 'dark']);
    assert.ok(report.pairs > 0);
  });

  it('has a failing fixture for every rule', () => {
    const covered = new Set(cases.map((fixture) => fixture.rule));
    assert.deepEqual(
      rules.filter((rule) => !covered.has(rule)),
      [],
    );
  });

  for (const fixture of cases) {
    it(`rejects ${fixture.name} (${fixture.rule})`, () => {
      const { violations } = checkTokens(overlay(valid, readFiles(join(fixtures, fixture.name))));
      assert.ok(
        violations.some((violation) => violation.rule === fixture.rule && fixture.message.test(violation.message)),
        `expected a ${fixture.rule} violation matching ${fixture.message}; got:\n${violations
          .map((violation) => `  [${violation.rule}] ${violation.message}`)
          .join('\n')}`,
      );
    });
  }
});

describe('composite', () => {
  it('rounds to 8 bits per channel, as the browser paints', () => {
    // White at 8% over #342f2d paints #44403e; unrounded it would be 68.2, 63.6, 61.8.
    const painted = composite({ rgb: [1, 1, 1], alpha: 0.08 }, { rgb: [0x34 / 255, 0x2f / 255, 0x2d / 255], alpha: 1 });
    assert.deepEqual(
      painted.rgb.map((channel) => Math.round(channel * 255 * 1000) / 1000),
      [0x44, 0x40, 0x3e],
    );
  });
});
