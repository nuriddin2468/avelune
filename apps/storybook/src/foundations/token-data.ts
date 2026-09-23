// Reading token values for the Foundations pages: per theme, with contrast maths on the painted colour (ADR 0011).
import { tokens, type TokenName } from '@avelune/tokens';
import pairsFile from '@avelune/tokens/contrast-pairs.json';
import Color from 'colorjs.io';

export type Theme = 'light' | 'dark';

/** The theme of the Storybook toolbar. */
export function themeOf(globals: Readonly<Record<string, unknown>>): Theme {
  return globals['theme'] === 'dark' ? 'dark' : 'light';
}

export function isTokenName(name: string): name is TokenName {
  return Object.hasOwn(tokens, name);
}

/** The CSS value of a token in a theme (dark falls back to the shared value for untheme tokens). */
export function cssValue(name: TokenName, theme: Theme): string {
  const token = tokens[name];
  return theme === 'dark' && 'dark' in token ? token.dark.css : token.css;
}

export function cssVar(name: TokenName): string {
  return tokens[name].cssVar;
}

/** Token names that start with a prefix, in source order. */
export function namesUnder(prefix: string): readonly TokenName[] {
  return (Object.keys(tokens) as TokenName[]).filter((name) => name.startsWith(prefix));
}

export function description(name: TokenName): string {
  const token = tokens[name];
  return 'description' in token ? token.description : '';
}

interface Rgba {
  readonly rgb: readonly [number, number, number];
  readonly alpha: number;
}

function parseHex(hex: string): Rgba {
  const channel = (index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return { rgb: [channel(0), channel(1), channel(2)], alpha: hex.length === 9 ? channel(3) : 1 };
}

function composite(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top.alpha + bottom.alpha * (1 - top.alpha);
  // Rounded to 8 bits per channel, as the browser paints (and as tools/tokens-check computes).
  const mix = (index: 0 | 1 | 2) =>
    Math.round(((top.rgb[index] * top.alpha + bottom.rgb[index] * bottom.alpha * (1 - top.alpha)) / alpha) * 255) / 255;
  return { rgb: [mix(0), mix(1), mix(2)], alpha };
}

export interface PairResult {
  readonly foreground: TokenName;
  readonly background: TokenName;
  readonly over: TokenName | undefined;
  readonly minimum: number;
  /** WCAG 2.x ratio, the gate (ADR 0011). */
  readonly wcag: number;
  /** APCA Lc, informational only. */
  readonly apca: number;
}

export interface PairGroup {
  readonly reason: string;
  readonly minimum: number;
  readonly results: readonly PairResult[];
}

/** Every declared pair of contrast-pairs.json, evaluated in one theme. */
export function contrastPairs(theme: Theme): readonly PairGroup[] {
  return pairsFile.pairs.map((entry) => {
    const over: readonly (TokenName | undefined)[] =
      'over' in entry && entry.over ? entry.over.filter(isTokenName) : [undefined];
    const results = entry.foreground.filter(isTokenName).flatMap((foreground) =>
      entry.background.filter(isTokenName).flatMap((background) =>
        over.map((surface) => {
          const backdrop =
            surface === undefined
              ? parseHex(cssValue(background, theme))
              : composite(parseHex(cssValue(background, theme)), parseHex(cssValue(surface, theme)));
          const fg = composite(parseHex(cssValue(foreground, theme)), backdrop);
          const a = new Color('srgb', [...fg.rgb]);
          const b = new Color('srgb', [...backdrop.rgb]);
          return {
            foreground,
            background,
            over: surface,
            minimum: entry.minimum,
            wcag: b.contrast(a, 'WCAG21'),
            apca: Math.abs(b.contrast(a, 'APCA')),
          };
        }),
      ),
    );
    return { reason: entry.reason, minimum: entry.minimum, results };
  });
}
