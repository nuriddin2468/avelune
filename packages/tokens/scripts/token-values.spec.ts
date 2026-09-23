import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TokenValueError, convertToken, cssVarName, type ResolvedToken, type TokenType } from './token-values.ts';

const px = (value: number) => ({ value, unit: 'px' });
const srgb = (components: readonly number[], alpha?: number) => ({
  colorSpace: 'srgb',
  components,
  ...(alpha === undefined ? {} : { alpha }),
});
const token = (type: TokenType, value: unknown, extensions?: unknown): ResolvedToken => ({
  path: ['group', 'name'],
  type,
  value,
  extensions,
});

describe('convertToken', () => {
  it('names the custom property after the path', () => {
    assert.equal(convertToken(token('number', 1)).cssVar, '--ave-group-name');
    assert.equal(cssVarName(['color', 'bg', 'surface-raised']), '--ave-color-bg-surface-raised');
  });

  it('writes an opaque colour as six-digit hex from its components', () => {
    const converted = convertToken(token('color', srgb([0.9137, 0.3294, 0.1255])));
    assert.equal(converted.css, '#e95420');
    assert.equal(converted.value, '#e95420');
  });

  it('writes a translucent colour as eight-digit hex', () => {
    assert.equal(convertToken(token('color', srgb([0.1176, 0.1059, 0.102], 0.48))).css, '#1e1b1a7a');
  });

  it('writes dimensions in px and keeps the number in TS', () => {
    const converted = convertToken(token('dimension', px(36)));
    assert.equal(converted.css, '36px');
    assert.equal(converted.value, 36);
  });

  // Style Dictionary's DTCG duration support is unfinished (ADR 0003); this pins the replacement.
  it('writes durations in ms, converting seconds', () => {
    assert.equal(convertToken(token('duration', { value: 120, unit: 'ms' })).css, '120ms');
    assert.equal(convertToken(token('duration', { value: 0.45, unit: 's' })).css, '450ms');
    assert.equal(convertToken(token('duration', { value: 0.45, unit: 's' })).value, 450);
  });

  it('writes cubic Béziers as cubic-bezier()', () => {
    const converted = convertToken(token('cubicBezier', [0.2, 0, 0, 1]));
    assert.equal(converted.css, 'cubic-bezier(0.2, 0, 0, 1)');
    assert.deepEqual(converted.value, [0.2, 0, 0, 1]);
  });

  it('writes linear() from $extensions.avelune.linear and keeps the Bézier fallback in TS', () => {
    const converted = convertToken(token('cubicBezier', [0.34, 1.36, 0.64, 1], { avelune: { linear: [0, 1.07, 1] } }));
    assert.equal(converted.css, 'linear(0, 1.07, 1)');
    assert.deepEqual(converted.value, [0.34, 1.36, 0.64, 1]);
  });

  it('quotes font family names but not generic families', () => {
    const converted = convertToken(token('fontFamily', ['IBM Plex Sans', 'ui-monospace', 'sans-serif']));
    assert.equal(converted.css, '"IBM Plex Sans", ui-monospace, sans-serif');
    assert.equal(convertToken(token('fontFamily', 'Menlo')).css, '"Menlo"');
  });

  it('writes numbers and font weights as they are', () => {
    assert.equal(convertToken(token('number', 0.97)).css, '0.97');
    assert.equal(convertToken(token('fontWeight', 600)).css, '600');
  });

  it('writes a shadow as its layers, in order', () => {
    const layer = (y: number, blur: number, alpha: number) => ({
      color: srgb([0.1176, 0.1059, 0.102], alpha),
      offsetX: px(0),
      offsetY: px(y),
      blur: px(blur),
      spread: px(0),
    });
    const converted = convertToken(token('shadow', [layer(2, 4, 0.08), layer(8, 16, 0.12)]));
    assert.equal(converted.css, '0px 2px 4px 0px #1e1b1a14, 0px 8px 16px 0px #1e1b1a1f');
    assert.equal(
      convertToken(token('shadow', { ...layer(1, 2, 0.5), inset: true })).css,
      'inset 0px 1px 2px 0px #1e1b1a80',
    );
  });

  it('writes typography as a font shorthand plus one property per part, with line height in px', () => {
    const converted = convertToken(
      token('typography', {
        fontFamily: ['IBM Plex Sans', 'sans-serif'],
        fontSize: px(14),
        fontWeight: 400,
        letterSpacing: px(0),
        lineHeight: 1.4286,
      }),
    );
    assert.equal(converted.css, '400 14px/20px "IBM Plex Sans", sans-serif');
    assert.deepEqual(converted.parts, {
      '--ave-group-name-family': '"IBM Plex Sans", sans-serif',
      '--ave-group-name-size': '14px',
      '--ave-group-name-weight': '400',
      '--ave-group-name-line-height': '20px',
      '--ave-group-name-letter-spacing': '0px',
    });
  });
});

describe('convertToken rejects', () => {
  const rejects = (resolved: ResolvedToken, message: RegExp) =>
    assert.throws(
      () => convertToken(resolved),
      (error) => error instanceof TokenValueError && message.test(error.message),
    );

  it('a colour outside sRGB', () => {
    rejects(token('color', { colorSpace: 'oklch', components: [0.6, 0.2, 38] }), /sRGB colour object/);
  });

  it('components out of range', () => {
    rejects(token('color', srgb([1.2, 0, 0])), /three sRGB components/);
  });

  it('a dimension in rem', () => {
    rejects(token('dimension', { value: 1, unit: 'rem' }), /dimension in px/);
  });

  it('a duration without a unit', () => {
    rejects(token('duration', { value: 120 }), /unit must be ms or s/);
  });

  it('a cubic Bézier with x outside 0–1', () => {
    rejects(token('cubicBezier', [1.2, 0, 0, 1]), /x coordinates/);
  });

  it('linear() stops that do not end at 1', () => {
    rejects(token('cubicBezier', [0, 0, 1, 1], { avelune: { linear: [0, 0.5] } }), /start at 0 and end at 1/);
  });

  it('a path segment that is not kebab case', () => {
    assert.throws(() => cssVarName(['color', 'bgSurface']), /not a kebab-case name segment/);
  });
});
