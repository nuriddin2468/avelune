// The font build (brief §4.4, ADR 0018): subsets IBM Plex Sans and IBM Plex Mono into latin, latin-ext and cyrillic
// woff2 files, renames them per the OFL, writes fonts.css with metric-matched fallback faces, and checks what ships.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import { format, resolveConfig } from 'prettier';
import {
  corpus,
  families,
  inRanges,
  keptNameIds,
  subsetFile,
  subsets,
  unicodeRange,
  type FallbackFace,
  type Family,
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
    readonly variationAxes?: Readonly<Record<string, number | { min: number; max: number; default: number }>>;
  },
) => Promise<Uint8Array>;
const fontverter = require('fontverter') as {
  convert(font: Uint8Array, format: 'woff2' | 'truetype'): Promise<Uint8Array>;
};

export const sourceDir = join(import.meta.dirname, '..', 'source');
export const outputDir = join(import.meta.dirname, '..', '..', '..', 'packages', 'ui', 'styles', 'fonts');

/** Every file the build writes into packages/ui/styles/fonts, by name. */
export async function buildFonts(): Promise<ReadonlyMap<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  const prepared = new Map<Family, Buffer>();
  for (const family of families) {
    const source = Buffer.from(remapGlyphs(readFileSync(join(sourceDir, family.source)), family.glyphRemap));
    prepared.set(family, source);
    for (const subset of subsets) {
      const truetype = await subsetFont(source, charactersOf(subset), {
        targetFormat: 'truetype',
        ...(family.axes === undefined ? {} : { variationAxes: { wght: family.axes.wght, wdth: family.axes.wdth } }),
      });
      // fontverter detects formats with Buffer methods, so it needs a Buffer, not a plain Uint8Array.
      files.set(
        subsetFile(family, subset),
        await fontverter.convert(Buffer.from(renameFont(truetype, family)), 'woff2'),
      );
    }
  }
  // Formatted with the repository's Prettier config, so the committed file passes `prettier --check` unchanged.
  const cssFile = join(outputDir, 'fonts.css');
  const css = await format(fontsCss(prepared), { ...((await resolveConfig(cssFile)) ?? {}), filepath: cssFile });
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

/** Points each code point of `remap` at the glyph of its replacement, before subsetting. */
export function remapGlyphs(truetype: Uint8Array, remap: ReadonlyMap<number, number>): Uint8Array {
  if (remap.size === 0) return truetype;
  const sfnt = readSfnt(truetype);
  const cmap = sfnt.tables.get('cmap');
  if (cmap === undefined) throw new Error('font has no cmap table');
  const mapping = readCmap(cmap);
  for (const [from, to] of remap) {
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
export function renameFont(truetype: Uint8Array, family: Family): Uint8Array {
  const sfnt = readSfnt(truetype);
  const name = sfnt.tables.get('name');
  if (name === undefined) throw new Error('font has no name table');
  const records = readNames(name).map((record) =>
    keptNameIds.has(record.nameId)
      ? record
      : {
          ...record,
          text: record.text
            .replaceAll(family.original.family, family.family)
            .replaceAll(family.original.postScriptFamily, family.postScriptFamily),
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
 * Scales the local fallback so the corpus sets the same width as the web font at the face's weight, and overrides its
 * vertical metrics with the web font's, so swapping fonts moves nothing. The overrides are divided by size-adjust
 * because the browser multiplies them by it (CSS Fonts 5).
 */
export function fallbackMetrics(source: Uint8Array, family: Family, face: FallbackFace): FallbackMetrics {
  const font = openFont(source);
  const web = family.axes === undefined ? font : font.getVariation({ wght: face.weight, wdth: family.axes.wdth });
  const reference = openFont(readFileSync(join(sourceDir, face.metrics)));
  const widthPerEm = (subject: fontkit.Font) =>
    subject.layout(corpus).positions.reduce((sum, position) => sum + position.xAdvance, 0) / subject.unitsPerEm;
  const sizeAdjust = widthPerEm(web) / widthPerEm(reference);
  const em = web.unitsPerEm * sizeAdjust;
  return {
    sizeAdjust,
    ascent: web.hhea.ascent / em,
    descent: Math.abs(web.hhea.descent) / em,
    lineGap: web.hhea.lineGap / em,
  };
}

function openFont(data: Uint8Array): fontkit.Font {
  const font = fontkit.create(Buffer.from(data));
  if (!('layout' in font)) throw new Error('expected a single font, not a collection');
  return font;
}

const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export function fontsCss(sources: ReadonlyMap<Family, Uint8Array>): string {
  const rules = [...sources].flatMap(([family, source]) => [
    ...subsets.map(
      (subset) => `@font-face {
  font-family: '${family.family}';
  font-style: normal;
  font-weight: ${family.weight};
  font-display: swap;
  src: url('./${subsetFile(family, subset)}') format('woff2');
  unicode-range: ${unicodeRange(subset.ranges)};
}`,
    ),
    ...family.fallback.faces.map((face) => {
      const metrics = fallbackMetrics(source, family, face);
      return `@font-face {
  font-family: '${family.fallback.family}';
  font-style: normal;
  font-weight: ${face.weight};
  src: ${face.local.map((name) => `local('${name}')`).join(', ')};
  size-adjust: ${percent(metrics.sizeAdjust)};
  ascent-override: ${percent(metrics.ascent)};
  descent-override: ${percent(metrics.descent)};
  line-gap-override: ${percent(metrics.lineGap)};
}`;
    }),
  ]);
  return `/*
 * ${families.map((family) => `${family.family}: ${family.original.family} ${family.original.version}`).join('; ')}.
 * By IBM Corp., SIL Open Font License 1.1 (OFL.txt). Subset for web delivery and renamed, as the licence requires for a
 * modified font with the Reserved Font Name "Plex" (FONTLOG.txt, ADR 0018). Each fallback family is a local font
 * scaled to the web font's metrics, so the swap does not shift layout. Generated by tools/fonts; do not edit.
 */
${rules.join('\n\n')}
`;
}

const fontlog = `FONTLOG for ${families.map((family) => family.family).join(' and ')}

${families
  .map(
    (family) =>
      `${family.family} is a modified version of ${family.original.family} ${family.original.version} (Copyright 2017 IBM Corp., with Reserved Font Name "Plex").`,
  )
  .join('\n')}
Both are licensed under the SIL Open Font License 1.1; see OFL.txt. Source: github.com/google/fonts, ofl/ibmplexsans
and ofl/ibmplexmono (tools/fonts/source/README.md in the Avelune repository).

Modifications, made by tools/fonts for web delivery in the Avelune UI kit:
- split into three files per family by Unicode range (latin, latin-ext, cyrillic); glyphs outside them are removed;
- Avelune Sans: the weight axis is limited to 400-600 and the width axis is pinned to 100;
- Avelune Sans: U+02BB and U+02BC are mapped to the glyphs of U+2018 and U+2019, because the original modifier-letter
  glyphs are 0.6 em wide and break up Uzbek words such as "Oʻzbekiston";
- Avelune Mono: only the Regular weight is shipped;
- the families are renamed from "IBM Plex Sans" and "IBM Plex Mono" in the name table, because a modified version may
  not use the Reserved Font Name (OFL, condition 3; OFL-FAQ 2.6). Copyright, trademark and licence records are kept.
No glyph outline, metric or OpenType layout feature is changed.
`;

export interface CoverageProblem {
  readonly family: string;
  readonly locale: string;
  readonly character: string;
  readonly problem: string;
}

/**
 * Every required character of a family must be in the unicode-range of one of its shipped subsets whose cmap has it;
 * otherwise the browser draws it with another font.
 */
export function coverageProblems(
  family: Family,
  cmaps: ReadonlyMap<Subset['name'], ReadonlySet<number>>,
  shipped: readonly Subset[] = subsets,
): readonly CoverageProblem[] {
  const problems: CoverageProblem[] = [];
  for (const [locale, characters] of Object.entries(localeCharacters(family))) {
    for (const character of new Set(characters)) {
      const codePoint = character.codePointAt(0) ?? 0;
      const owners = shipped.filter((subset) => inRanges(codePoint, subset.ranges));
      if (owners.length === 0) {
        problems.push({
          family: family.family,
          locale,
          character,
          problem: 'no subset declares it in its unicode-range',
        });
      } else if (!owners.some((subset) => cmaps.get(subset.name)?.has(codePoint))) {
        problems.push({
          family: family.family,
          locale,
          character,
          problem: `in the range of ${owners.map((s) => s.name).join(', ')}, not in the font`,
        });
      }
    }
  }
  return problems;
}

/** The family's required characters, plus, for the text font, whatever Intl emits in each locale. */
export function localeCharacters(family: Family): Readonly<Record<string, string>> {
  const date = new Date(Date.UTC(2026, 8, 23, 9, 5));
  return Object.fromEntries(
    Object.entries(family.required).map(([locale, characters]) => {
      if (!family.intl) return [locale, characters];
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
