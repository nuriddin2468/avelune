import type { MaskitoOptions, MaskitoPostprocessor, MaskitoPreprocessor } from '@maskito/core';
import {
  maskitoAddOnFocusPlugin,
  maskitoCaretGuard,
  maskitoPrefixPostprocessorGenerator,
  maskitoRemoveOnBlurPlugin,
} from '@maskito/kit';
import type { AveMaskInput, AveMaskInputMode, AveMaskPattern, AveMaskPreset } from './types';

/** A place of a pattern: a character written for the person, or one the person types. */
type Place =
  { readonly literal: string } | { readonly accepts: RegExp; readonly source: string; readonly upper: boolean };

/** What the directive runs a mask with (ADR 0100). */
export interface AveCompiledMask {
  /** What Maskito runs. */
  readonly options: MaskitoOptions;
  /** The value the form holds for what the input shows. */
  readonly toValue: (shown: string) => string;
  /** What the input shows for a value the form holds. */
  readonly toShown: (value: string) => string;
  /** What a complete value matches; none for a `RegExp` mask, which is its own. */
  readonly complete: RegExp | null;
  /** The keyboard a phone shows. */
  readonly inputMode: AveMaskInputMode;
  /** Whether a phone's keyboard starts each letter upper case. */
  readonly capitalize: boolean;
}

const tokens: Readonly<Record<string, { readonly accepts: RegExp; readonly source: string; readonly upper: boolean }>> =
  {
    '0': { accepts: /\d/, source: '\\d', upper: false },
    A: { accepts: /[A-Za-z]/, source: '[A-Z]', upper: true },
    a: { accepts: /\p{L}/u, source: '\\p{L}', upper: false },
    '*': { accepts: /[\p{L}\d]/u, source: '[\\p{L}\\d]', upper: false },
  };

/**
 * The places of a pattern. Strings are read by UTF-16 unit, as Maskito lines a value up with its mask by index.
 */
function placesOf(pattern: string): Place[] {
  const places: Place[] = [];
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern.charAt(index);
    const next = index + 1 < pattern.length ? pattern.charAt(index + 1) : undefined;
    if (character === '\\' && next !== undefined) {
      places.push({ literal: next });
      index++;
      continue;
    }
    places.push(tokens[character] ?? { literal: character });
  }
  return places;
}

/** The characters typed into the places of what the input shows. */
function typedIn(places: readonly Place[], shown: string): string {
  let typed = '';
  for (let index = 0; index < shown.length && index < places.length; index++) {
    const place = places[index];
    if (place !== undefined && !('literal' in place)) typed += shown.charAt(index);
  }
  return typed;
}

/** What the input shows for typed characters: each in the next place that accepts it, the pattern's own between. */
function fill(places: readonly Place[], typed: string): string {
  let next = 0;
  let shown = '';
  let written = '';
  for (const place of places) {
    if ('literal' in place) {
      written += place.literal;
      continue;
    }
    while (next < typed.length && !place.accepts.test(typed.charAt(next))) next++;
    if (next >= typed.length) break;
    const character = typed.charAt(next++);
    shown += written + (place.upper ? character.toUpperCase() : character);
    written = '';
  }
  return shown;
}

/** A written character in a Unicode `RegExp`, where only syntax characters may be escaped. */
function escape(text: string): string {
  return text.replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&');
}

/** A pasted, dropped or autofilled text keeps only the characters some place accepts. */
function keepAccepted(places: readonly Place[]): MaskitoPreprocessor {
  const accepting = places.flatMap((place) => ('literal' in place ? [] : [place.accepts]));
  return ({ elementState, data }, action) => {
    if (action !== 'insert' || data.length < 2) return { elementState, data };
    let kept = '';
    for (let index = 0; index < data.length; index++) {
      const character = data.charAt(index);
      if (accepting.some((test) => test.test(character))) kept += character;
    }
    return { elementState, data: kept };
  };
}

/** Writes a Latin letter upper case where the pattern asks for it. */
function upperCase(places: readonly Place[]): MaskitoPostprocessor {
  return ({ value, selection }) => {
    let written = '';
    for (let index = 0; index < value.length; index++) {
      const place = places[index];
      const character = value.charAt(index);
      written += place !== undefined && !('literal' in place) && place.upper ? character.toUpperCase() : character;
    }
    return { value: written, selection };
  };
}

/** A mask whose complete value a `RegExp` states. */
type KnownMask = AveCompiledMask & { readonly complete: RegExp };

function compilePattern(mask: AveMaskPattern): KnownMask {
  const places = placesOf(mask.pattern);
  const typed = mask.value !== 'shown';
  const digitsOnly = places.every((place) => 'literal' in place || place.source === '\\d');
  const complete = places.map((place) => ('literal' in place ? (typed ? '' : escape(place.literal)) : place.source));
  return {
    options: {
      mask: places.map((place) => ('literal' in place ? place.literal : place.accepts)),
      preprocessors: [keepAccepted(places)],
      postprocessors: places.some((place) => !('literal' in place) && place.upper) ? [upperCase(places)] : [],
    },
    toValue: (shown) => (typed ? typedIn(places, shown) : shown),
    toShown: (value) => fill(places, typed ? value : typedIn(places, value)),
    complete: new RegExp(`^${complete.join('')}$`, 'u'),
    inputMode: mask.inputMode ?? (digitsOnly ? 'numeric' : 'text'),
    capitalize: places.some((place) => !('literal' in place) && place.upper),
  };
}

/** The phone's written country code, which the field shows on focus and the caret never enters. */
const phonePrefix = '+998 ';

function compilePhone(): KnownMask {
  const national = compilePattern({ pattern: '00 000-00-00' });
  const places = placesOf(`${phonePrefix.replace(/\d/g, '\\$&')}00 000-00-00`);
  // A whole international number, pasted or autofilled, loses its country code with everything but its digits.
  const pasted: MaskitoPreprocessor = ({ elementState, data }, action) => {
    if (action !== 'insert' || data.length < 2) return { elementState, data };
    const digits = data.replace(/\D/g, '');
    return { elementState, data: digits.length === 12 && digits.startsWith('998') ? digits.slice(3) : digits };
  };
  return {
    options: {
      mask: places.map((place) => ('literal' in place ? place.literal : place.accepts)),
      preprocessors: [pasted],
      postprocessors: [maskitoPrefixPostprocessorGenerator(phonePrefix)],
      plugins: [
        maskitoAddOnFocusPlugin(phonePrefix),
        maskitoRemoveOnBlurPlugin(phonePrefix),
        maskitoCaretGuard((value, [from, to]) => [from === to ? phonePrefix.length : 0, value.length]),
      ],
    },
    toValue: (shown) => {
      const digits = typedIn(places, shown);
      return digits === '' ? '' : `+998${digits}`;
    },
    // The form's own value starts with +998; a value the program writes may be a whole number in another shape.
    toShown: (value) => {
      const digits = value.replace(/\D/g, '');
      const whole = value.startsWith('+998') || (digits.length === 12 && digits.startsWith('998'));
      const own = whole ? digits.slice(3) : digits;
      return own === '' ? '' : phonePrefix + national.toShown(own);
    },
    complete: /^\+998\d{9}$/,
    inputMode: 'tel',
    capitalize: false,
  };
}

const presets: Readonly<Record<Exclude<AveMaskPreset, 'phone'>, string>> = {
  stir: '000000000',
  pinfl: '00000000000000',
  passport: 'AA0000000',
  card: '0000 0000 0000 0000',
  account: '0000 0000 0000 0000 0000',
  mfo: '00000',
  postcode: '000000',
};

function compileKnown(mask: AveMaskPreset | AveMaskPattern): KnownMask {
  if (mask === 'phone') return compilePhone();
  return compilePattern(typeof mask === 'string' ? { pattern: presets[mask] } : mask);
}

/** The mask `aveMask` runs, compiled once per value of the input. */
export function aveCompileMask(mask: AveMaskInput): AveCompiledMask {
  if (mask instanceof RegExp) {
    return {
      options: { mask },
      toValue: (shown) => shown,
      toShown: (value) => value,
      complete: null,
      inputMode: 'text',
      capitalize: false,
    };
  }
  return compileKnown(mask);
}

/**
 * The `RegExp` a complete value of a mask matches, for `pattern()` in Signal Forms and `Validators.pattern()` in
 * Reactive Forms: `pattern(path.phone, aveMaskPattern('phone'))`. An empty value passes both, so `required` stays the
 * application's (ADR 0100).
 *
 * @beta
 */
export function aveMaskPattern(mask: AveMaskPreset | AveMaskPattern): RegExp {
  return compileKnown(mask).complete;
}
