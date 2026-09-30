// Proves the brand generator (ADR 0089): the kit's orange gives back tokens.css exactly, every preset and thousands of
// seeded random colours pass every declared pair in both themes, measured here by colorjs.io's own contrast code,
// danger keeps its distance, and only a preset name or a #rrggbb colour is accepted.
import Color from 'colorjs.io';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  aveBrandFingerprint,
  aveBrandPresetNames,
  aveBrandStatusDistance,
  generateAveBrand,
  type AveBrand,
  type AveBrandInput,
} from './index.ts';
import { brandData } from './roles.ts';

const packageRoot = join(import.meta.dirname, '..');

/** The declarations of one block of a stylesheet, by custom property. */
function block(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `no ${selector} block`);
  const body = css.slice(start, css.indexOf('}', start));
  return new Map([...body.matchAll(/(--ave-[\w-]+): ([^;]+);/g)].map((match) => [match[1] ?? '', match[2] ?? '']));
}

/** An independent check of every declared pair: colorjs.io's object API, compositing in 8-bit sRGB. */
function failingPairs(brand: AveBrand): string[] {
  const failing: string[] = [];
  for (const theme of ['light', 'dark'] as const) {
    const values = brand[theme];
    const rgba = (name: string): [number[], number] => {
      const value = values[name];
      assert.ok(value !== undefined, `${theme}: ${name} has no value`);
      const channels = [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
      return [channels, value.length === 9 ? parseInt(value.slice(7), 16) / 255 : 1];
    };
    const onto = ([top, alpha]: [number[], number], bottom: number[]): number[] =>
      top.map((channel, index) => Math.round(channel * alpha + (bottom[index] ?? 0) * (1 - alpha)));
    const css = (channels: number[]) => new Color('srgb', channels.map((c) => c / 255) as [number, number, number]);
    for (const pair of brandData.pairs) {
      for (const foreground of pair.foreground) {
        for (const background of pair.background) {
          for (const surface of pair.over ?? [undefined]) {
            const bg = rgba(background);
            const backdrop = surface === undefined ? bg[0] : onto(bg, rgba(surface)[0]);
            const text = onto(rgba(foreground), backdrop);
            const ratio = css(text).contrast(css(backdrop), 'WCAG21');
            if (ratio + 1e-9 < pair.minimum)
              failing.push(`${theme} ${foreground} on ${background}: ${ratio.toFixed(2)}`);
          }
        }
      }
    }
  }
  return failing;
}

/** OKLab distance of two hex colours. */
function deltaE(a: string, b: string): number {
  return new Color(a).deltaE(new Color(b), 'OK');
}

/** A seeded generator (mulberry32), so a failing colour can be found again. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('the kit’s orange', () => {
  it('gives back the colour tokens of tokens.css in both themes', () => {
    const tokens = readFileSync(join(packageRoot, 'dist', 'tokens.css'), 'utf8');
    const brand = generateAveBrand('orange');
    for (const [selector, theme] of [
      [':root', 'light'],
      ["[data-theme='dark']", 'dark'],
    ] as const) {
      const built = block(tokens, selector);
      for (const role of brandData.roles) {
        assert.equal(brand[theme][role.name], built.get(role.cssVar), `${theme}: ${role.name}`);
      }
    }
  });

  it('keeps its exact colour on its step and reports the fill of each theme', () => {
    const brand = generateAveBrand('#E95420');
    assert.equal(brand.mark, '#e95420');
    assert.equal(brand.report.exact, true);
    assert.deepEqual(brand.report.adjustments, [
      { kind: 'fill', theme: 'light', step: 600, hex: '#b53700', text: 'light' },
      { kind: 'fill', theme: 'dark', step: 400, hex: '#ff8d6a', text: 'dark' },
    ]);
  });

  it('is farther from danger than the minimum distance, which the kit itself sets', () => {
    const brand = generateAveBrand('orange');
    const light = deltaE(brand.light['color.accent.bg'] ?? '', brand.light['color.danger.bg'] ?? '');
    const dark = deltaE(brand.dark['color.accent.bg'] ?? '', brand.dark['color.danger.bg'] ?? '');
    assert.ok(light >= aveBrandStatusDistance && dark >= aveBrandStatusDistance, `${String(light)}, ${String(dark)}`);
    assert.equal(aveBrandStatusDistance, 0.04);
    assert.ok(dark - aveBrandStatusDistance < 0.001, 'the minimum is the kit’s own distance in dark');
  });
});

describe('presets', () => {
  for (const name of aveBrandPresetNames) {
    it(`${name} passes every pair and keeps danger apart`, () => {
      const brand = generateAveBrand(name);
      assert.deepEqual(failingPairs(brand), []);
      for (const theme of ['light', 'dark'] as const) {
        const distance = deltaE(brand[theme]['color.accent.bg'] ?? '', brand[theme]['color.danger.bg'] ?? '');
        assert.ok(distance >= aveBrandStatusDistance - 1e-3, `${theme}: ${distance.toFixed(4)}`);
      }
    });
  }

  it('moves danger for a red brand, within the red range', () => {
    const brand = generateAveBrand('red');
    const moved = brand.report.adjustments.find((adjustment) => adjustment.kind === 'danger');
    assert.deepEqual(moved, { kind: 'danger', fromHue: 22, toHue: 8 });
  });

  it('keeps a dark brand exact as the light fill and reports a status it resembles', () => {
    const navy = generateAveBrand('navy');
    assert.equal(navy.light['color.accent.bg'], '#1b365d');
    assert.ok(
      navy.report.adjustments.some((adjustment) => adjustment.kind === 'near-status' && adjustment.status === 'info'),
    );
  });
});

describe('any colour', () => {
  const random = seeded(20260930);
  const colours = Array.from(
    { length: 3000 },
    () =>
      `#${Math.floor(random() * 0x1000000)
        .toString(16)
        .padStart(6, '0')}` as AveBrandInput,
  );
  const stress: readonly AveBrandInput[] = [
    '#fff9c4',
    '#00e5ff',
    '#050505',
    '#fdfdfd',
    '#e00000',
    '#00c853',
    '#808080',
  ];

  it('passes every pair in both themes for 3000 seeded colours and the stress colours', () => {
    const failing: string[] = [];
    for (const colour of [...stress, ...colours]) {
      const brand = generateAveBrand(colour);
      const pairs = failingPairs(brand);
      if (pairs.length > 0) failing.push(`${colour}: ${pairs.slice(0, 3).join('; ')}`);
      if (brand.mark !== colour.toLowerCase()) failing.push(`${colour}: the mark is ${brand.mark}`);
    }
    assert.deepEqual(failing.slice(0, 10), []);
  });

  it('keeps danger apart from every chromatic accent', () => {
    const near: string[] = [];
    for (const colour of colours.slice(0, 1000)) {
      const brand = generateAveBrand(colour);
      if ((new Color(colour).to('oklch').coords[1] ?? 0) < 0.02) continue;
      for (const theme of ['light', 'dark'] as const) {
        const distance = deltaE(brand[theme]['color.accent.bg'] ?? '', brand[theme]['color.danger.bg'] ?? '');
        if (distance < aveBrandStatusDistance - 1e-3) near.push(`${colour} ${theme}: ${distance.toFixed(4)}`);
      }
    }
    assert.deepEqual(near.slice(0, 10), []);
  });

  it('carries the fingerprint the light presets entry gives a page', () => {
    assert.equal(generateAveBrand('#123abc').fingerprint, aveBrandFingerprint);
    assert.equal(brandData.fingerprint, aveBrandFingerprint);
  });

  it('gives the same stylesheet for the same colour', () => {
    for (const colour of colours.slice(0, 50)) {
      assert.equal(generateAveBrand(colour).css, generateAveBrand(colour).css);
    }
  });
});

describe('input and output', () => {
  it('accepts a preset name or a six-digit hex colour only', () => {
    for (const input of ['#abc', 'e95420', '#e95420ff', 'red ', 'url(x)', '#e9542g', 'rgb(1,2,3)']) {
      assert.throws(() => generateAveBrand(input as AveBrandInput), /neither a preset nor a #rrggbb colour/, input);
    }
  });

  it('writes every colour role four times, as computed hex values in the layer of tokens.css', () => {
    const { css } = generateAveBrand('#123abc');
    assert.match(
      css,
      /^\/\* Avelune brand, generated by @avelune\/tokens\/brand \([0-9a-f]{12}\); do not edit\. \*\/\n@layer tokens \{/,
    );
    for (const selector of [
      ':root',
      "[data-theme='light']",
      ":root:not([data-theme='light'])",
      "[data-theme='dark']",
    ]) {
      const values = block(css, selector);
      assert.equal(values.size, brandData.roles.length, selector);
      for (const value of values.values()) assert.match(value, /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/);
    }
    assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n {4}:root:not\(\[data-theme='light'\]\)/);
  });
});
