# 0047. Kit messages: the words components say themselves, per locale, replaceable

- Status: Accepted (2026-09-25, technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0046; brief §0 (locales uz-Latn, uz-Cyrl, ru, en)

## Context

Most words on a screen are the application's: labels, hints, errors. A few are the kit's own: a combobox's empty list says "No results", and a date picker and a file upload (Wave 2) name their buttons and state. The consumers work in uz-Latn, uz-Cyrl, ru and en. Angular's `LOCALE_ID` is the application's locale; the kit does not use `$localize`, which would ask every application to extract and translate the kit's strings.

## Decision

1. **`@avelune/ui/i18n`** (layer foundations) holds `AveMessages`, one typed key per message, and the kit's messages in English, Russian, Uzbek in Latin and Uzbek in Cyrillic (`aveMessagesEn`, `-Ru`, `-UzLatn`, `-UzCyrl`).
2. `aveMessagesFor(locale)` picks them by BCP 47 tag: `ru*` Russian; `uz` with a `Cyrl` subtag Uzbek in Cyrillic; any other `uz` Uzbek in Latin; anything else English.
3. `injectAveMessages()` gives a component the messages for `LOCALE_ID`, with the nearest `provideAveMessages(partial)` over them, so an application or a part of it can reword a message or add a locale.
4. A component that says something adds its key to `AveMessages` in all four locales; a test checks that every locale has every key and none is empty.

## Alternatives considered

- **`$localize` in the kit:** every application would extract and translate the kit's strings, and a missing translation would fall back silently.
- **An input per message on each component (`noResultsText`):** the same words repeated on every use, and forgotten on some.
- **English only, replaced by the application:** the consumers' locales are known and few.

## Consequences

- The four locales grow with each component that speaks; the Uzbek texts are checked by the product owner at the wave's review.
- An application that sets no `LOCALE_ID` gets English.
