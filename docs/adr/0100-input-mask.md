# 0100. Input mask: Maskito under a kit directive on the native input, the clean value in the form

- Status: Accepted (2026-09-30; the mask was asked for by the product owner, 2026-09-30: "a regex or the like, to type phone numbers and so on"; the rest is the agent's)
- Date: 2026-09-30
- Related: 0039, 0040, 0046, 0047, 0049, 0091; brief §9.1, §9.3; WCAG 2.2 SC 1.3.5, 3.3.2

## Context

- A work system asks for phone numbers, tax numbers, personal numbers, card and account numbers. People type and paste them in every shape. The form needs one shape, and people need to see the number grouped as it is written.
- Uzbek formats, checked on 2026-09-30:
  - A phone is `+998` and nine digits, written `+998 90 123-45-67`.
  - STIR (INN) has 9 digits. JShShIR (PINFL) has 14. A bank's MFO has 5, an account 20, written in fours on gov.uz. A postcode has 6.
  - A passport or ID card number is two Latin letters and seven digits, written without a space (`AA1234567`).
  Sources: lookuptax.com, help.paysend.com, gov.uz bank details, ppt.ru.
- Masking by hand means the caret after every change, deleting over a written character, paste, drop, the browser's autofill, IME composition, undo and redo, Android keyboards that send no key events.
  - `@maskito/core` 5.6.0 (Taiga UI, Apache-2.0, no dependencies, released 2026-09-28) handles all of these on `beforeinput`. It is 3.1 kB brotli, and 4 kB with the prefix and caret helpers of `@maskito/kit` 5.6.0.
  - A prototype in Chromium: typing `90x1234567`, and pasting `+998 90 123 45 67`, `998901234567`, `(90) 123-45-67` or `901234567` all gave `+998 90 123-45-67`. Clearing kept the `+998 ` prefix, leaving an empty field removed it, and undo worked.
  - `ngx-mask` 22.2.1 brings its own value accessor, and its package is 648 kB. `@maskito/angular` adds a directive that keeps the text as it shows in the form.
- Signal Forms (Angular 22.2) treats any directive on the element with a `value` model as a custom control, a native input included. It then binds the model and a `touch` output. It still sets the native `disabled`, `readonly`, `required`, `name`, `pattern`, `minLength` and `maxLength`, unless the control declares an input of that name (`customControlCreate` in `@angular/forms/signals`).
- GUIDELINES and the Input's and FormField's docs put a format in the hint, never in the placeholder.

## Decision

1. **`AveMask` on `input[aveInput][aveMask]`** in `@avelune/ui/mask` (layer components) enhances the kit's input (non-negotiable 6). It runs `@maskito/core` on it, and the kit's prefix and caret helpers from `@maskito/kit`; both become dependencies of `@avelune/ui`. It adds no look, no placeholder and no characters of its own.
2. **What it takes:** `aveMask` is `AveMaskPreset | AveMaskPattern | RegExp`.
   - Presets: `phone` (`+998 00 000-00-00`), `stir` (9 digits), `pinfl` (14), `passport` (`AA0000000`), `card` (`0000 0000 0000 0000`), `account` (20 digits in fours), `mfo` (5), `postcode` (6).
   - A pattern's characters: `0` a digit, `A` a Latin letter (written upper case), `a` any letter, `*` a letter or a digit, `\` before one of them writes it as it is. Anything else is written for the person.
   - A `RegExp` is a filter that the whole text must match after every change, so it must accept a partial text (`/^[A-Z0-9-]{0,12}$/`).
3. **The form holds the clean value**, while the input shows it grouped.
   - A pattern holds the characters typed into its places (`AA1234567`, 20 digits). With `value: 'shown'` it holds the text as shown.
   - `phone` holds E.164 (`+998901234567`), or nothing until a digit is typed, so focusing an empty field changes nothing.
   - A `RegExp` holds the text.
   - A value the program writes is shown grouped. Partial input is held as it is, for the validators to see.
4. **Both form APIs** (ADR 0046):
   - `value` is a model and `touch` an output, so `[formField]` binds the directive. For Reactive Forms it sets itself as `NgControl.valueAccessor`, and `disabled` from the form reaches the native input.
   - It declares `pattern`, `minLength` and `maxLength` inputs, so Signal Forms puts these constraints on the value and never on the grouped text: a native `maxlength` of 13 would stop a phone at `+998 90 123-4`.
   - `aveMaskPattern(mask)` gives the RegExp a complete value matches, for `pattern()` in Signal Forms and `Validators.pattern()`. Required and the error's words stay the application's (ADR 0040).
5. **Typing:**
   - `inputmode` is `tel` for the phone and `numeric` for the digit masks. `passport` gets `autocapitalize="characters"`. Either is set only where the application has not set it.
   - The phone adds `+998 ` on focus and takes it away on blur while no digit is typed. The caret cannot go into the prefix. A pasted or autofilled number loses everything but its digits, and a leading 998 of a twelve-digit number.
   - A character that does not fit is not written, as the field's hint says which fit (WCAG 3.3.2). Autocomplete tokens (1.3.5) are the application's: `autocomplete="tel"` on a phone.
6. **Checks:** `AveMaskHarness`; unit tests in Chromium with real typing and paste (every preset, a pattern, a RegExp, Signal Forms, Reactive Forms, a value written by the program, disabled); stories; the showcase's contract form (the counterparty's phone); a size budget.

## Alternatives considered

- **The kit's own mask engine:** the caret, IME, Android and history cases are where masks fail, and Maskito is maintained with tests across browsers.
- **The text as shown in the form (Maskito's Angular directive, ADR 0039's native accessor):** the backend wants `+998901234567`, and a value the program writes would show ungrouped until someone typed.
- **`ngx-mask`:** a larger package with its own accessor and syntax, and no plain Signal Forms control.
- **A native `pattern` attribute only:** it says a value is wrong after the fact, and helps no one type it.
- **A guide of placeholders in the value (`+998 __ ___-__-__`):** screen readers read every underscore, and the kit puts the format in the hint.

## Consequences

- `@maskito/core` and `@maskito/kit` are new dependencies, listed in compatibility.md. Only an application that imports `@avelune/ui/mask` bundles them.
- Not taken: a number mask with the locale's group separator for amounts (`@maskito/kit`'s number mask adds 3 kB and gives a number, a model of another type); other countries' phones; a card's Luhn check.
- The Input's docs point to the mask for formatted values.
