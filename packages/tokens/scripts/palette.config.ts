// Inputs of the colour generator (ADR 0011). The generated primitives are src/primitives.color.tokens.json: change
// values here, run `pnpm nx run tokens:colors`, and review the diff of the generated file. Never edit that file by hand.
import { definePalette } from './palette.ts';

export const paletteConfig = definePalette({
  /**
   * OKLCH lightness per step, the same for every scale, so a step plays the same contrast role in every hue.
   * The anchors are the contracts below: 600 carries text on light surfaces (and white text on it), 500 carries UI
   * boundaries (WCAG 1.4.11), 400 carries text on the highest dark surface. The dark end is denser than the light end
   * because the dark theme builds four surface levels from it (850, 900, 950 and the borders above them).
   */
  lightness: {
    50: 0.985,
    100: 0.965,
    200: 0.925,
    300: 0.855,
    400: 0.76,
    500: 0.62,
    600: 0.52,
    700: 0.445,
    800: 0.37,
    850: 0.31,
    900: 0.265,
    950: 0.225,
  },

  /**
   * Share of a scale's peak chroma per step, before the sRGB limit. Tints stay calm and 500–600 are vivid; the dark end
   * falls off steeply, because the dark theme uses 850–950 as tinted backgrounds (brief §4.2: reduced chroma in dark).
   */
  chromaCurve: {
    50: 0.06,
    100: 0.14,
    200: 0.3,
    300: 0.55,
    400: 0.85,
    500: 1,
    600: 1,
    700: 0.92,
    800: 0.72,
    850: 0.45,
    900: 0.34,
    950: 0.26,
  },

  /**
   * The brand colour, kept exact at one step of its scale. The step's OKLCH lightness may differ from the ladder by
   * at most `lightnessTolerance`, and the step must still meet every contract. Ubuntu orange: 3.65:1 against white,
   * so it is not a text colour; `color.accent.bg` uses the nearest passing step and the exact colour is for marks only.
   */
  brand: { scale: 'orange', step: 500, hex: '#e95420', lightnessTolerance: 0.025 },

  scales: {
    /** Tinted toward the brand hue (brief §4.2); the tint fades at both ends so canvas and near-black stay clean. */
    neutral: {
      hue: 38,
      chroma: 0.01,
      chromaCurve: {
        50: 0.25,
        100: 0.3,
        200: 0.45,
        300: 0.7,
        400: 0.9,
        500: 1,
        600: 1,
        700: 1,
        800: 0.9,
        850: 0.8,
        900: 0.7,
        950: 0.6,
      },
    },
    /** Accent. Hue of the brand colour. */
    orange: { hue: 38, chroma: 0.2 },
    /** Danger. Crimson rather than orange-red, so it stays distinct from the accent at equal lightness. */
    red: { hue: 22, chroma: 0.21 },
    /** Warning. */
    amber: { hue: 72, chroma: 0.17 },
    /** Success. */
    green: { hue: 150, chroma: 0.17 },
    /** Info. */
    blue: { hue: 255, chroma: 0.18 },
  },

  /** The neutral scale's peak chroma must fall in this range, and its hue within `hueTolerance` of the brand hue. */
  neutralTint: { scale: 'neutral', minChroma: 0.005, maxChroma: 0.015, hueTolerance: 5 },

  /**
   * Translucent variants for backdrops and shadows, as alpha percentages. `neutral-alpha` is neutral 950, so shadows
   * carry the same tint as the neutrals; `white-alpha` is for highlights on dark surfaces.
   */
  alpha: {
    'neutral-alpha': { base: { scale: 'neutral', step: 950 }, percentages: [4, 8, 12, 16, 24, 32, 48, 64, 80] },
    'white-alpha': { base: 'white', percentages: [4, 8, 12, 16, 24, 32, 48, 64, 80] },
  },

  /**
   * Promises of the ladder, checked for every step of every scale on generation. They hold before any semantic
   * mapping exists; the pairs actually used by the themes are checked separately by tools/tokens-check.
   */
  contracts: [
    { step: 600, against: ['white', 'neutral.50', 'neutral.100'], minimum: 4.5, reason: 'text on light surfaces' },
    { step: 500, against: ['white', 'neutral.50', 'neutral.100'], minimum: 3, reason: 'UI boundaries, light' },
    { step: 500, against: ['neutral.850', 'neutral.900', 'neutral.950'], minimum: 3, reason: 'UI boundaries, dark' },
    {
      step: 400,
      against: ['neutral.850', 'neutral.900', 'neutral.950'],
      minimum: 4.5,
      reason: 'text on dark surfaces',
    },
  ],
});
