// @avelune/tokens/brand (ADR 0089): the brand generator. A preset or a #rrggbb colour in; the colour tokens of both
// themes, their stylesheet and a report of what was adapted out. The same code in a browser and in Node.
export {
  aveBrandStatusDistance,
  generateAveBrand,
  type AveBrand,
  type AveBrandAdjustment,
  type AveBrandFamily,
  type AveBrandInput,
  type AveBrandReport,
  type AveBrandTheme,
} from './generate.ts';
export {
  aveBrandFingerprint,
  aveBrandPresetNames,
  aveBrandPresets,
  isAveBrandPreset,
  type AveBrandPresetName,
} from './presets.ts';
export type { BrandStep as AveBrandStep } from './data.ts';
