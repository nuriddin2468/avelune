// Conversion of resolved DTCG 2025.10 values into CSS and typed TS values (ADR 0003, 0016, 0017). Pure functions:
// Style Dictionary resolves references, these decide exactly what is emitted, and the tests pin every output.

/** The DTCG types the token sources use. Any other type fails the build. */
export const tokenTypes = [
  'color',
  'dimension',
  'duration',
  'cubicBezier',
  'number',
  'fontWeight',
  'fontFamily',
  'shadow',
  'typography',
] as const;

export type TokenType = (typeof tokenTypes)[number];

/** A token after Style Dictionary resolved its references. */
export interface ResolvedToken {
  /** Path in the sources, such as ['color', 'bg', 'canvas']. */
  readonly path: readonly string[];
  readonly type: TokenType;
  /** The resolved DTCG `$value`. */
  readonly value: unknown;
  readonly extensions?: unknown;
}

export interface ShadowLayerValue {
  readonly color: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
  readonly inset: boolean;
}

export interface TypographyValue {
  readonly fontFamily: readonly string[];
  readonly fontSize: number;
  readonly fontWeight: number;
  /** In px: font size × the DTCG ratio. */
  readonly lineHeight: number;
  readonly letterSpacing: number;
}

/**
 * Typed value in TS: colours as hex strings, dimensions in px and durations in ms as numbers, easings as their four
 * control points, font families as lists.
 */
export type TokenValue =
  | string
  | number
  | readonly [number, number, number, number]
  | readonly string[]
  | readonly ShadowLayerValue[]
  | TypographyValue;

export interface ConvertedToken {
  /** The CSS custom property, `--ave-` plus the path in kebab case. */
  readonly cssVar: `--ave-${string}`;
  /** The CSS value of `cssVar`. */
  readonly css: string;
  readonly value: TokenValue;
  /** Extra custom properties: the parts of a typography token (family, size, weight, line height, letter spacing). */
  readonly parts: Readonly<Record<string, string>>;
}

export class TokenValueError extends Error {
  constructor(path: readonly string[], problem: string) {
    super(`${path.join('.')}: ${problem}`);
    this.name = 'TokenValueError';
  }
}

export function convertToken(token: ResolvedToken): ConvertedToken {
  const cssVar = cssVarName(token.path);
  switch (token.type) {
    case 'color': {
      const hex = colorHex(token.path, token.value);
      return { cssVar, css: hex, value: hex, parts: {} };
    }
    case 'dimension': {
      const px = dimensionPx(token.path, token.value);
      return { cssVar, css: `${px}px`, value: px, parts: {} };
    }
    case 'duration': {
      const ms = durationMs(token.path, token.value);
      return { cssVar, css: `${ms}ms`, value: ms, parts: {} };
    }
    case 'cubicBezier': {
      const points = cubicBezier(token.path, token.value);
      const stops = linearStops(token.path, token.extensions);
      const css = stops === undefined ? `cubic-bezier(${points.join(', ')})` : `linear(${stops.join(', ')})`;
      return { cssVar, css, value: points, parts: {} };
    }
    case 'number':
    case 'fontWeight': {
      const number = finiteNumber(token.path, token.value, token.type);
      return { cssVar, css: String(number), value: number, parts: {} };
    }
    case 'fontFamily': {
      const families = fontFamilies(token.path, token.value);
      return { cssVar, css: fontFamilyCss(families), value: families, parts: {} };
    }
    case 'shadow': {
      const layers = shadowLayers(token.path, token.value);
      return { cssVar, css: layers.map(shadowLayerCss).join(', '), value: layers, parts: {} };
    }
    case 'typography': {
      const typography = typographyValue(token.path, token.value);
      const family = fontFamilyCss(typography.fontFamily);
      return {
        cssVar,
        css: `${typography.fontWeight} ${typography.fontSize}px/${typography.lineHeight}px ${family}`,
        value: typography,
        parts: {
          [`${cssVar}-family`]: family,
          [`${cssVar}-size`]: `${typography.fontSize}px`,
          [`${cssVar}-weight`]: String(typography.fontWeight),
          [`${cssVar}-line-height`]: `${typography.lineHeight}px`,
          [`${cssVar}-letter-spacing`]: `${typography.letterSpacing}px`,
        },
      };
    }
  }
}

export function isTokenType(type: unknown): type is TokenType {
  return typeof type === 'string' && (tokenTypes as readonly string[]).includes(type);
}

export function cssVarName(path: readonly string[]): `--ave-${string}` {
  for (const segment of path) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment)) {
      throw new TokenValueError(path, `"${segment}" is not a kebab-case name segment`);
    }
  }
  return `--ave-${path.join('-')}`;
}

/** Six-digit hex, or eight-digit when alpha is below 1 (ADR 0011). Computed from the components, the normative value. */
function colorHex(path: readonly string[], value: unknown): string {
  if (!isRecord(value) || value['colorSpace'] !== 'srgb') {
    throw new TokenValueError(path, 'expected an sRGB colour object (the palette is sRGB only, ADR 0011)');
  }
  const components = value['components'];
  if (!Array.isArray(components) || components.length !== 3 || !components.every(isUnitInterval)) {
    throw new TokenValueError(path, 'expected three sRGB components between 0 and 1');
  }
  const alpha = value['alpha'] ?? 1;
  if (!isUnitInterval(alpha)) throw new TokenValueError(path, 'alpha must be between 0 and 1');
  const channels = alpha < 1 ? [...components, alpha] : components;
  return `#${channels
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Sources are in px (ADR 0017); rem would depend on the consumer's root font size. */
function dimensionPx(path: readonly string[], value: unknown): number {
  if (!isRecord(value) || value['unit'] !== 'px' || !isFiniteNumber(value['value'])) {
    throw new TokenValueError(path, 'expected a dimension in px');
  }
  return value['value'];
}

/** Style Dictionary's DTCG duration support is unfinished (ADR 0003): durations are converted here. */
function durationMs(path: readonly string[], value: unknown): number {
  if (!isRecord(value) || !isFiniteNumber(value['value']) || value['value'] < 0) {
    throw new TokenValueError(path, 'expected a non-negative duration');
  }
  if (value['unit'] === 'ms') return value['value'];
  if (value['unit'] === 's') return Math.round(value['value'] * 1000 * 1000) / 1000;
  throw new TokenValueError(path, 'duration unit must be ms or s');
}

function cubicBezier(path: readonly string[], value: unknown): readonly [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(isFiniteNumber)) {
    throw new TokenValueError(path, 'expected four cubic-bezier control points');
  }
  const [x1, y1, x2, y2] = value as [number, number, number, number];
  if (!isUnitInterval(x1) || !isUnitInterval(x2)) {
    throw new TokenValueError(path, 'cubic-bezier x coordinates must be between 0 and 1');
  }
  return [x1, y1, x2, y2];
}

/** `$extensions.avelune.linear`: the stops of a CSS linear() easing, which DTCG cannot express (ADR 0016). */
function linearStops(path: readonly string[], extensions: unknown): readonly number[] | undefined {
  if (!isRecord(extensions)) return undefined;
  const avelune = extensions['avelune'];
  if (!isRecord(avelune) || avelune['linear'] === undefined) return undefined;
  const stops = avelune['linear'];
  if (!Array.isArray(stops) || stops.length < 2 || !stops.every(isFiniteNumber)) {
    throw new TokenValueError(path, 'linear() needs at least two numeric stops');
  }
  if (stops[0] !== 0 || stops.at(-1) !== 1) {
    throw new TokenValueError(path, 'linear() stops must start at 0 and end at 1');
  }
  return stops;
}

function finiteNumber(path: readonly string[], value: unknown, type: TokenType): number {
  if (!isFiniteNumber(value)) throw new TokenValueError(path, `expected a number for ${type}`);
  return value;
}

function isFamilyList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.length > 0 && value.every((family) => typeof family === 'string' && family !== '')
  );
}

function fontFamilies(path: readonly string[], value: unknown): readonly string[] {
  const families = typeof value === 'string' ? [value] : value;
  if (!isFamilyList(families)) {
    throw new TokenValueError(path, 'expected a font family name or a list of them');
  }
  return families;
}

const genericFamilies = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

/** Generic families stay bare keywords; every other name is quoted. */
function fontFamilyCss(families: readonly string[]): string {
  return families.map((family) => (genericFamilies.has(family) ? family : `"${family}"`)).join(', ');
}

function shadowLayers(path: readonly string[], value: unknown): readonly ShadowLayerValue[] {
  const layers = Array.isArray(value) ? value : [value];
  return layers.map((layer, index) => {
    const layerPath = [...path, String(index)];
    if (!isRecord(layer)) throw new TokenValueError(layerPath, 'expected a shadow object');
    const inset = layer['inset'] ?? false;
    if (typeof inset !== 'boolean') throw new TokenValueError(layerPath, 'inset must be a boolean');
    return {
      color: colorHex(layerPath, layer['color']),
      offsetX: dimensionPx(layerPath, layer['offsetX']),
      offsetY: dimensionPx(layerPath, layer['offsetY']),
      blur: dimensionPx(layerPath, layer['blur']),
      spread: dimensionPx(layerPath, layer['spread']),
      inset,
    };
  });
}

function shadowLayerCss(layer: ShadowLayerValue): string {
  const lengths = [layer.offsetX, layer.offsetY, layer.blur, layer.spread].map((length) => `${length}px`).join(' ');
  return `${layer.inset ? 'inset ' : ''}${lengths} ${layer.color}`;
}

function typographyValue(path: readonly string[], value: unknown): TypographyValue {
  if (!isRecord(value)) throw new TokenValueError(path, 'expected a typography object');
  const fontSize = dimensionPx([...path, 'fontSize'], value['fontSize']);
  const ratio = value['lineHeight'];
  if (!isFiniteNumber(ratio) || ratio <= 0) throw new TokenValueError(path, 'lineHeight must be a positive ratio');
  return {
    fontFamily: fontFamilies([...path, 'fontFamily'], value['fontFamily']),
    fontSize,
    fontWeight: finiteNumber([...path, 'fontWeight'], value['fontWeight'], 'fontWeight'),
    // The ratio is stored with four decimals (20/14 = 1.4286), so the product is rounded back to the intended px.
    lineHeight: Math.round(fontSize * ratio * 100) / 100,
    letterSpacing: dimensionPx([...path, 'letterSpacing'], value['letterSpacing']),
  };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isUnitInterval(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}
