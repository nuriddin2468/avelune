// The brand generator (ADR 0089): a preset or a `#rrggbb` colour in, the colour tokens of both themes out, every
// declared contrast pair checked, with a report of what it had to adapt. Pure: no DOM, the same in a browser and in Node.
import { contrast, hexOf, hueDistance, isHex, maxChroma, oklchOf, over, round, type Hex } from './color.ts';
import type { BrandData, BrandRef, BrandRole, BrandStep } from './data.ts';
import { aveBrandPresets, isAveBrandPreset, type AveBrandPresetName } from './presets.ts';
import { brandData } from './roles.ts';

/** A preset's name, or a colour as six-digit hex. */
export type AveBrandInput = AveBrandPresetName | `#${string}`;

export type AveBrandTheme = 'light' | 'dark';

/** The scales a brand regenerates: its accent, the neutrals tinted toward it, and danger when it moved. */
export type AveBrandFamily = 'accent' | 'neutral' | 'danger';

/** Something the generator changed so that every pair passes or the status colours keep their meaning. */
export type AveBrandAdjustment =
  /** The accent fill (buttons, checked controls) is another step of the colour than the exact one, for its text. */
  | {
      readonly kind: 'fill';
      readonly theme: AveBrandTheme;
      readonly step: BrandStep;
      readonly hex: string;
      readonly text: 'light' | 'dark';
    }
  /** A step lost chroma until its pairs passed. */
  | {
      readonly kind: 'chroma';
      readonly family: AveBrandFamily;
      readonly step: BrandStep;
      readonly from: number;
      readonly to: number;
    }
  /** Danger moved away from the brand within the red range, so an action never looks destructive. */
  | { readonly kind: 'danger'; readonly fromHue: number; readonly toHue: number }
  /** The accent is close to a status colour; the status still says itself with its icon and words (ADR 0061). */
  | { readonly kind: 'near-status'; readonly status: 'info' | 'success' | 'warning'; readonly theme: AveBrandTheme };

export interface AveBrandReport {
  /** Whether the exact colour is itself a step of the accent, not only the brand mark. */
  readonly exact: boolean;
  readonly adjustments: readonly AveBrandAdjustment[];
}

export interface AveBrand {
  readonly input: AveBrandInput;
  /** The exact colour, `color.brand.mark`: for logos and marks, never for text. */
  readonly mark: string;
  /** The colour tokens of each theme by name (`color.accent.bg`): `#rrggbb`, or `#rrggbbaa` when translucent. */
  readonly light: Readonly<Record<string, string>>;
  readonly dark: Readonly<Record<string, string>>;
  /** The tokens as a stylesheet in `@layer tokens`, with the selectors of `tokens.css`, to load after it. */
  readonly css: string;
  readonly report: AveBrandReport;
  /** Changes whenever the kit's tokens change what a brand generates: a cached stylesheet is valid while it holds. */
  readonly fingerprint: string;
}

/**
 * The smallest OKLab distance (ΔE_OK) between the accent's fill and a status's, in either theme. The kit's own orange
 * and red are 0.065 apart in light and 0.040 in dark. A brand closer to danger moves danger; one closer to another
 * status is reported. Pinned by generate.spec.ts; the product owner reviews it at the end of Wave 6.
 */
export const aveBrandStatusDistance = 0.04;

/** The hues danger may take, nearest the kit's first: from crimson (352°) to red-orange (32°). */
const dangerHues: readonly number[] = Array.from({ length: 41 }, (_, index) => (352 + index) % 360);

/** A brand scale's peak chroma at most; below `greyChroma` a colour is grey: no tint, no hue to keep danger from. */
const maxPeakChroma = 0.25;
const greyChroma = 0.02;

/** The accent fill and its hover and pressed steps, which move together to the fill's step. */
const fillRoles: readonly string[] = ['color.accent.bg', 'color.accent.bg-hover', 'color.accent.bg-active'];
/** Where the fill may go: white text needs 600 or darker in light, dark text 400 or lighter in dark (ADR 0011). */
const fillRange: Readonly<Record<AveBrandTheme, readonly [BrandStep, BrandStep]>> = {
  light: [600, 850],
  dark: [200, 400],
};
const themes = ['light', 'dark'] as const;

interface ScaleSpec {
  readonly hue: number;
  readonly chroma: number;
  readonly curve: Readonly<Record<BrandStep, number>>;
  /** The brand family it belongs to, when the generator may lower its chroma. */
  readonly family?: AveBrandFamily;
  /** A step kept exact: the brand colour. */
  readonly exact?: { readonly step: BrandStep; readonly hex: Hex };
}

type Values = Record<AveBrandTheme, Record<string, string>>;

/** A role's reference, read. */
type Ref =
  | { readonly kind: 'white' }
  | { readonly kind: 'step'; readonly scale: string; readonly step: BrandStep }
  | { readonly kind: 'alpha'; readonly series: string; readonly percentage: number };

function parseRef(ref: BrandRef, data: BrandData): Ref {
  if (ref === 'white') return { kind: 'white' };
  const dot = ref.lastIndexOf('.');
  const name = ref.slice(0, dot);
  const number = Number(ref.slice(dot + 1));
  return name in data.alpha
    ? { kind: 'alpha', series: name, percentage: number }
    : { kind: 'step', scale: name, step: number as BrandStep };
}

interface Attempt {
  readonly values: Values;
  readonly failures: readonly string[];
  readonly fills: Readonly<Record<AveBrandTheme, BrandStep>>;
  readonly lowered: ReadonlyMap<
    string,
    { readonly family: AveBrandFamily; readonly step: BrandStep; readonly from: number; readonly to: number }
  >;
  readonly exact: boolean;
}

/** A brand's colour tokens and stylesheet from a preset or a colour; throws only on input that is neither. */
export function generateAveBrand(input: AveBrandInput, data: BrandData = brandData): AveBrand {
  const mark = markOf(input);
  const [lightness, chroma, hue] = oklchOf(mark);
  const kit = mark === data.brand.hex;
  const grey = chroma < greyChroma;
  const nearest = nearestStep(lightness, data);
  const neutral = data.scales['neutral'];
  const kitAccent = data.scales[data.families.accent];
  const kitDanger = data.scales[data.families.danger];
  if (neutral === undefined || kitAccent === undefined || kitDanger === undefined) {
    throw new Error('brand: the palette lacks its neutral, accent or danger scale');
  }

  // The kit's orange keeps the kit's scales exactly; any other colour gets its hue and its chroma on the ladder.
  const accentHue = kit ? kitAccent.hue : round(hue, 1);
  const accentChroma = kit ? kitAccent.chroma : Math.min(maxPeakChroma, chroma / data.chromaCurve[nearest]);
  const neutralHue = kit ? neutral.hue : accentHue;
  const neutralChroma = kit ? neutral.chroma : grey ? 0 : neutral.chroma * Math.min(1, chroma / 0.1);
  const exactFits = Math.abs(lightness - data.lightness[nearest]) <= data.brand.lightnessTolerance;

  const attempt = (exact: boolean, dangerHue?: number): Attempt => {
    const specs = new Map<string, ScaleSpec>();
    for (const [name, scale] of Object.entries(data.scales)) {
      const curve = scale.chromaCurve ?? data.chromaCurve;
      if (name === data.families.accent) {
        specs.set(name, {
          hue: accentHue,
          chroma: accentChroma,
          curve,
          family: 'accent',
          ...(exact ? { exact: { step: nearest, hex: mark } } : {}),
        });
      } else if (name === 'neutral') {
        specs.set(name, { hue: neutralHue, chroma: neutralChroma, curve, family: 'neutral' });
      } else if (name === data.families.danger && dangerHue !== undefined) {
        specs.set(name, { hue: dangerHue, chroma: scale.chroma, curve, family: 'danger' });
      } else {
        specs.set(name, { hue: scale.hue, chroma: scale.chroma, curve });
      }
    }
    return settle(specs, nearest, mark, data);
  };

  // The exact colour sits on its step when it is near that step's lightness and every pair still passes with it.
  let result = exactFits ? attempt(true) : attempt(false);
  if (result.failures.length > 0 && exactFits) result = attempt(false);

  const adjustments: AveBrandAdjustment[] = [];
  if (!grey && closest(result.values, 'danger') < aveBrandStatusDistance) {
    const hues = [...dangerHues].sort((a, b) => hueDistance(a, kitDanger.hue) - hueDistance(b, kitDanger.hue));
    for (const candidate of hues) {
      const moved = attempt(result.exact, candidate);
      if (moved.failures.length === 0 && closest(moved.values, 'danger') >= aveBrandStatusDistance) {
        result = moved;
        adjustments.push({ kind: 'danger', fromHue: kitDanger.hue, toHue: candidate });
        break;
      }
    }
  }
  if (result.failures.length > 0) throw new Error(`brand: ${mark} still fails ${result.failures.join('; ')}`);

  for (const theme of themes) {
    const fill = result.values[theme]['color.accent.bg'] ?? '';
    if (fill !== mark) {
      adjustments.push({
        kind: 'fill',
        theme,
        step: result.fills[theme],
        hex: fill,
        text: theme === 'light' ? 'light' : 'dark',
      });
    }
  }
  for (const lowered of result.lowered.values()) {
    adjustments.push({ kind: 'chroma', ...lowered, from: round(lowered.from, 3), to: round(lowered.to, 3) });
  }
  for (const status of ['info', 'success', 'warning'] as const) {
    for (const theme of themes) {
      if (!grey && distance(result.values[theme], status) < aveBrandStatusDistance) {
        adjustments.push({ kind: 'near-status', status, theme });
      }
    }
  }

  return {
    input,
    mark,
    light: result.values.light,
    dark: result.values.dark,
    css: stylesheet(result.values, data),
    report: { exact: result.exact, adjustments },
    fingerprint: data.fingerprint,
  };
}

/** Maps the roles and checks every pair; each step of a brand family that a failing pair uses loses chroma. */
function settle(specs: ReadonlyMap<string, ScaleSpec>, nearest: BrandStep, mark: Hex, data: BrandData): Attempt {
  const fills = { light: clampStep(nearest, fillRange.light, data), dark: clampStep(nearest, fillRange.dark, data) };
  const shares = new Map<string, number>();
  const lowered = new Map<string, { family: AveBrandFamily; step: BrandStep; from: number; to: number }>();
  const exact = [...specs.values()].some((spec) => spec.exact !== undefined);

  for (;;) {
    const values = mapRoles(specs, shares, fills, mark, data);
    const failing = failures(values, data);
    if (failing.length === 0) return { values, failures: [], fills, lowered, exact };
    let changed = false;
    for (const { scale, step } of failingSteps(failing, fills, data)) {
      const spec = specs.get(scale);
      const key = `${scale}.${String(step)}`;
      const share = shares.get(key) ?? 1;
      if (spec?.family === undefined || spec.exact?.step === step || share === 0) continue;
      // A fifth of the chroma at a time, then none: at no chroma a step is the grey ladder, which passes.
      const next = share < 0.05 ? 0 : share * 0.8;
      shares.set(key, next);
      const peak = spec.chroma * spec.curve[step];
      lowered.set(key, { family: spec.family, step, from: lowered.get(key)?.from ?? peak, to: peak * next });
      changed = true;
    }
    if (!changed) return { values, failures: failing.map((failure) => failure.text), fills, lowered, exact };
  }
}

interface Failure {
  readonly text: string;
  readonly theme: AveBrandTheme;
  readonly tokens: readonly string[];
}

/** The steps the failing pairs' tokens use. */
function failingSteps(
  failing: readonly Failure[],
  fills: Readonly<Record<AveBrandTheme, BrandStep>>,
  data: BrandData,
): { scale: string; step: BrandStep }[] {
  const found = new Map<string, { scale: string; step: BrandStep }>();
  const add = (ref: Ref | undefined): void => {
    if (ref?.kind === 'step') found.set(`${ref.scale}.${String(ref.step)}`, { scale: ref.scale, step: ref.step });
    const base = ref?.kind === 'alpha' ? data.alpha[ref.series] : undefined;
    if (base !== undefined) add(parseRef(base, data));
  };
  for (const failure of failing) {
    for (const name of failure.tokens) add(refOf(roleOf(name, data), failure.theme, fills, data));
  }
  return [...found.values()];
}

function roleOf(name: string, data: BrandData): BrandRole | undefined {
  return data.roles.find((role) => role.name === name);
}

/** A role's reference in a theme, the accent fill and its hover and pressed steps moved to the fill's step. */
function refOf(
  role: BrandRole | undefined,
  theme: AveBrandTheme,
  fills: Readonly<Record<AveBrandTheme, BrandStep>>,
  data: BrandData,
): Ref | undefined {
  if (role === undefined) return undefined;
  const ref = parseRef(role[theme], data);
  const accentFill = roleOf('color.accent.bg', data)?.[theme];
  const fill = accentFill === undefined ? undefined : parseRef(accentFill, data);
  if (!fillRoles.includes(role.name) || ref.kind !== 'step' || fill?.kind !== 'step') return ref;
  const offset = data.steps.indexOf(fills[theme]) - data.steps.indexOf(fill.step);
  const step = data.steps[data.steps.indexOf(ref.step) + offset];
  return step === undefined ? ref : { ...ref, step };
}

/** Colours already computed, by lightness, chroma and hue: most scales are the same from one brand to the next. */
const computed = new Map<string, Hex>();

function stepHex(spec: ScaleSpec, share: number, step: BrandStep, data: BrandData): Hex {
  if (spec.exact?.step === step) return spec.exact.hex;
  const lightness = data.lightness[step];
  const wanted = spec.chroma * spec.curve[step] * share;
  const key = `${String(lightness)}|${String(wanted)}|${String(spec.hue)}`;
  let hex = computed.get(key);
  if (hex === undefined) {
    hex = hexOf(lightness, Math.min(wanted, maxChroma(lightness, spec.hue)), spec.hue);
    computed.set(key, hex);
  }
  return hex;
}

function mapRoles(
  specs: ReadonlyMap<string, ScaleSpec>,
  shares: ReadonlyMap<string, number>,
  fills: Readonly<Record<AveBrandTheme, BrandStep>>,
  mark: Hex,
  data: BrandData,
): Values {
  const resolve = (ref: Ref): { readonly hex: Hex; readonly alpha: number } => {
    if (ref.kind === 'white') return { hex: '#ffffff', alpha: 1 };
    if (ref.kind === 'alpha') {
      const base = data.alpha[ref.series];
      if (base === undefined) throw new Error(`brand: no alpha series ${ref.series}`);
      return { hex: resolve(parseRef(base, data)).hex, alpha: ref.percentage / 100 };
    }
    const spec = specs.get(ref.scale);
    if (spec === undefined) throw new Error(`brand: no scale ${ref.scale}`);
    return { hex: stepHex(spec, shares.get(`${ref.scale}.${String(ref.step)}`) ?? 1, ref.step, data), alpha: 1 };
  };
  const values: Values = { light: {}, dark: {} };
  for (const theme of themes) {
    for (const role of data.roles) {
      const ref = refOf(role, theme, fills, data);
      if (ref === undefined) continue;
      const { hex, alpha } = role.name === 'color.brand.mark' ? { hex: mark, alpha: 1 } : resolve(ref);
      values[theme][role.name] =
        alpha < 1
          ? `${hex}${Math.round(alpha * 255)
              .toString(16)
              .padStart(2, '0')}`
          : hex;
    }
  }
  return values;
}

/** Every declared pair that fails, in either theme, measured as tools/tokens-check measures it. */
function failures(values: Values, data: BrandData): Failure[] {
  const found: Failure[] = [];
  for (const theme of themes) {
    const colour = (name: string | undefined): { readonly hex: Hex; readonly alpha: number } | undefined => {
      const value = name === undefined ? undefined : values[theme][name];
      if (value === undefined) return undefined;
      return { hex: value.slice(0, 7) as Hex, alpha: value.length === 9 ? parseInt(value.slice(7), 16) / 255 : 1 };
    };
    for (const pair of data.pairs) {
      for (const foreground of pair.foreground) {
        for (const background of pair.background) {
          for (const surface of pair.over ?? [undefined]) {
            const fg = colour(foreground);
            const bg = colour(background);
            if (fg === undefined || bg === undefined) continue;
            const under = colour(surface);
            const backdrop = under === undefined ? bg.hex : over(bg.hex, bg.alpha, under.hex);
            const ratio = contrast(fg.alpha < 1 ? over(fg.hex, fg.alpha, backdrop) : fg.hex, backdrop);
            if (ratio + 1e-9 >= pair.minimum) continue;
            const on = surface === undefined ? background : `${background} over ${surface}`;
            found.push({
              text: `${theme}: ${foreground} on ${on} is ${ratio.toFixed(2)}:1, below ${String(pair.minimum)}:1`,
              theme,
              tokens: [foreground, background, ...(surface === undefined ? [] : [surface])],
            });
          }
        }
      }
    }
  }
  return found;
}

/** ΔE_OK between the accent fill and a status fill in one theme. */
function distance(values: Readonly<Record<string, string>>, status: 'info' | 'success' | 'warning' | 'danger'): number {
  const accent = values['color.accent.bg'];
  const other = values[`color.${status}.bg`];
  if (accent === undefined || other === undefined) return Infinity;
  const lab = (hex: string): readonly [number, number, number] => {
    const [l, c, h] = oklchOf(hex as Hex);
    return [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  };
  const [l1, a1, b1] = lab(accent);
  const [l2, a2, b2] = lab(other);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

function closest(values: Values, status: 'danger'): number {
  return Math.min(distance(values.light, status), distance(values.dark, status));
}

/** The stylesheet: the colour tokens in `@layer tokens`, with the selectors of `tokens.css` (ADR 0017). */
function stylesheet(values: Values, data: BrandData): string {
  const block = (selector: string, theme: AveBrandTheme, indent: string): string => {
    const lines = data.roles.map((role) => `${indent}  ${role.cssVar}: ${values[theme][role.name] ?? ''};`);
    return `${indent}${selector} {\n${lines.join('\n')}\n${indent}}`;
  };
  return [
    `/* Avelune brand, generated by @avelune/tokens/brand (${data.fingerprint}); do not edit. */`,
    '@layer tokens {',
    block(':root', 'light', '  '),
    '',
    block("[data-theme='light']", 'light', '  '),
    '',
    '  @media (prefers-color-scheme: dark) {',
    block(":root:not([data-theme='light'])", 'dark', '    '),
    '  }',
    '',
    block("[data-theme='dark']", 'dark', '  '),
    '}',
    '',
  ].join('\n');
}

function markOf(input: AveBrandInput): Hex {
  if (isAveBrandPreset(input)) return aveBrandPresets[input];
  if (!isHex(input)) throw new Error(`brand: ${input} is neither a preset nor a #rrggbb colour`);
  return input.toLowerCase() as Hex;
}

function nearestStep(lightness: number, data: BrandData): BrandStep {
  return data.steps.reduce((best, step) =>
    Math.abs(data.lightness[step] - lightness) < Math.abs(data.lightness[best] - lightness) ? step : best,
  );
}

/** The step nearest `step` within `[lightest, darkest]`. */
function clampStep(step: BrandStep, [lightest, darkest]: readonly [BrandStep, BrandStep], data: BrandData): BrandStep {
  const index = Math.min(data.steps.indexOf(darkest), Math.max(data.steps.indexOf(lightest), data.steps.indexOf(step)));
  return data.steps[index] ?? step;
}
