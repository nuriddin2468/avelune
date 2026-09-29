import type { AveAvatarKind } from './types';

/** A letter that starts a word: not a modifier letter such as ʻ or ʼ, which Uzbek writes inside words. */
const letter = /[\p{Lu}\p{Ll}\p{Lt}\p{Lo}]/u;

/** The name in quotes of an organisation that has one: "ООО «Мебель Сервис»" → "Мебель Сервис". */
const quoted = /[«"„“]([^»"”“]+)[»"”“]/u;

/**
 * The initials of a name (ADR 0082): the first letters of its first two words, upper-cased for the locale; of an
 * organisation, of the words in quotes when it has them.
 */
export function initialsOf(name: string, kind: AveAvatarKind, locale: string): string {
  const text = kind === 'organization' ? (quoted.exec(name)?.[1] ?? name) : name;
  return text
    .split(/\s+/)
    .map((word) => letter.exec(word)?.[0] ?? '')
    .filter((first) => first !== '')
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase(locale);
}
