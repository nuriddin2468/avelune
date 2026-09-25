/**
 * A calendar date without a time or a time zone, in ISO 8601 form: `2026-09-23`. The date picker's value
 * (ADR 0048): a string, so it survives JSON and time zones unchanged.
 *
 * @alpha
 */
export type AvePlainDate = string;

/**
 * How dates are written and named in a locale (ADR 0048): the names a calendar shows, the formats of a date, and how
 * a typed date is read.
 *
 * @alpha
 */
export interface AveDateFormat {
  /** The locale the format is for. */
  readonly locale: string;
  /** The first day of the week: 1 Monday … 7 Sunday. */
  readonly firstDayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /**
   * The weekday names, Sunday first, in full ("понедельник") and abbreviated with a capital, as a calendar's column
   * heads them ("Пн"); single letters would repeat (П, В, С twice in Russian).
   */
  readonly weekdays: readonly { readonly long: string; readonly short: string }[];
  /** What a date field shows while empty: the order and the separators, in the locale's letters ("дд.мм.гггг"). */
  readonly placeholder: string;
  /** A date as people type it: `23.09.2026` (ru), `23/09/2026` (uz), `09/23/2026` (en). */
  numeric(date: AvePlainDate): string;
  /** A date in words: "23 сентября 2026 г.", "23-sentabr, 2026", "September 23, 2026". */
  long(date: AvePlainDate): string;
  /** A month and its year, as a calendar's heading: "Сентябрь 2026 г.", "Sentabr, 2026". */
  monthYear(year: number, month: number): string;
  /** Reads a typed date in the locale's order, with any of `. / - ` between the parts; null when it is not a date. */
  parse(text: string): AvePlainDate | null;
}

type Order = 'dmy' | 'mdy';

/** Uzbek in Latin script, from CLDR as Firefox and WebKit ship it (Chromium has none, 2026-09-25; ADR 0048). */
const uzLatn = {
  monthsInDate: [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ],
  weekdaysLong: ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'],
  weekdaysShort: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
} as const;

/**
 * The parts of an ISO date (month 1–12), or null when the string is not one or not a real date.
 *
 * @alpha
 */
export function plainDateParts(date: AvePlainDate): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isRealDate(year, month, day) ? { year, month, day } : null;
}

/**
 * An ISO date from its parts (month 1–12).
 *
 * @alpha
 */
export function toPlainDate(year: number, month: number, day: number): AvePlainDate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The UTC instant of an ISO date's midnight, for Intl, which then formats in UTC. */
function utc(date: AvePlainDate): Date {
  const parts = plainDateParts(date);
  if (parts === null) throw new Error(`Not an ISO calendar date: "${date}"`);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function tags(locale: string): { language: string; subtags: string[] } {
  const [language = '', ...subtags] = locale.toLowerCase().split(/[-_]/);
  return { language, subtags };
}

/** Whether the kit writes the locale's dates itself: Uzbek, unless in Cyrillic. */
function isUzbekLatin(locale: string): boolean {
  const { language, subtags } = tags(locale);
  return language === 'uz' && !subtags.includes('cyrl');
}

function firstDayOf(locale: string): AveDateFormat['firstDayOfWeek'] {
  const { language, subtags } = tags(locale);
  // English in the United States (and English without a region) starts on Sunday; the kit's other locales on Monday.
  return language === 'en' && (subtags.length === 0 || subtags.includes('us')) ? 7 : 1;
}

/**
 * The date format of a locale (ADR 0048). Intl writes Russian, English and Uzbek in Cyrillic; the kit writes Uzbek in
 * Latin script itself, from CLDR, because Chromium has no data for it and falls back to `2026 M09 23`.
 *
 * @alpha
 */
export function aveDateFormat(locale: string): AveDateFormat {
  const uz = isUzbekLatin(locale);
  const { language } = tags(locale);
  const order: Order = language === 'en' ? 'mdy' : 'dmy';
  const separator = language === 'ru' ? '.' : '/';
  const intl = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...options });
  const longFormat = intl({ day: 'numeric', month: 'long', year: 'numeric' });
  const monthYearFormat = intl({ month: 'long', year: 'numeric' });
  const weekdayLong = intl({ weekday: 'long' });
  const weekdayShort = intl({ weekday: 'short' });
  const capital = (text: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
  // 2026-09-20 is a Sunday.
  const sunday = (offset: number) => new Date(Date.UTC(2026, 8, 20 + offset));
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((offset) =>
    uz
      ? { long: uzLatn.weekdaysLong[offset] ?? '', short: uzLatn.weekdaysShort[offset] ?? '' }
      : { long: weekdayLong.format(sunday(offset)), short: capital(weekdayShort.format(sunday(offset))) },
  );
  const letters: Readonly<Record<string, readonly [string, string, string]>> = {
    ru: ['дд', 'мм', 'гггг'],
    en: ['dd', 'mm', 'yyyy'],
  };
  const [dd, mm, yyyy] = uz
    ? (['kk', 'oo', 'yyyy'] as const)
    : language === 'uz'
      ? (['кк', 'оо', 'йййй'] as const)
      : (letters[language] ?? ['dd', 'mm', 'yyyy']);
  const two = (value: number) => String(value).padStart(2, '0');
  return {
    locale,
    firstDayOfWeek: firstDayOf(locale),
    weekdays,
    placeholder: order === 'mdy' ? [mm, dd, yyyy].join(separator) : [dd, mm, yyyy].join(separator),
    numeric(date) {
      const parts = plainDateParts(date);
      if (parts === null) return '';
      const [first, second] = order === 'mdy' ? [parts.month, parts.day] : [parts.day, parts.month];
      return [two(first), two(second), String(parts.year)].join(separator);
    },
    long(date) {
      if (!uz) return longFormat.format(utc(date));
      const parts = plainDateParts(date);
      return parts === null
        ? ''
        : `${String(parts.day)}-${uzLatn.monthsInDate[parts.month - 1] ?? ''}, ${String(parts.year)}`;
    },
    monthYear(year, month) {
      const text = uz
        ? `${uzLatn.monthsInDate[month - 1] ?? ''}, ${String(year)}`
        : monthYearFormat.format(new Date(Date.UTC(year, month - 1, 1)));
      return capital(text);
    },
    parse(text) {
      const match = /^\s*(\d{1,2})\s*[./\-\s]\s*(\d{1,2})\s*[./\-\s]\s*(\d{2}|\d{4})\s*$/.exec(text);
      if (match === null) return null;
      const [a, b, y] = [Number(match[1]), Number(match[2]), match[3] ?? ''];
      const [day, month] = order === 'mdy' ? [b, a] : [a, b];
      const year = y.length === 2 ? 2000 + Number(y) : Number(y);
      return isRealDate(year, month, day) ? toPlainDate(year, month, day) : null;
    },
  };
}
