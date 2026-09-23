// The font build (brief §4.4, ADR 0018): subsets IBM Plex Sans into latin, latin-ext and cyrillic woff2 files,
// renames them per the OFL, writes fonts.css with metric-matched fallback faces, and checks what is shipped.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import { format, resolveConfig } from 'prettier';
import {
  corpus,
  fallback,
  family,
  glyphRemap,
  inRanges,
  keptNameIds,
  postScriptFamily,
  requiredCharacters,
  subsetFile,
  subsets,
  unicodeRange,
  weight,
  weights,
  width,
  type Subset,
} from './config.ts';
import { readCmap, readNames, readSfnt, writeCmap, writeNames, writeSfnt, type NameRecord } from './sfnt.ts';

// subset-font and fontverter are CommonJS without type declarations; their shapes are declared here.
const require = createRequire(import.meta.url);
const subsetFont = require('subset-font') as (
  font: Uint8Array,
  text: string,
  options: {
    readonly targetFormat: 'truetype';
    readonly variationAxes: Readonly<Record<string, number | { min: number; max: number; default: number }>>;
  },
) => Promise<Uint8Array>;
const fontverter = require('fontverter') as {
  convert(font: Uint8Array, format: 'woff2' | 'truetype'): Promise<Uint8Array>;
};

export const sourceDir = join(import.meta.dirname, '..', 'source');
export const outputDir = join(import.meta.dirname, '..', '..', '..', 'packages', 'ui', 'styles', 'fonts');
export const sourceFont = 'IBMPlexSans-Variable.ttf';

/** Every file the build writes into packages/ui/styles/fonts, by name. */
export async function buildFonts(): Promise<ReadonlyMap<string, Uint8Array>> {
  const source = readFileSync(join(sourceDir, sourceFont));
  const remapped = Buffer.from(remapGlyphs(source));
  const files = new Map<string, Uint8Array>();
  for (const subset of subsets) {
    const truetype = await subsetFont(remapped, charactersOf(subset), {
      targetFormat: 'truetype',
      variationAxes: { wght: weight, wdth: width },
    });
    // fontverter detects formats with Buffer methods, so it needs a Buffer, not a plain Uint8Array.
    files.set(subsetFile(subset), await fontverter.convert(Buffer.from(renameFont(truetype)), 'woff2'));
  }
  // Formatted with the repository's Prettier config, so the committed file passes `prettier --check` unchanged.
  const cssFile = join(outputDir, 'fonts.css');
  const css = await format(fontsCss(remapped), { ...((await resolveConfig(cssFile)) ?? {}), filepath: cssFile });
  files.set('fonts.css', new TextEncoder().encode(css));
  files.set('OFL.txt', readFileSync(join(sourceDir, 'OFL-IBMPlexSans.txt')));
  files.set('FONTLOG.txt', new TextEncoder().encode(fontlog));
  return files;
}

function charactersOf(subset: Subset): string {
  return subset.ranges
    .flatMap(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => first + index))
    .filter((codePoint) => codePoint < 0xd800 || codePoint > 0xdfff)
    .map((codePoint) => String.fromCodePoint(codePoint))
    .join('');
}

/** Points each code point of `glyphRemap` at the glyph of its replacement, before subsetting. */
export function remapGlyphs(truetype: Uint8Array): Uint8Array {
  const sfnt = readSfnt(truetype);
  const cmap = sfnt.tables.get('cmap');
  if (cmap === undefined) throw new Error('font has no cmap table');
  const mapping = readCmap(cmap);
  for (const [from, to] of glyphRemap) {
    const glyph = mapping.get(to);
    if (glyph === undefined || !mapping.has(from)) {
      throw new Error(`cannot remap U+${from.toString(16)}: the font lacks it or U+${to.toString(16)}`);
    }
    mapping.set(from, glyph);
  }
  const tables = new Map(sfnt.tables);
  tables.set('cmap', writeCmap(mapping));
  return writeSfnt({ version: sfnt.version, tables });
}

/**
 * Replaces the family name in every name record except copyright, trademark and licence (OFL-FAQ 2.6: a modified
 * version must not use the Reserved Font Name "Plex").
 */
export function renameFont(truetype: Uint8Array): Uint8Array {
  const sfnt = readSfnt(truetype);
  const name = sfnt.tables.get('name');
  if (name === undefined) throw new Error('font has no name table');
  const records = readNames(name).map((record) =>
    keptNameIds.has(record.nameId)
      ? record
      : {
          ...record,
          text: record.text.replaceAll('IBM Plex Sans', family).replaceAll('IBMPlexSans', postScriptFamily),
        },
  );
  const tables = new Map(sfnt.tables);
  tables.set('name', writeNames(records));
  return writeSfnt({ version: sfnt.version, tables });
}

/** Name records that still carry the Reserved Font Name. Must be empty for a shipped file. */
export function reservedNameRecords(records: readonly NameRecord[]): readonly NameRecord[] {
  return records.filter((record) => !keptNameIds.has(record.nameId) && /plex/i.test(record.text));
}

interface FallbackMetrics {
  readonly sizeAdjust: number;
  readonly ascent: number;
  readonly descent: number;
  readonly lineGap: number;
}

/**
 * Scales the local fallback so the corpus sets the same width as Plex at `weightValue`, and overrides its vertical
 * metrics with Plex's, so swapping fonts moves nothing. The overrides are divided by size-adjust because the browser
 * multiplies them by it (CSS Fonts 5).
 */
export function fallbackMetrics(source: Uint8Array, weightValue: (typeof weights)[number]): FallbackMetrics {
  const plex = openFont(source).getVariation({ wght: weightValue, wdth: width });
  const reference = openFont(readFileSync(join(sourceDir, fallback.faces[weightValue].metrics)));
  const widthPerEm = (font: fontkit.Font) =>
    font.layout(corpus).positions.reduce((sum, position) => sum + position.xAdvance, 0) / font.unitsPerEm;
  const sizeAdjust = widthPerEm(plex) / widthPerEm(reference);
  const em = plex.unitsPerEm * sizeAdjust;
  return {
    sizeAdjust,
    ascent: plex.hhea.ascent / em,
    descent: Math.abs(plex.hhea.descent) / em,
    lineGap: plex.hhea.lineGap / em,
  };
}

function openFont(data: Uint8Array): fontkit.Font {
  const font = fontkit.create(Buffer.from(data));
  if (!('layout' in font)) throw new Error('expected a single font, not a collection');
  return font;
}

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export function fontsCss(source: Uint8Array): string {
  const faces = subsets.map(
    (subset) => `@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight.min} ${weight.max};
  font-display: swap;
  src: url('./${subsetFile(subset)}') format('woff2');
  unicode-range: ${unicodeRange(subset.ranges)};
}`,
  );
  const fallbacks = weights.map((weightValue) => {
    const metrics = fallbackMetrics(source, weightValue);
    const local = fallback.faces[weightValue].local.map((name) => `local('${name}')`).join(', ');
    return `@font-face {
  font-family: '${fallback.family}';
  font-style: normal;
  font-weight: ${weightValue};
  src: ${local};
  size-adjust: ${percent(metrics.sizeAdjust)};
  ascent-override: ${percent(metrics.ascent)};
  descent-override: ${percent(metrics.descent)};
  line-gap-override: ${percent(metrics.lineGap)};
}`;
  });
  return `/*
 * ${family}: IBM Plex Sans 3.201 by IBM Corp., SIL Open Font License 1.1 (OFL.txt). Subset for web delivery and
 * renamed, as the licence requires for a modified font with the Reserved Font Name "Plex" (FONTLOG.txt, ADR 0018).
 * '${fallback.family}' is a local Arial-compatible font scaled to Plex's metrics, so the swap does not shift layout.
 * Generated by tools/fonts; do not edit.
 */
${[...faces, ...fallbacks].join('\n\n')}
`;
}

const fontlog = `FONTLOG for ${family}

${family} is a modified version of IBM Plex Sans 3.201 (Copyright 2017 IBM Corp., with Reserved Font Name "Plex"),
licensed under the SIL Open Font License 1.1; see OFL.txt. Source: github.com/google/fonts, ofl/ibmplexsans,
IBMPlexSans[wdth,wght].ttf (tools/fonts/source/README.md in the Avelune repository).

Modifications, made by tools/fonts for web delivery in the Avelune UI kit:
- split into three files by Unicode range (latin, latin-ext, cyrillic); glyphs outside them are removed;
- the weight axis is limited to 400-600 and the width axis is pinned to 100;
- U+02BB and U+02BC are mapped to the glyphs of U+2018 and U+2019, because the original modifier-letter glyphs are
  0.6 em wide and break up Uzbek words such as "Oʻzbekiston";
- the family is renamed from "IBM Plex Sans" to "${family}" in the name table, because a modified version may not
  use the Reserved Font Name (OFL, condition 3; OFL-FAQ 2.6). Copyright, trademark and licence records are kept.
No glyph outline, metric or OpenType layout feature is changed.
`;

export interface CoverageProblem {
  readonly locale: string;
  readonly character: string;
  readonly problem: string;
}

/**
 * Every required character must be in the unicode-range of a shipped subset whose cmap has it; otherwise the browser
 * draws it with another font.
 */
export function coverageProblems(
  cmaps: ReadonlyMap<Subset['name'], ReadonlySet<number>>,
  shipped: readonly Subset[] = subsets,
): readonly CoverageProblem[] {
  const problems: CoverageProblem[] = [];
  for (const [locale, characters] of Object.entries(localeCharacters())) {
    for (const character of new Set(characters)) {
      const codePoint = character.codePointAt(0) ?? 0;
      const owners = shipped.filter((subset) => inRanges(codePoint, subset.ranges));
      if (owners.length === 0) {
        problems.push({ locale, character, problem: 'no subset declares it in its unicode-range' });
      } else if (!owners.some((subset) => cmaps.get(subset.name)?.has(codePoint))) {
        problems.push({
          locale,
          character,
          problem: `in the range of ${owners.map((s) => s.name).join(', ')}, not in the font`,
        });
      }
    }
  }
  return problems;
}

/** The required characters plus whatever Intl emits in each locale for numbers, money, dates and lists. */
export function localeCharacters(): Readonly<Record<string, string>> {
  const date = new Date(Date.UTC(2026, 8, 23, 9, 5));
  return Object.fromEntries(
    Object.entries(requiredCharacters).map(([locale, characters]) => {
      const samples = [
        new Intl.NumberFormat(locale).format(1234567.89),
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'UZS' }).format(1234567),
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(-1234.5),
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(1234.5),
        new Intl.NumberFormat(locale, { style: 'percent' }).format(0.25),
        new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Tashkent' }).format(
          date,
        ),
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Tashkent' }).format(date),
        new Intl.RelativeTimeFormat(locale).format(-3, 'day'),
        new Intl.ListFormat(locale).format(['a', 'b', 'c']),
      ];
      return [locale, characters + samples.join('')];
    }),
  );
}
