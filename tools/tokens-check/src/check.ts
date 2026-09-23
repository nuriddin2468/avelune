// tools/tokens-check (brief §4.3, ADR 0003, 0011, 0016, 0017). Validates a token package from its files alone:
// DTCG schema, references, naming, tier direction, line-height grid, override parity, declared contrast pairs in every
// theme, and the built CSS. Pure: `files` maps package-relative paths to contents, so fixtures can be overlaid.
import Color from 'colorjs.io';
import {
  flatten,
  isNumber,
  isRecord,
  literalProblems,
  referenceTarget,
  slots,
  type DtcgType,
  type FlatToken,
  type Problem,
} from './dtcg.ts';

export const rules = [
  'manifest',
  'schema',
  'reference',
  'naming',
  'tier',
  'line-height',
  'overrides',
  'contrast',
  'output',
] as const;

export type Rule = (typeof rules)[number];

export interface Violation {
  readonly rule: Rule;
  readonly file: string | undefined;
  readonly token: string | undefined;
  readonly message: string;
}

export interface Report {
  readonly violations: readonly Violation[];
  readonly tokens: number;
  readonly pairs: number;
  readonly themes: readonly string[];
}

/** Package-relative path → file contents. */
export type Files = ReadonlyMap<string, string>;

const tiers = ['primitive', 'semantic', 'component'] as const;
type Tier = (typeof tiers)[number];

/** Types whose semantic and component values must be references to the tier below (ADR 0016). */
const referenceOnlyTypes: ReadonlySet<DtcgType> = new Set(['color', 'dimension', 'fontFamily', 'fontWeight']);

/** Words that describe appearance; a semantic name containing one is a bug (brief §4.1). */
const colourWords = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'magenta',
  'brown',
  'aubergine',
  'gray',
  'grey',
  'neutral',
  'slate',
  'black',
  'white',
  'gold',
  'silver',
];

interface Token extends FlatToken {
  readonly tier: Tier;
}

interface Manifest {
  readonly tierOf: ReadonlyMap<string, Tier>;
  readonly overrides: ReadonlyMap<string, { readonly base: string; readonly names: 'same' | 'subset' }>;
}

export function checkTokens(files: Files): Report {
  const violations: Violation[] = [];
  const report = (rule: Rule, file: string | undefined, token: string | undefined, message: string) =>
    violations.push({ rule, file, token, message });

  const manifest = readManifest(files, report);
  if (manifest === undefined) return { violations, tokens: 0, pairs: 0, themes: [] };

  // Parse and flatten every source file.
  const byFile = new Map<string, readonly Token[]>();
  for (const [file, tier] of manifest.tierOf) {
    const source = files.get(file);
    if (source === undefined) {
      report('manifest', file, undefined, 'listed in sources.json but missing');
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(source);
    } catch (error) {
      report('schema', file, undefined, `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const problems: Problem[] = [];
    byFile.set(
      file,
      flatten(file, json, problems).map((token) => ({ ...token, tier })),
    );
    for (const problem of problems) report('schema', problem.file, problem.token, problem.message);
  }

  // The tokens visible from each file: every non-override file, with an override replacing its base.
  const overrideFiles = new Set(manifest.overrides.keys());
  const baseContext = new Map<string, Token>();
  for (const [file, tokens] of byFile) {
    if (overrideFiles.has(file)) continue;
    for (const token of tokens) {
      const existing = baseContext.get(token.path);
      if (existing !== undefined) {
        report('schema', file, token.path, `already declared in ${existing.file}`);
      } else {
        baseContext.set(token.path, token);
      }
    }
  }
  const contexts = new Map<string, ReadonlyMap<string, Token>>();
  for (const [file] of byFile) {
    const override = manifest.overrides.get(file);
    if (override === undefined) {
      contexts.set(file, baseContext);
      continue;
    }
    const context = new Map([...baseContext].filter(([, token]) => token.file !== override.base));
    for (const token of byFile.get(file) ?? []) context.set(token.path, token);
    contexts.set(file, context);
  }
  const contextOf = (token: Token) => contexts.get(token.file) ?? baseContext;

  const allTokens = [...byFile.values()].flat();
  const primitiveScaleNames = new Set(
    allTokens
      .filter((token) => token.tier === 'primitive' && token.path.startsWith('color.'))
      .map((token) => token.path.split('.')[1] ?? ''),
  );

  for (const token of allTokens) {
    checkNaming(token, primitiveScaleNames, report);
    checkValue(token, contextOf(token), report);
  }
  for (const token of allTokens) checkLineHeight(token, contextOf(token), report);
  checkOverrides(manifest, byFile, report);

  // Themes: the base, and every override that redeclares the same names (the dark theme).
  const themes = [
    { name: 'light', context: baseContext as ReadonlyMap<string, Token> },
    ...[...manifest.overrides]
      .filter(([, override]) => override.names === 'same')
      .map(([file]) => ({ name: themeName(file), context: contexts.get(file) ?? baseContext })),
  ];
  const pairs = checkContrast(files, themes, report);
  checkOutput(files, baseContext, report);

  return { violations, tokens: allTokens.length, pairs, themes: themes.map((theme) => theme.name) };
}

type Reporter = (rule: Rule, file: string | undefined, token: string | undefined, message: string) => void;

function readManifest(files: Files, report: Reporter): Manifest | undefined {
  const source = files.get('sources.json');
  if (source === undefined) {
    report('manifest', 'sources.json', undefined, 'missing');
    return undefined;
  }
  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch {
    report('manifest', 'sources.json', undefined, 'invalid JSON');
    return undefined;
  }
  if (!isRecord(json) || !isRecord(json['tiers']) || !isRecord(json['overrides'])) {
    report('manifest', 'sources.json', undefined, 'expected "tiers" and "overrides" objects');
    return undefined;
  }
  const tierOf = new Map<string, Tier>();
  for (const tier of tiers) {
    const list = json['tiers'][tier];
    if (!Array.isArray(list)) {
      report('manifest', 'sources.json', undefined, `tier "${tier}" must list files`);
      continue;
    }
    for (const file of list) {
      if (typeof file !== 'string') continue;
      if (tierOf.has(file)) report('manifest', 'sources.json', undefined, `${file} is listed twice`);
      tierOf.set(file, tier);
    }
  }
  const overrides = new Map<string, { base: string; names: 'same' | 'subset' }>();
  for (const [file, override] of Object.entries(json['overrides'])) {
    const base = isRecord(override) ? override['base'] : undefined;
    const names = isRecord(override) ? override['names'] : undefined;
    if (
      typeof base !== 'string' ||
      !tierOf.has(base) ||
      !tierOf.has(file) ||
      (names !== 'same' && names !== 'subset')
    ) {
      report(
        'manifest',
        'sources.json',
        undefined,
        `override ${file} needs a listed file, a listed base and a names rule`,
      );
      continue;
    }
    if (tierOf.get(base) !== tierOf.get(file)) {
      report('manifest', 'sources.json', undefined, `override ${file} must be in the tier of its base ${base}`);
    }
    overrides.set(file, { base, names });
  }
  return { tierOf, overrides };
}

function checkNaming(token: Token, primitiveScaleNames: ReadonlySet<string>, report: Reporter): void {
  const segments = token.path.split('.');
  for (const segment of segments) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(segment)) {
      report('naming', token.file, token.path, `"${segment}" is not kebab case (lower-case words joined by -)`);
    }
  }
  if (token.tier === 'primitive') return;
  const words = segments.flatMap((segment) => segment.split('-'));
  const banned = [...colourWords, ...primitiveScaleNames];
  for (const word of words) {
    if (banned.includes(word)) {
      report(
        'naming',
        token.file,
        token.path,
        `"${word}" names a colour; semantic names describe purpose (brief §4.1)`,
      );
    }
  }
  // Brief §4.1: raw numbers are a bug in semantic names, except the spacing scale (space.4).
  if (segments[0] !== 'space' && segments.some((segment) => /\d/.test(segment))) {
    report('naming', token.file, token.path, 'contains a number; only the spacing scale (space.N) may');
  }
}

function checkValue(token: Token, context: ReadonlyMap<string, Token>, report: Reporter): void {
  const type = resolveType(token, context, new Set());
  if (type === undefined) {
    if (referenceTarget(token.value) === undefined) {
      report('schema', token.file, token.path, 'no $type on the token or any enclosing group');
    } else {
      checkReference(token, { field: '$value', type: undefined, value: token.value }, context, report);
    }
    return;
  }

  if (referenceTarget(token.value) === undefined) {
    for (const problem of literalProblems(type, token.value, token.extensions)) {
      report('schema', token.file, token.path, problem);
    }
  }

  for (const slot of slots(type, token.value)) {
    if (referenceTarget(slot.value) !== undefined) {
      checkReference(token, slot, context, report);
      continue;
    }
    const where = slot.field === '$value' ? '' : ` (${slot.field})`;
    // Composite fields are checked one by one; the whole value was checked above.
    if (slot.type !== type) {
      for (const problem of literalProblems(slot.type, slot.value, undefined)) {
        report('schema', token.file, token.path, `${slot.field}: ${problem}`);
      }
    }
    if (token.tier !== 'primitive' && referenceOnlyTypes.has(slot.type)) {
      report(
        'tier',
        token.file,
        token.path,
        `${token.tier} ${slot.type} values must reference the ${below(token.tier)} tier${where}, not be literals (ADR 0016)`,
      );
    }
  }
}

function checkReference(
  token: Token,
  slot: { readonly field: string; readonly type: DtcgType | undefined; readonly value: unknown },
  context: ReadonlyMap<string, Token>,
  report: Reporter,
): void {
  const target = referenceTarget(slot.value);
  if (target === undefined) return;
  const where = slot.field === '$value' ? '' : ` (${slot.field})`;
  const referenced = context.get(target);
  if (referenced === undefined) {
    const isGroup = [...context.keys()].some((path) => path.startsWith(`${target}.`));
    report(
      'reference',
      token.file,
      token.path,
      isGroup ? `{${target}} is a group; references point to tokens${where}` : `{${target}} does not resolve${where}`,
    );
    return;
  }
  if (token.tier === 'primitive') {
    report('tier', token.file, token.path, `primitives hold values, not references ({${target}})`);
  } else if (referenced.tier !== below(token.tier)) {
    report(
      'tier',
      token.file,
      token.path,
      `a ${token.tier} token must reference the ${below(token.tier)} tier; {${target}} is ${referenced.tier}${where}`,
    );
  }
  const cycle = findCycle(referenced, context, [token.path]);
  if (cycle !== undefined) {
    report('reference', token.file, token.path, `reference cycle: ${cycle.join(' → ')}`);
    return;
  }
  const referencedType = resolveType(referenced, context, new Set());
  if (slot.type !== undefined && referencedType !== undefined && referencedType !== slot.type) {
    report('reference', token.file, token.path, `expects a ${slot.type}; {${target}} is a ${referencedType}${where}`);
  }
}

function below(tier: Tier): Tier {
  return tier === 'component' ? 'semantic' : 'primitive';
}

function resolveType(token: Token, context: ReadonlyMap<string, Token>, visiting: Set<string>): DtcgType | undefined {
  if (token.declaredType !== undefined) return token.declaredType;
  const target = referenceTarget(token.value);
  if (target === undefined || visiting.has(token.path)) return undefined;
  visiting.add(token.path);
  const referenced = context.get(target);
  return referenced === undefined ? undefined : resolveType(referenced, context, visiting);
}

function findCycle(
  token: Token,
  context: ReadonlyMap<string, Token>,
  trail: readonly string[],
): readonly string[] | undefined {
  if (trail.includes(token.path)) return [...trail, token.path];
  for (const slot of slots(token.declaredType ?? 'number', token.value)) {
    const target = referenceTarget(slot.value);
    const next = target === undefined ? undefined : context.get(target);
    if (next === undefined) continue;
    const cycle = findCycle(next, context, [...trail, token.path]);
    if (cycle !== undefined) return cycle;
  }
  return undefined;
}

/** Resolves a token's value through references to a literal, or undefined when a reference is broken or cyclic. */
function resolveLiteral(value: unknown, context: ReadonlyMap<string, Token>, depth = 0): unknown {
  const target = referenceTarget(value);
  if (target === undefined) return value;
  const referenced = context.get(target);
  if (referenced === undefined || depth > 32) return undefined;
  return resolveLiteral(referenced.value, context, depth + 1);
}

function checkLineHeight(token: Token, context: ReadonlyMap<string, Token>, report: Reporter): void {
  if (resolveType(token, context, new Set()) !== 'typography') return;
  const value = resolveLiteral(token.value, context);
  if (!isRecord(value)) return;
  const fontSize = resolveLiteral(value['fontSize'], context);
  const lineHeight = resolveLiteral(value['lineHeight'], context);
  if (!isRecord(fontSize) || !isNumber(fontSize['value']) || !isNumber(lineHeight)) return;
  const px = fontSize['unit'] === 'rem' ? fontSize['value'] * 16 : fontSize['value'];
  const product = px * lineHeight;
  if (Math.abs(product - Math.round(product / 4) * 4) > 0.01) {
    report(
      'line-height',
      token.file,
      token.path,
      `${px}px × ${lineHeight} = ${product.toFixed(2)}px, not a multiple of 4 (brief §4.2)`,
    );
  }
}

function checkOverrides(manifest: Manifest, byFile: ReadonlyMap<string, readonly Token[]>, report: Reporter): void {
  for (const [file, override] of manifest.overrides) {
    const names = new Set((byFile.get(file) ?? []).map((token) => token.path));
    const baseNames = new Set((byFile.get(override.base) ?? []).map((token) => token.path));
    for (const name of names) {
      if (!baseNames.has(name))
        report('overrides', file, name, `overrides a token that ${override.base} does not declare`);
    }
    if (override.names === 'same') {
      for (const name of baseNames) {
        if (!names.has(name)) report('overrides', file, name, `missing: ${override.base} declares it (theme parity)`);
      }
    }
  }
}

export interface Rgba {
  readonly rgb: readonly [number, number, number];
  readonly alpha: number;
}

function checkContrast(
  files: Files,
  themes: readonly { readonly name: string; readonly context: ReadonlyMap<string, Token> }[],
  report: Reporter,
): number {
  const file = 'contrast-pairs.json';
  const source = files.get(file);
  if (source === undefined) {
    report('contrast', file, undefined, 'missing: every text and boundary pair must be declared');
    return 0;
  }
  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch {
    report('contrast', file, undefined, 'invalid JSON');
    return 0;
  }
  if (!isRecord(json) || !Array.isArray(json['pairs'])) {
    report('contrast', file, undefined, 'expected a "pairs" array');
    return 0;
  }
  const neverText = new Set(
    (Array.isArray(json['neverText']) ? json['neverText'] : [])
      .map((entry) => (isRecord(entry) ? entry['token'] : undefined))
      .filter((token): token is string => typeof token === 'string'),
  );

  let count = 0;
  for (const [index, entry] of json['pairs'].entries()) {
    const label = `pairs[${index}]`;
    if (
      !isRecord(entry) ||
      !isStringList(entry['foreground']) ||
      !isStringList(entry['background']) ||
      !isNumber(entry['minimum']) ||
      (entry['over'] !== undefined && !isStringList(entry['over']))
    ) {
      report('contrast', file, label, 'needs foreground and background lists, a minimum and optionally an over list');
      continue;
    }
    const over = isStringList(entry['over']) ? entry['over'] : [undefined];
    const reason = typeof entry['reason'] === 'string' ? entry['reason'] : label;
    for (const name of [...entry['foreground'], ...entry['background'], ...over]) {
      if (name !== undefined && neverText.has(name)) {
        report('contrast', file, name, `is never paired with text (neverText), but ${label} pairs it`);
      }
    }
    for (const theme of themes) {
      for (const foreground of entry['foreground']) {
        for (const background of entry['background']) {
          for (const surface of over) {
            count++;
            const fg = colorOf(foreground, theme.context);
            const bg = colorOf(background, theme.context);
            const under = surface === undefined ? undefined : colorOf(surface, theme.context);
            const missing = [
              [foreground, fg],
              [background, bg],
              [surface, under],
            ].find(([name, color]) => name !== undefined && color === undefined);
            if (missing !== undefined) {
              report('contrast', file, String(missing[0]), `${label}: not a colour token in the ${theme.name} theme`);
              continue;
            }
            if (fg === undefined || bg === undefined) continue;
            const backdrop = under === undefined ? bg : composite(bg, opaque(under));
            if (backdrop.alpha < 1) {
              report('contrast', file, background, `${label}: translucent background needs an "over" surface`);
              continue;
            }
            const ratio = contrast(composite(fg, backdrop), backdrop);
            if (ratio + 1e-9 < entry['minimum']) {
              const on = surface === undefined ? background : `${background} over ${surface}`;
              report(
                'contrast',
                file,
                foreground,
                `${theme.name}: ${foreground} on ${on} is ${ratio.toFixed(2)}:1, below ${entry['minimum']}:1 (${reason})`,
              );
            }
          }
        }
      }
    }
  }
  return count;
}

function colorOf(name: string, context: ReadonlyMap<string, Token>): Rgba | undefined {
  const token = context.get(name);
  if (token === undefined || resolveType(token, context, new Set()) !== 'color') return undefined;
  const value = resolveLiteral(token.value, context);
  if (!isRecord(value) || typeof value['colorSpace'] !== 'string' || !Array.isArray(value['components'])) {
    return undefined;
  }
  const space = colorjsSpaces[value['colorSpace']];
  if (space === undefined) return undefined;
  const components = value['components'].map((component) => (isNumber(component) ? component : 0));
  const [r = 0, g = 0, b = 0] = new Color(space, [components[0] ?? 0, components[1] ?? 0, components[2] ?? 0])
    .to('srgb')
    .toGamut({ method: 'clip' })
    .coords.map((coord) => coord ?? 0);
  const alpha = value['alpha'];
  return { rgb: [r, g, b], alpha: isNumber(alpha) ? alpha : 1 };
}

/** DTCG colour space identifiers → colorjs.io space ids. */
const colorjsSpaces: Readonly<Record<string, string>> = {
  srgb: 'srgb',
  'srgb-linear': 'srgb-linear',
  hsl: 'hsl',
  hwb: 'hwb',
  lab: 'lab',
  lch: 'lch',
  oklab: 'oklab',
  oklch: 'oklch',
  'display-p3': 'p3',
  'a98-rgb': 'a98rgb',
  'prophoto-rgb': 'prophoto',
  rec2020: 'rec2020',
  'xyz-d65': 'xyz-d65',
  'xyz-d50': 'xyz-d50',
};

/**
 * Source-over compositing in gamma-encoded sRGB, rounded to 8 bits per channel, as browsers paint. Without the
 * rounding a pair can pass at 4.50:1 while the painted pixels give 4.49:1 (axe found one).
 */
export function composite(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top.alpha + bottom.alpha * (1 - top.alpha);
  if (alpha === 0) return { rgb: [0, 0, 0], alpha: 0 };
  const channel = (index: 0 | 1 | 2) =>
    Math.round(((top.rgb[index] * top.alpha + bottom.rgb[index] * bottom.alpha * (1 - top.alpha)) / alpha) * 255) / 255;
  return { rgb: [channel(0), channel(1), channel(2)], alpha };
}

function opaque(color: Rgba): Rgba {
  return color.alpha < 1 ? composite(color, { rgb: [1, 1, 1], alpha: 1 }) : color;
}

/** WCAG 2.x contrast (ADR 0011). */
function contrast(a: Rgba, b: Rgba): number {
  return new Color('srgb', [...a.rgb]).contrast(new Color('srgb', [...b.rgb]), 'WCAG21');
}

function checkOutput(files: Files, baseContext: ReadonlyMap<string, Token>, report: Reporter): void {
  const file = 'dist/tokens.css';
  const css = files.get(file);
  if (css === undefined) {
    report('output', file, undefined, 'missing; run `pnpm nx build tokens` first');
    return;
  }
  const declared = new Set([...css.matchAll(/(--ave-[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
  const used = new Set([...css.matchAll(/--ave-[a-z0-9-]+/g)].map((match) => match[0]));
  for (const token of baseContext.values()) {
    const name = `--ave-${token.path.replaceAll('.', '-')}`;
    if (token.tier === 'primitive') {
      if (used.has(name)) report('output', file, token.path, `primitive emitted as ${name} (ADR 0003)`);
    } else if (!declared.has(name)) {
      report('output', file, token.path, `${name} is not declared; the build is stale or dropped it`);
    }
  }
}

function themeName(file: string): string {
  return /\.([a-z]+)\.tokens\.json$/.exec(file)?.[1] ?? file;
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string');
}
