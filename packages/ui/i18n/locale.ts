/** The language of a BCP 47 tag and its other subtags, lower case (`uz-Latn-UZ` → `uz`, `latn`, `uz`). */
export function localeTags(locale: string): { language: string; subtags: string[] } {
  const [language = '', ...subtags] = locale.toLowerCase().split(/[-_]/);
  return { language, subtags };
}

/**
 * Whether a locale is Uzbek in Latin script, the one the kit writes itself: Chromium has no data for it (ADR 0048,
 * 0050). Uzbek without a script is Latin.
 */
export function isUzbekLatin(locale: string): boolean {
  const { language, subtags } = localeTags(locale);
  return language === 'uz' && !subtags.includes('cyrl');
}
