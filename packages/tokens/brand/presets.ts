// The kit's named brand colours (ADR 0089): a product or a tenant picks one, or gives its own. Each is generated and
// checked at the kit's build and also ships as a static stylesheet, `@avelune/tokens/brands/<name>.css`. The set is
// the agent's proposal, for the product owner's review at the end of Wave 6: common corporate hues, one dark, one grey.
// This module and the fingerprint are `@avelune/tokens/brand/presets`: a settings screen lists the presets and a page
// checks its cached brand without loading the generator.
export { aveBrandFingerprint } from './fingerprint.ts';

/** The name of a preset. */
export type AveBrandPresetName =
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'navy'
  | 'indigo'
  | 'purple'
  | 'magenta'
  | 'graphite';

/**
 * Each preset's exact colour, its `color.brand.mark`. `orange` is the kit's own: its scale is the kit's palette, so it
 * gives back `tokens.css` exactly.
 */
export const aveBrandPresets: Readonly<Record<AveBrandPresetName, `#${string}`>> = {
  orange: '#e95420',
  red: '#d0202f',
  yellow: '#f4c20d',
  green: '#2e8540',
  teal: '#00857c',
  cyan: '#0096d6',
  blue: '#1f6fd6',
  navy: '#1b365d',
  indigo: '#4a4fc4',
  purple: '#7a3cc2',
  magenta: '#c0237a',
  graphite: '#434b56',
};

/** Every preset's name, in the order a settings screen lists them. */
export const aveBrandPresetNames = Object.keys(aveBrandPresets) as readonly AveBrandPresetName[];

export function isAveBrandPreset(value: string): value is AveBrandPresetName {
  return Object.hasOwn(aveBrandPresets, value);
}
