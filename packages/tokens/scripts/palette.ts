// Colour generation in OKLCH (ADR 0011). Pure functions: palette.config.ts is the input, generate-colors.ts writes
// the result. Every colour is computed at the exact OKLCH lightness and hue of its step, with chroma capped at the sRGB
// boundary, then serialised as 8-bit sRGB hex. Contrast is always measured on that hex, the colour the browser paints.
import Color from 'colorjs.io';

/** Steps of every scale, light to dark. */
export const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const;

export type Step = (typeof steps)[number];

/** One number per step. */
export type PerStep = Readonly<Record<Step, number>>;

export interface ScaleConfig {
  /** OKLCH hue in degrees, constant across the scale. */
  readonly hue: number;
  /** Peak OKLCH chroma. The chroma curve scales it per step; the sRGB boundary caps it. */
  readonly chroma: number;
  /** Replaces the shared chroma curve for this scale. */
  readonly chromaCurve?: PerStep;
}

/** A colour the contracts compare against: `white`, or a step such as `neutral.100`. */
export type ColorRef<S extends string> = 'white' | `${S}.${Step}`;

export interface PaletteConfig<S extends string = string> {
  readonly lightness: PerStep;
  readonly chromaCurve: PerStep;
  readonly brand: {
    readonly scale: NoInfer<S>;
    readonly step: Step;
    readonly hex: string;
    readonly lightnessTolerance: number;
  };
  readonly scales: Readonly<Record<S, ScaleConfig>>;
  readonly neutralTint: {
    readonly scale: NoInfer<S>;
    readonly minChroma: number;
    readonly maxChroma: number;
    readonly hueTolerance: number;
  };
  readonly alpha: Readonly<
    Record<
      string,
      {
        readonly base: 'white' | { readonly scale: NoInfer<S>; readonly step: Step };
        readonly percentages: readonly number[];
      }
    >
  >;
  readonly contracts: readonly {
    readonly step: Step;
    readonly against: readonly ColorRef<NoInfer<S>>[];
    readonly minimum: number;
    readonly reason: string;
  }[];
}

/** Types a palette configuration: scale names are inferred from `scales`, and every other reference must use one. */
export function definePalette<const S extends string>(config: PaletteConfig<S>): PaletteConfig<S> {
  return config;
}

export type Hex = `#${string}`;

export interface GeneratedColor {
  /** Six-digit sRGB hex, lower case. */
  readonly hex: Hex;
  /** Opacity from 0 to 1. */
  readonly alpha: number;
  /** OKLCH measured from `hex`, not the target. Hue is 0 for achromatic colours. */
  readonly oklch: readonly [lightness: number, chroma: number, hue: number];
  /** The brand colour, taken as given rather than generated. */
  readonly exact: boolean;
}

export interface Palette {
  readonly white: GeneratedColor;
  readonly scales: Readonly<Record<string, Readonly<Record<Step, GeneratedColor>>>>;
  readonly alpha: Readonly<Record<string, Readonly<Record<number, GeneratedColor>>>>;
}

/** Thrown when a configuration breaks a rule; `violations` lists every rule it breaks. */
export class PaletteError extends Error {
  readonly violations: readonly string[];

  constructor(violations: readonly string[]) {
    super(`The palette breaks ${violations.length} rule(s):\n${violations.map((v) => `  - ${v}`).join('\n')}`);
    this.name = 'PaletteError';
    this.violations = violations;
  }
}

/** Rounding to 8-bit sRGB moves OKLCH lightness by about 0.002; anything more means the colour was distorted. */
const lightnessRoundingTolerance = 0.005;
/**
 * Hue drift allowed after rounding, as an OKLab distance (ΔH = 2·√(C₁C₂)·sin(Δh/2)), so low-chroma tints, where 8-bit
 * rounding swings the hue angle by degrees, are judged by what is visible. Well under the OKLab JND of 0.02.
 */
export const hueDriftTolerance = 0.004;

/** OKLab hue difference ΔH between two [chroma, hue] pairs. */
export function hueDrift(
  [chromaA, hueA]: readonly [number, number],
  [chromaB, hueB]: readonly [number, number],
): number {
  return 2 * Math.sqrt(chromaA * chromaB) * Math.sin((hueDistance(hueA, hueB) * Math.PI) / 360);
}

export function generatePalette<S extends string>(config: PaletteConfig<S>): Palette {
  const violations: string[] = [];

  steps.forEach((step, index) => {
    const next = steps[index + 1];
    if (next !== undefined && config.lightness[step] <= config.lightness[next]) {
      violations.push(`lightness must decrease from step to step: ${step} is not lighter than ${next}`);
    }
  });

  const white = measure('#ffffff', 1, false);
  const scales: Record<string, Record<Step, GeneratedColor>> = {};

  for (const name of Object.keys(config.scales) as S[]) {
    const scale = config.scales[name];
    const curve = scale.chromaCurve ?? config.chromaCurve;
    const colors = {} as Record<Step, GeneratedColor>;

    for (const step of steps) {
      const target = config.lightness[step];
      if (name === config.brand.scale && step === config.brand.step) {
        const brand = measure(normaliseHex(config.brand.hex), 1, true);
        if (Math.abs(brand.oklch[0] - target) > config.brand.lightnessTolerance) {
          violations.push(
            `brand ${config.brand.hex} has lightness ${fixed(brand.oklch[0])}, more than ` +
              `${config.brand.lightnessTolerance} from step ${step} (${target})`,
          );
        }
        colors[step] = brand;
        continue;
      }

      const chroma = Math.min(scale.chroma * curve[step], maxChroma(target, scale.hue));
      const color = measure(toHex(target, chroma, scale.hue), 1, false);
      if (Math.abs(color.oklch[0] - target) > lightnessRoundingTolerance) {
        violations.push(`${name}.${step}: lightness ${fixed(color.oklch[0])} drifted from ${target}`);
      }
      if (hueDrift([chroma, scale.hue], [color.oklch[1], color.oklch[2]]) > hueDriftTolerance) {
        violations.push(`${name}.${step}: hue ${color.oklch[2].toFixed(1)} drifted from ${scale.hue}`);
      }
      colors[step] = color;
    }
    scales[name] = colors;
  }

  checkNeutralTint(config, scales, violations);

  const resolve = (ref: ColorRef<S>): GeneratedColor | undefined => {
    if (ref === 'white') return white;
    const [scale, step] = ref.split('.');
    return scale === undefined ? undefined : scales[scale]?.[Number(step) as Step];
  };

  for (const contract of config.contracts) {
    for (const ref of contract.against) {
      const background = resolve(ref);
      if (background === undefined) {
        violations.push(`contract "${contract.reason}": unknown colour ${ref}`);
        continue;
      }
      for (const [name, colors] of Object.entries(scales)) {
        const ratio = contrast(colors[contract.step], background);
        if (ratio < contract.minimum) {
          violations.push(
            `${name}.${contract.step} on ${ref}: ${ratio.toFixed(2)}:1, below ${contract.minimum}:1 (${contract.reason})`,
          );
        }
      }
    }
  }

  const alpha: Record<string, Record<number, GeneratedColor>> = {};
  for (const [name, series] of Object.entries(config.alpha)) {
    const base = series.base === 'white' ? white : scales[series.base.scale]?.[series.base.step];
    if (base === undefined) {
      violations.push(`alpha series ${name}: unknown base colour`);
      continue;
    }
    const colors: Record<number, GeneratedColor> = {};
    for (const percentage of series.percentages) {
      if (!Number.isInteger(percentage) || percentage <= 0 || percentage >= 100) {
        violations.push(`alpha series ${name}: ${percentage} is not a whole percentage between 1 and 99`);
        continue;
      }
      colors[percentage] = { ...base, alpha: percentage / 100, exact: false };
    }
    alpha[name] = colors;
  }

  if (violations.length > 0) throw new PaletteError(violations);
  return { white, scales, alpha };
}

/** A DTCG 2025.10 colour token (Color module): sRGB components 0–1, a six-digit hex fallback, alpha when below 1. */
export interface ColorToken {
  readonly $value: {
    readonly colorSpace: 'srgb';
    readonly components: readonly [number, number, number];
    readonly alpha?: number;
    readonly hex: Hex;
  };
  readonly $description: string;
}

export interface ColorTokenFile {
  readonly color: {
    readonly $type: 'color';
    readonly $description: string;
  } & Readonly<Record<string, ColorToken | Readonly<Record<string, ColorToken>> | string>>;
}

/** The palette as DTCG primitives: `color.white`, `color.<scale>.<step>`, `color.<alpha series>.<percentage>`. */
export function paletteToTokens(palette: Palette, description: string): ColorTokenFile {
  const group = (colors: Readonly<Record<number, GeneratedColor>>, describe: (key: string) => string) =>
    Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, toToken(color, describe(key))]));

  return {
    color: {
      $type: 'color',
      $description: description,
      white: toToken(palette.white, oklchText(palette.white)),
      ...Object.fromEntries(
        Object.entries(palette.scales).map(([name, colors]) => [
          name,
          group(colors, (step) => {
            const color = colors[Number(step) as Step];
            return `${oklchText(color)}${color.exact ? '; the exact brand colour' : ''}`;
          }),
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(palette.alpha).map(([name, colors]) => [
          name,
          group(colors, (percentage) => `${colors[Number(percentage)]?.hex} at ${percentage}%`),
        ]),
      ),
    },
  };
}

function toToken(color: GeneratedColor, description: string): ColorToken {
  const channel = (offset: number) => round(parseInt(color.hex.slice(offset, offset + 2), 16) / 255, 4);
  return {
    $value: {
      colorSpace: 'srgb',
      components: [channel(1), channel(3), channel(5)],
      ...(color.alpha < 1 ? { alpha: color.alpha } : {}),
      hex: color.hex,
    },
    $description: description,
  };
}

function oklchText(color: GeneratedColor): string {
  const [lightness, chroma, hue] = color.oklch;
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

/** WCAG 2.x contrast ratio of two opaque colours (ADR 0011: the normative metric). */
export function contrast(a: GeneratedColor, b: GeneratedColor): number {
  return new Color(a.hex).contrast(new Color(b.hex), 'WCAG21');
}

function checkNeutralTint<S extends string>(
  config: PaletteConfig<S>,
  scales: Readonly<Record<string, Readonly<Record<Step, GeneratedColor>>>>,
  violations: string[],
): void {
  const { scale, minChroma, maxChroma, hueTolerance: tolerance } = config.neutralTint;
  const neutral = scales[scale];
  if (neutral === undefined) {
    violations.push(`neutral tint: unknown scale ${scale}`);
    return;
  }
  const peak = Math.max(...steps.map((step) => neutral[step].oklch[1]));
  if (peak < minChroma || peak > maxChroma) {
    violations.push(`${scale}: peak chroma ${fixed(peak)} is outside ${minChroma}–${maxChroma}`);
  }
  const brandHue = measure(normaliseHex(config.brand.hex), 1, true).oklch[2];
  const neutralHue = config.scales[scale].hue;
  if (hueDistance(neutralHue, brandHue) > tolerance) {
    violations.push(`${scale}: hue ${neutralHue} is more than ${tolerance}° from the brand hue ${brandHue.toFixed(1)}`);
  }
}

/** The largest chroma at this lightness and hue that is still inside sRGB. */
function maxChroma(lightness: number, hue: number): number {
  let low = 0;
  let high = 0.5;
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2;
    if (new Color('oklch', [lightness, middle, hue]).inGamut('srgb')) low = middle;
    else high = middle;
  }
  return low;
}

function toHex(lightness: number, chroma: number, hue: number): Hex {
  // Already inside sRGB by construction; the CSS Color 4 gamut mapping is kept as a guard (ADR 0011).
  const srgb = new Color('oklch', [lightness, chroma, hue]).toGamut({ space: 'srgb', method: 'css' }).to('srgb');
  const channels = srgb.coords.map((value) => Math.round(Math.min(1, Math.max(0, value ?? 0)) * 255));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function measure(hex: Hex, alpha: number, exact: boolean): GeneratedColor {
  const [lightness, chroma, hue] = new Color(hex).to('oklch').coords;
  return {
    hex,
    alpha,
    oklch: [round(lightness ?? 0, 4), round(chroma ?? 0, 4), round(Number.isNaN(hue) ? 0 : (hue ?? 0), 2)],
    exact,
  };
}

function normaliseHex(hex: string): Hex {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new PaletteError([`${hex} is not a six-digit hex colour`]);
  return hex.toLowerCase() as Hex;
}

function hueDistance(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;
  return distance > 180 ? 360 - distance : distance;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function fixed(value: number): string {
  return value.toFixed(3);
}
