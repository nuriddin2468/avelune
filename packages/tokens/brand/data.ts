// The shape of roles.ts: what the brand generator needs from the kit's tokens, compiled by scripts/generate-roles.ts
// from palette.config.ts, the semantic colour files and contrast-pairs.json (ADR 0089), so they stay the one source.

/** The steps of every scale, light to dark. */
export type BrandStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 850 | 900 | 950;

/** One number per step. */
export type BrandPerStep = Readonly<Record<BrandStep, number>>;

/** A scale's hue, peak chroma and, where it has its own, chroma curve (ADR 0011). */
export interface BrandScale {
  readonly hue: number;
  readonly chroma: number;
  readonly chromaCurve?: BrandPerStep;
}

/** What a colour role points at in one theme: `white`, a step (`orange.600`) or an alpha series' share (`neutral-alpha.48`). */
export type BrandRef = 'white' | `${string}.${number}`;

/** A semantic colour token, per theme. */
export interface BrandRole {
  readonly name: string;
  readonly cssVar: `--ave-${string}`;
  readonly light: BrandRef;
  readonly dark: BrandRef;
}

/** A declared contrast pair (contrast-pairs.json). */
export interface BrandPair {
  readonly reason: string;
  readonly minimum: number;
  readonly foreground: readonly string[];
  readonly background: readonly string[];
  readonly over?: readonly string[];
}

export interface BrandData {
  /** A hash of everything below: a tenant's cached stylesheet is valid while it holds. */
  readonly fingerprint: string;
  readonly steps: readonly BrandStep[];
  readonly lightness: BrandPerStep;
  readonly chromaCurve: BrandPerStep;
  /** Every scale of the palette, the kit's accent among them. */
  readonly scales: Readonly<Record<string, BrandScale>>;
  /** The kit's own brand colour and the scale and step that keep it exact. */
  readonly brand: {
    readonly scale: string;
    readonly step: BrandStep;
    readonly hex: string;
    readonly lightnessTolerance: number;
  };
  /** The scale each role family takes its colours from: `accent` → `orange`, `danger` → `red`. */
  readonly families: Readonly<Record<'accent' | 'info' | 'success' | 'warning' | 'danger', string>>;
  /** The alpha series, each with the colour it is made from. */
  readonly alpha: Readonly<Record<string, BrandRef>>;
  readonly roles: readonly BrandRole[];
  readonly pairs: readonly BrandPair[];
  readonly neverText: readonly string[];
}
