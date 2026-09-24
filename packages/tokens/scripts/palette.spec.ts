import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { paletteConfig } from './palette.config.ts';
import {
  PaletteError,
  contrast,
  generatePalette,
  hueDrift,
  hueDriftTolerance,
  paletteToTokens,
  steps,
  type ColorToken,
  type PaletteConfig,
} from './palette.ts';

type Config = typeof paletteConfig;
type ScaleName = Config extends PaletteConfig<infer S> ? S : never;

/** The real configuration with one change, so each failing case isolates one rule. */
function withChange(change: (config: Config) => PaletteConfig<ScaleName>): PaletteConfig<ScaleName> {
  return change(paletteConfig);
}

function violationsOf(config: PaletteConfig<ScaleName>): readonly string[] {
  try {
    generatePalette(config);
  } catch (error) {
    if (error instanceof PaletteError) return error.violations;
    throw error;
  }
  assert.fail('expected the palette to be rejected');
}

describe('generatePalette with the repository configuration', () => {
  const palette = generatePalette(paletteConfig);

  it('generates every step of every configured scale as six-digit hex', () => {
    assert.deepEqual(Object.keys(palette.scales), Object.keys(paletteConfig.scales));
    for (const colors of Object.values(palette.scales)) {
      assert.deepEqual(Object.keys(colors).map(Number), [...steps]);
      for (const step of steps) assert.match(colors[step].hex, /^#[0-9a-f]{6}$/);
    }
  });

  it('puts every generated step at the lightness of the ladder', () => {
    for (const colors of Object.values(palette.scales)) {
      for (const step of steps) {
        if (colors[step].exact) continue;
        assert.ok(Math.abs(colors[step].oklch[0] - paletteConfig.lightness[step]) <= 0.005, `step ${step}`);
      }
    }
  });

  it('keeps the brand colour exact at its step', () => {
    const brand = palette.scales[paletteConfig.brand.scale]?.[paletteConfig.brand.step];
    assert.ok(brand !== undefined);
    assert.equal(brand.hex, paletteConfig.brand.hex);
    assert.equal(brand.exact, true);
  });

  it('lets no brand-coloured text onto white: the brand fails 4.5:1, so accent text needs another step', () => {
    const brand = palette.scales[paletteConfig.brand.scale]?.[paletteConfig.brand.step];
    assert.ok(brand !== undefined);
    assert.ok(contrast(brand, palette.white) < 4.5);
  });

  it('is deterministic', () => {
    assert.deepEqual(generatePalette(paletteConfig), palette);
  });
});

describe('generatePalette rejects', () => {
  it('a ladder whose text step is too light for light surfaces', () => {
    const violations = violationsOf(
      withChange((config) => ({ ...config, lightness: { ...config.lightness, 600: 0.6 } })),
    );
    assert.ok(violations.some((v) => /^\w+\.600 on white: .* below 4\.5:1 \(text on light surfaces\)$/.test(v)));
  });

  it('a ladder whose lightness does not decrease', () => {
    const violations = violationsOf(
      withChange((config) => ({ ...config, lightness: { ...config.lightness, 850: 0.25 } })),
    );
    assert.ok(violations.includes('lightness must decrease from step to step: 850 is not lighter than 900'));
  });

  it('a lightness the sRGB gamut cannot reach', () => {
    const violations = violationsOf(
      withChange((config) => ({ ...config, lightness: { ...config.lightness, 50: 1.2 } })),
    );
    assert.ok(violations.some((v) => /^\w+\.50: lightness 1\.000 drifted from 1\.2$/.test(v)));
  });

  it('a brand colour too far from the lightness of its step', () => {
    const violations = violationsOf(
      withChange((config) => ({ ...config, brand: { ...config.brand, hex: '#ff9966' } })),
    );
    assert.ok(violations.some((v) => v.startsWith('brand #ff9966 has lightness')));
  });

  it('a brand colour that is not six-digit hex', () => {
    const violations = violationsOf(withChange((config) => ({ ...config, brand: { ...config.brand, hex: '#e54' } })));
    assert.deepEqual(violations, ['#e54 is not a six-digit hex colour']);
  });

  it('neutrals tinted more than the brief allows', () => {
    const violations = violationsOf(
      withChange((config) => ({
        ...config,
        scales: { ...config.scales, neutral: { ...config.scales.neutral, chroma: 0.03 } },
      })),
    );
    assert.ok(violations.some((v) => /^neutral: peak chroma 0\.0\d+ is outside 0\.005–0\.015$/.test(v)));
  });

  it('neutrals tinted away from the brand hue', () => {
    const violations = violationsOf(
      withChange((config) => ({
        ...config,
        scales: { ...config.scales, neutral: { ...config.scales.neutral, hue: 250 } },
      })),
    );
    assert.ok(violations.some((v) => v.startsWith('neutral: hue 250 is more than 5° from the brand hue')));
  });

  it('an alpha percentage outside 1–99', () => {
    const violations = violationsOf(
      withChange((config) => ({
        ...config,
        alpha: { ...config.alpha, 'white-alpha': { base: 'white', percentages: [0, 100] } },
      })),
    );
    assert.deepEqual(violations, [
      'alpha series white-alpha: 0 is not a whole percentage between 1 and 99',
      'alpha series white-alpha: 100 is not a whole percentage between 1 and 99',
    ]);
  });
});

describe('hueDrift', () => {
  it('flags the hue shift that clipping produces', () => {
    // Orange at L 0.52 through the CSS gamut-mapping algorithm alone: H 38 becomes H 32.7 (ADR 0011, addendum).
    assert.ok(hueDrift([0.2, 38], [0.196, 32.7]) > hueDriftTolerance);
  });

  it('ignores the hue swing of 8-bit rounding on a pale tint', () => {
    assert.ok(hueDrift([0.024, 72], [0.024, 69.6]) <= hueDriftTolerance);
  });
});

describe('paletteToTokens', () => {
  const tokens = paletteToTokens(generatePalette(paletteConfig), 'description');
  const isToken = (value: ColorToken | Readonly<Record<string, ColorToken>>): value is ColorToken => '$value' in value;
  const entries = Object.entries(tokens.color).flatMap(([name, value]): (readonly [string, ColorToken])[] => {
    if (typeof value === 'string') return [];
    if (isToken(value)) return [[name, value]];
    return Object.entries(value).map(([key, token]) => [`${name}.${key}`, token]);
  });

  it('writes DTCG sRGB colours whose components match the hex fallback', () => {
    assert.ok(entries.length > 0);
    for (const [name, token] of entries) {
      const { colorSpace, components, hex } = token.$value;
      assert.equal(colorSpace, 'srgb', name);
      assert.match(hex, /^#[0-9a-f]{6}$/, name);
      const fromHex = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
      assert.deepEqual(
        components.map((component) => Math.round(component * 255)),
        fromHex,
        name,
      );
    }
  });

  it('writes alpha only below 1', () => {
    for (const [name, token] of entries) {
      const alpha = token.$value.alpha;
      assert.equal(name.includes('-alpha.'), alpha !== undefined, name);
      if (alpha !== undefined) assert.ok(alpha > 0 && alpha < 1, name);
    }
  });
});

describe('generate-colors', () => {
  const script = join(import.meta.dirname, 'generate-colors.ts');
  const committed = join(import.meta.dirname, '..', 'src', 'primitives.color.tokens.json');
  const run = (file: string) => spawnSync(process.execPath, [script, file], { encoding: 'utf8' });

  it('accepts the committed primitives', () => {
    const result = run(committed);
    assert.equal(result.status, 0, result.stderr);
  });

  it('rejects a hand-edited copy', () => {
    const directory = mkdtempSync(join(tmpdir(), 'avelune-colors-'));
    try {
      const copy = join(directory, 'primitives.color.tokens.json');
      writeFileSync(copy, readFileSync(committed, 'utf8').replace(/"#[0-9a-f]{6}"/, '"#000000"'));
      const result = run(copy);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /is not what palette\.config\.ts generates/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
