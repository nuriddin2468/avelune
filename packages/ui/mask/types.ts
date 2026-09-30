/**
 * A mask the kit knows, for Uzbek numbers (ADR 0100):
 * - `phone`: `+998 90 123-45-67`, held as `+998901234567`;
 * - `stir`: the 9 digits of a taxpayer number (INN);
 * - `pinfl`: the 14 digits of a personal number (JShShIR);
 * - `passport`: two Latin letters and seven digits of a passport or ID card, `AA1234567`;
 * - `card`: `8600 1234 5678 9012`, held as 16 digits;
 * - `account`: a bank account's 20 digits, written in fours;
 * - `mfo`: a bank's 5 digits;
 * - `postcode`: 6 digits.
 *
 * @beta
 */
export type AveMaskPreset = 'phone' | 'stir' | 'pinfl' | 'passport' | 'card' | 'account' | 'mfo' | 'postcode';

/**
 * A mask by its pattern (ADR 0100): `0` a digit, `A` a Latin letter (written upper case), `a` any letter, `*` a
 * letter or a digit, `\` before one of them writes it as it is; anything else is written for the person.
 *
 * @beta
 */
export interface AveMaskPattern {
  /** The pattern: `'00-000'`, `'AA 000'`. */
  readonly pattern: string;
  /** What the form holds: the characters typed into the pattern's places (the default), or the text as shown. */
  readonly value?: 'typed' | 'shown';
  /** The keyboard a phone shows: numeric for a pattern of digits only, text otherwise, unless given. */
  readonly inputMode?: AveMaskInputMode;
}

/**
 * The keyboards a mask asks a phone for (`inputmode`).
 *
 * @beta
 */
export type AveMaskInputMode = 'text' | 'numeric' | 'tel';

/**
 * What `aveMask` takes: a preset, a pattern, or a `RegExp` the whole text must match after every change (so one that
 * accepts a partial text, such as `/^[A-Z0-9-]{0,12}$/`).
 *
 * @beta
 */
export type AveMaskInput = AveMaskPreset | AveMaskPattern | RegExp;
