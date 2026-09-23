// What the font build produces (brief §4.4, ADR 0018). Sources are in ../source (see ../source/README.md).

/** Code point range, inclusive. */
export type Range = readonly [first: number, last: number];

export interface Subset {
  readonly name: 'latin' | 'latin-ext' | 'cyrillic';
  readonly ranges: readonly Range[];
}

/**
 * Unicode ranges. latin and latin-ext are Google Fonts' ranges (fonts.googleapis.com/css2, 2026-09-23). cyrillic is
 * Google's plus the Uzbek Cyrillic letters Ғ ғ, Қ қ, Ҳ ҳ, which Google puts in cyrillic-ext.
 */
export const subsets: readonly Subset[] = [
  {
    name: 'latin',
    ranges: [
      [0x0000, 0x00ff],
      [0x0131, 0x0131],
      [0x0152, 0x0153],
      [0x02bb, 0x02bc],
      [0x02c6, 0x02c6],
      [0x02da, 0x02da],
      [0x02dc, 0x02dc],
      [0x0304, 0x0304],
      [0x0308, 0x0308],
      [0x0329, 0x0329],
      [0x2000, 0x206f],
      [0x20ac, 0x20ac],
      [0x2122, 0x2122],
      [0x2191, 0x2191],
      [0x2193, 0x2193],
      [0x2212, 0x2212],
      [0x2215, 0x2215],
      [0xfeff, 0xfeff],
      [0xfffd, 0xfffd],
    ],
  },
  {
    name: 'latin-ext',
    ranges: [
      [0x0100, 0x02ba],
      [0x02bd, 0x02c5],
      [0x02c7, 0x02cc],
      [0x02ce, 0x02d7],
      [0x02dd, 0x02ff],
      [0x0304, 0x0304],
      [0x0308, 0x0308],
      [0x0329, 0x0329],
      [0x1d00, 0x1dbf],
      [0x1e00, 0x1e9f],
      [0x1ef2, 0x1eff],
      [0x2020, 0x2020],
      [0x20a0, 0x20ab],
      [0x20ad, 0x20c0],
      [0x2113, 0x2113],
      [0x2c60, 0x2c7f],
      [0xa720, 0xa7ff],
    ],
  },
  {
    name: 'cyrillic',
    ranges: [
      [0x0301, 0x0301],
      [0x0400, 0x045f],
      [0x0490, 0x0493],
      [0x049a, 0x049b],
      [0x04b0, 0x04b3],
      [0x2116, 0x2116],
    ],
  },
];

const span = (first: number, last: number) =>
  String.fromCodePoint(...Array.from({ length: last - first + 1 }, (_, index) => first + index));

export type Locale = 'en' | 'uz-Latn' | 'uz-Cyrl' | 'ru';

/**
 * Characters that must render in the text font, per locale (brief §0 LOCALES). The check adds whatever Intl emits for
 * numbers, currencies, dates and lists in each locale, plus U+202F, which browsers put before AM/PM.
 */
export const requiredCharacters: Readonly<Record<Locale, string>> = {
  en: `${span(0x20, 0x7e)}\u00a0\u202f‘’“”–—…€`,
  'uz-Latn': `${span(0x20, 0x7e)}ʻʼ‘’“”«»–—…№`,
  ru: `${span(0x0410, 0x044f)}Ёё«»„“–—…№`,
  'uz-Cyrl': `${span(0x0410, 0x044f)}ЁёЎўҚқҒғҲҳ«»„“–—…№`,
};

/** Text that sizes the fallback faces: the mix of scripts the kit's screens show. */
export const corpus = [
  'Hujjatlar roʻyxati. Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori. Gʻalaba, shoʻx, qoʻngʻiroq.',
  'Ҳужжатлар рўйхати. Ўзбекистон Республикаси Вазирлар Маҳкамасининг қарори. Ғалаба, қўнғироқ.',
  'Список документов. Постановление Кабинета Министров Республики Узбекистан от 23 сентября 2026 г. № 512.',
  'Save changes. Delete document. 1 234 567,89 soʻm; 25%; 14:05.',
].join(' ');

/** Name IDs that keep IBM's text: copyright, trademark, licence and licence URL (OFL requires them). */
export const keptNameIds: ReadonlySet<number> = new Set([0, 7, 13, 14]);

export function unicodeRange(ranges: readonly Range[]): string {
  const hex = (codePoint: number) => codePoint.toString(16).toUpperCase().padStart(4, '0');
  return ranges
    .map(([first, last]) => (first === last ? `U+${hex(first)}` : `U+${hex(first)}-${hex(last)}`))
    .join(', ');
}

export function inRanges(codePoint: number, ranges: readonly Range[]): boolean {
  return ranges.some(([first, last]) => codePoint >= first && codePoint <= last);
}

/** Characters code must render in: ASCII and the letters of every locale. Monospace text is not Intl output. */
const codeCharacters: Readonly<Record<Locale, string>> = {
  en: span(0x20, 0x7e),
  'uz-Latn': `${span(0x20, 0x7e)}ʻʼ‘’`,
  ru: `${span(0x0410, 0x044f)}Ёё«»`,
  'uz-Cyrl': `${span(0x0410, 0x044f)}ЁёЎўҚқҒғҲҳ`,
};

export interface FallbackFace {
  readonly weight: number;
  /** Local fonts, in order, metric-compatible with `metrics`. */
  readonly local: readonly string[];
  /** The file in ../source whose metrics stand for the local fonts. */
  readonly metrics: string;
}

export interface Family {
  /** Output files are `<id>-<subset>.woff2`. */
  readonly id: 'avelune-sans' | 'avelune-mono';
  /**
   * The family name of the shipped files. IBM Plex has the Reserved Font Name "Plex", and a subset is a modified
   * version (OFL-FAQ 2.6), so the subsets are renamed (ADR 0018). Glyphs, metrics, copyright and licence are unchanged.
   */
  readonly family: string;
  readonly postScriptFamily: string;
  /** The names the source uses, replaced in the name table. */
  readonly original: { readonly family: string; readonly postScriptFamily: string; readonly version: string };
  readonly source: string;
  /** Variable sources: the weight axis is limited to the kit's weights, the width axis pinned to normal. */
  readonly axes?: {
    readonly wght: { readonly min: number; readonly max: number; readonly default: number };
    readonly wdth: number;
  };
  /** The CSS font-weight descriptor of the web faces. */
  readonly weight: string;
  /** Code points drawn with another glyph of the font. */
  readonly glyphRemap: ReadonlyMap<number, number>;
  readonly required: Readonly<Record<Locale, string>>;
  /** Whether Intl output of every locale must render in this family too. */
  readonly intl: boolean;
  readonly fallback: { readonly family: string; readonly faces: readonly FallbackFace[] };
}

const arial = ['Arial', 'ArialMT', 'Liberation Sans', 'Arimo', 'Helvetica'];

export const families: readonly Family[] = [
  {
    id: 'avelune-sans',
    family: 'Avelune Sans',
    postScriptFamily: 'AveluneSans',
    original: { family: 'IBM Plex Sans', postScriptFamily: 'IBMPlexSans', version: '3.201' },
    source: 'IBMPlexSans-Variable.ttf',
    axes: { wght: { min: 400, max: 600, default: 400 }, wdth: 100 },
    weight: '400 600',
    /**
     * Plex draws U+02BB (ʻ) and U+02BC (ʼ) as spacing modifier letters 0.6 em wide, so Uzbek "oʻ" reads as "o ʻ".
     * They are drawn with the quotation marks ‘ (U+2018) and ’ (U+2019), 0.27 em wide, the form Uzbek text normally
     * uses (ADR 0018).
     */
    glyphRemap: new Map([
      [0x02bb, 0x2018],
      [0x02bc, 0x2019],
    ]),
    required: requiredCharacters,
    intl: true,
    fallback: {
      family: 'Avelune Sans Fallback',
      faces: [
        { weight: 400, local: arial, metrics: 'LiberationSans-Regular.ttf' },
        { weight: 500, local: arial, metrics: 'LiberationSans-Regular.ttf' },
        {
          weight: 600,
          local: ['Arial Bold', 'Arial-BoldMT', 'Liberation Sans Bold', 'Arimo Bold', 'Helvetica Bold'],
          metrics: 'LiberationSans-Bold.ttf',
        },
      ],
    },
  },
  {
    id: 'avelune-mono',
    family: 'Avelune Mono',
    postScriptFamily: 'AveluneMono',
    original: { family: 'IBM Plex Mono', postScriptFamily: 'IBMPlexMono', version: '2.3' },
    source: 'IBMPlexMono-Regular.ttf',
    weight: '400',
    // Every glyph of a monospace font is 0.6 em wide, so ʻ and ʼ keep their own glyphs.
    glyphRemap: new Map(),
    required: codeCharacters,
    intl: false,
    fallback: {
      family: 'Avelune Mono Fallback',
      // Courier New and its clones set every glyph 0.6 em wide, as Plex Mono does, so only vertical metrics move.
      faces: [
        {
          weight: 400,
          local: ['Courier New', 'CourierNewPSMT', 'Liberation Mono', 'Cousine'],
          metrics: 'LiberationMono-Regular.ttf',
        },
      ],
    },
  },
];

/** Output file of a subset of a family, relative to the output directory. */
export function subsetFile(family: Family, subset: Subset): string {
  return `${family.id}-${subset.name}.woff2`;
}
