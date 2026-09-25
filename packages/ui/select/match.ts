/**
 * Text as a combobox compares it (ADR 0046): lower case, without the spaces around it, and with every apostrophe
 * people type for the Uzbek ʻ and ʼ (U+02BB, U+02BC, U+2018, U+2019, the ASCII ' and `) as one, so "o'zbek" finds
 * "Oʻzbekiston".
 */
export function searchable(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase()
    .replace(/[ʻʼ‘’'`]/g, 'ʼ');
}

/** Whether an option's label contains what was typed. */
export function matches(label: string, query: string): boolean {
  return searchable(label).includes(searchable(query));
}
