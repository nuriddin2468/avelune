import { isUzbekLatin, localeTags } from './locale';

/**
 * An `Intl.NumberFormat` for a locale, with Uzbek in Latin script written right (ADR 0050). Chromium has no data
 * for it and writes the root `1,234,567.8`; Firefox and WebKit write CLDR's `1 234 567,8`, whose digits and
 * separators are exactly those of Uzbek in Cyrillic in every browser. So plain numbers and percentages in Uzbek (Latin)
 * are formatted with Uzbek in Cyrillic's symbols; other styles (currency, units) keep the locale.
 *
 * ```ts
 * aveNumberFormat('uz-Latn', { maximumFractionDigits: 1 }).format(1234.56); // "1 234,6"
 * ```
 *
 * @beta
 */
export function aveNumberFormat(locale: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  const style = options.style ?? 'decimal';
  const symbols = isUzbekLatin(locale) && (style === 'decimal' || style === 'percent') ? 'uz-Cyrl' : locale;
  return new Intl.NumberFormat(symbols, options);
}

/** The units of a file size, bytes to gigabytes, per script: CLDR's Uzbek units are English, so the kit keeps its own. */
const units = {
  cyrillic: ['Б', 'кБ', 'МБ', 'ГБ'],
  latin: ['B', 'kB', 'MB', 'GB'],
} as const;

/**
 * A file size as people read it (ADR 0050): bytes, kilobytes, megabytes or gigabytes of 1024, with one decimal under
 * 10 and none above, a no-break space before the unit: `2,4 МБ` (ru), `2,4 MB` (uz-Latn), `2.4 MB` (en), `512 Б`.
 *
 * @beta
 */
export function aveFileSize(bytes: number, locale: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.latin.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const { language, subtags } = localeTags(locale);
  const script = language === 'ru' || (language === 'uz' && subtags.includes('cyrl')) ? units.cyrillic : units.latin;
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${aveNumberFormat(locale, { maximumFractionDigits: digits }).format(value)}\u00a0${script[unit] ?? ''}`;
}
