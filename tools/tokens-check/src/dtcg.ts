// Reading DTCG 2025.10 token files without Style Dictionary (ADR 0003: the check trusts nothing it validates).
// Flattens groups into tokens, applies $type inheritance and validates every value against the Format and Color
// modules. References are collected here and resolved by check.ts.

/** Types defined by the DTCG 2025.10 Format module. */
export const dtcgTypes = [
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
] as const;

export type DtcgType = (typeof dtcgTypes)[number];

export interface FlatToken {
  /** Dot path, such as `color.bg.canvas`. */
  readonly path: string;
  readonly file: string;
  /** Own `$type`, or the closest group's. Undefined when it can only come from a reference. */
  readonly declaredType: DtcgType | undefined;
  readonly value: unknown;
  readonly extensions: unknown;
}

export interface Problem {
  readonly file: string;
  readonly token: string | undefined;
  readonly message: string;
}

const tokenProperties = new Set(['$value', '$type', '$description', '$extensions', '$deprecated']);
const groupProperties = new Set(['$type', '$description', '$extensions', '$deprecated']);

/** Flattens one parsed file. Structural problems (names, unknown properties, types) go into `problems`. */
export function flatten(file: string, json: unknown, problems: Problem[]): FlatToken[] {
  const tokens: FlatToken[] = [];
  if (!isRecord(json)) {
    problems.push({ file, token: undefined, message: 'the file must contain a JSON object' });
    return tokens;
  }

  const walk = (group: Readonly<Record<string, unknown>>, path: readonly string[], inherited: DtcgType | undefined) => {
    const groupType = readType(group, file, path, problems) ?? inherited;
    for (const [key, child] of Object.entries(group)) {
      if (key.startsWith('$')) {
        if (!groupProperties.has(key) && !(key === '$comment' && path.length === 0)) {
          problems.push({ file, token: path.join('.') || undefined, message: `unknown group property ${key}` });
        }
        continue;
      }
      const childPath = [...path, key];
      if (/[{}.]/.test(key)) {
        problems.push({ file, token: childPath.join('.'), message: 'a name must not contain {, } or .' });
        continue;
      }
      if (!isRecord(child)) {
        problems.push({ file, token: childPath.join('.'), message: 'expected a token or a group object' });
        continue;
      }
      if ('$value' in child) {
        for (const property of Object.keys(child)) {
          if (!tokenProperties.has(property)) {
            problems.push({ file, token: childPath.join('.'), message: `unknown token property ${property}` });
          }
        }
        tokens.push({
          path: childPath.join('.'),
          file,
          declaredType: readType(child, file, childPath, problems) ?? groupType,
          value: child['$value'],
          extensions: child['$extensions'],
        });
      } else {
        walk(child, childPath, groupType);
      }
    }
  };

  walk(json, [], undefined);
  return tokens;
}

function readType(
  node: Readonly<Record<string, unknown>>,
  file: string,
  path: readonly string[],
  problems: Problem[],
): DtcgType | undefined {
  const type = node['$type'];
  if (type === undefined) return undefined;
  if (!isDtcgType(type)) {
    problems.push({ file, token: path.join('.') || undefined, message: `unknown $type ${JSON.stringify(type)}` });
    return undefined;
  }
  return type;
}

/** `{a.b.c}` → `a.b.c`; anything else → undefined. */
export function referenceTarget(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^\{([^{}]+)\}$/.exec(value);
  return match?.[1];
}

/** A value position inside a token: where it is, which type it must have, and the value itself. */
export interface Slot {
  readonly field: string;
  readonly type: DtcgType;
  readonly value: unknown;
}

/** Every typed position of a value: the value itself, or the fields of a composite. */
export function slots(type: DtcgType, value: unknown): readonly Slot[] {
  if (referenceTarget(value) !== undefined) return [{ field: '$value', type, value }];
  if (type === 'shadow') {
    const layers = Array.isArray(value) ? value : [value];
    return layers.flatMap((layer: unknown, index): Slot[] => {
      if (!isRecord(layer)) return [{ field: `[${index}]`, type: 'shadow', value: layer }];
      return [
        { field: `[${index}].color`, type: 'color', value: layer['color'] },
        { field: `[${index}].offsetX`, type: 'dimension', value: layer['offsetX'] },
        { field: `[${index}].offsetY`, type: 'dimension', value: layer['offsetY'] },
        { field: `[${index}].blur`, type: 'dimension', value: layer['blur'] },
        { field: `[${index}].spread`, type: 'dimension', value: layer['spread'] },
      ];
    });
  }
  if (type === 'typography' && isRecord(value)) {
    return [
      { field: 'fontFamily', type: 'fontFamily', value: value['fontFamily'] },
      { field: 'fontSize', type: 'dimension', value: value['fontSize'] },
      { field: 'fontWeight', type: 'fontWeight', value: value['fontWeight'] },
      { field: 'letterSpacing', type: 'dimension', value: value['letterSpacing'] },
      { field: 'lineHeight', type: 'number', value: value['lineHeight'] },
    ];
  }
  return [{ field: '$value', type, value }];
}

const fontWeightAliases = new Set([
  'thin',
  'hairline',
  'extra-light',
  'ultra-light',
  'light',
  'normal',
  'regular',
  'book',
  'medium',
  'semi-bold',
  'demi-bold',
  'bold',
  'extra-bold',
  'ultra-bold',
  'black',
  'heavy',
  'extra-black',
  'ultra-black',
]);

const colorSpaces = new Set([
  'srgb',
  'srgb-linear',
  'hsl',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
  'xyz-d65',
  'xyz-d50',
]);

/**
 * Problems with a literal (non-reference) value of the given type, per DTCG 2025.10. Composites are checked field by
 * field through `slots`; this checks their shape only.
 */
export function literalProblems(type: DtcgType, value: unknown, extensions: unknown): readonly string[] {
  switch (type) {
    case 'color':
      return colorProblems(value);
    case 'dimension':
      return isRecord(value) && isNumber(value['value']) && (value['unit'] === 'px' || value['unit'] === 'rem')
        ? []
        : ['a dimension is { value: number, unit: "px" | "rem" }'];
    case 'duration':
      return isRecord(value) &&
        isNumber(value['value']) &&
        value['value'] >= 0 &&
        (value['unit'] === 'ms' || value['unit'] === 's')
        ? []
        : ['a duration is { value: number ≥ 0, unit: "ms" | "s" }'];
    case 'cubicBezier':
      return [...cubicBezierProblems(value), ...linearExtensionProblems(extensions)];
    case 'number':
      return isNumber(value) ? [] : ['a number token needs a JSON number'];
    case 'fontWeight':
      return (isNumber(value) && value >= 1 && value <= 1000) ||
        (typeof value === 'string' && fontWeightAliases.has(value))
        ? []
        : ['a font weight is a number from 1 to 1000 or a DTCG alias'];
    case 'fontFamily':
      return typeof value === 'string' ||
        (Array.isArray(value) && value.length > 0 && value.every((name) => typeof name === 'string'))
        ? []
        : ['a font family is a name or a non-empty list of names'];
    case 'shadow': {
      const layers = Array.isArray(value) ? value : [value];
      return layers.every((layer) => referenceTarget(layer) !== undefined || shadowShape(layer))
        ? []
        : ['a shadow layer needs color, offsetX, offsetY, blur and spread (inset optional, boolean)'];
    }
    case 'typography':
      return isRecord(value) &&
        ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'].every((field) => field in value)
        ? []
        : ['typography needs fontFamily, fontSize, fontWeight, letterSpacing and lineHeight'];
    case 'strokeStyle':
    case 'border':
    case 'transition':
    case 'gradient':
      return [`$type ${type} is valid DTCG but not used by Avelune; add support to tokens-check before using it`];
  }
}

function colorProblems(value: unknown): readonly string[] {
  if (!isRecord(value)) return ['a colour is { colorSpace, components, alpha?, hex? }'];
  const problems: string[] = [];
  const space = value['colorSpace'];
  if (typeof space !== 'string' || !colorSpaces.has(space))
    problems.push(`unknown colorSpace ${JSON.stringify(space)}`);
  const components = value['components'];
  if (!Array.isArray(components) || components.length !== 3) {
    problems.push('components must be an array of three');
    return problems;
  }
  if (!components.every((component) => isNumber(component) || component === 'none')) {
    problems.push('components must be numbers or "none"');
  }
  const alpha = value['alpha'];
  if (alpha !== undefined && !(isNumber(alpha) && alpha >= 0 && alpha <= 1)) problems.push('alpha must be 0–1');
  if (space === 'srgb' && components.every(isNumber)) {
    if (!components.every((component) => component >= 0 && component <= 1)) problems.push('sRGB components are 0–1');
    const hex = value['hex'];
    if (hex !== undefined) {
      if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) {
        problems.push('hex must be six-digit CSS hex (alpha goes in "alpha")');
      } else if (hex.toLowerCase() !== srgbHex(components)) {
        problems.push(`hex ${hex} does not match the components (${srgbHex(components)})`);
      }
    }
  }
  return problems;
}

function cubicBezierProblems(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length !== 4 || !value.every(isNumber)) {
    return ['a cubic Bézier is four numbers'];
  }
  const [x1, , x2] = value;
  return x1 !== undefined && x2 !== undefined && x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1
    ? []
    : ['cubic Bézier x coordinates must be 0–1'];
}

/** The repository's extension for CSS linear() easings (ADR 0016). */
function linearExtensionProblems(extensions: unknown): readonly string[] {
  if (!isRecord(extensions) || !isRecord(extensions['avelune'])) return [];
  const stops = extensions['avelune']['linear'];
  if (stops === undefined) return [];
  return Array.isArray(stops) && stops.length >= 2 && stops.every(isNumber) && stops[0] === 0 && stops.at(-1) === 1
    ? []
    : ['$extensions.avelune.linear must be numbers from 0 to 1'];
}

function shadowShape(layer: unknown): boolean {
  return (
    isRecord(layer) &&
    ['color', 'offsetX', 'offsetY', 'blur', 'spread'].every((field) => field in layer) &&
    (layer['inset'] === undefined || typeof layer['inset'] === 'boolean')
  );
}

export function srgbHex(components: readonly number[]): string {
  return `#${components
    .map((component) =>
      Math.round(component * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

export function isDtcgType(value: unknown): value is DtcgType {
  return typeof value === 'string' && (dtcgTypes as readonly string[]).includes(value);
}

export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
