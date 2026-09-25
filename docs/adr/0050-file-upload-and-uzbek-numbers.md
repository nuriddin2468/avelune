# 0050. FileUpload: a drop zone around a button, a list with reasons; Uzbek numbers from Uzbek Cyrillic's symbols

- Status: Accepted (2026-09-25; the look chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0039, 0046, 0047, 0048, 0049; brief §9.4; ROADMAP.md tracked risk "Chromium's Intl formats uz"

## Context

Facts, verified on 2026-09-25 in the pinned image's Chromium, Firefox and WebKit, and in Angular 22.2.0 / CDK 22.2.0:

- **Numbers:** Chromium formats `uz-Latn` with root symbols (`1,234,567.8`); Firefox and WebKit write `1 234 567,8` (group U+00A0, decimal comma, `15%`), and `uz-Cyrl` gives exactly those code points in all three. CLDR's Uzbek units are English (`2,4 byte`, `kB`); Russian's are `Б, кБ, МБ, ГБ`.
- An `<input type="file">` cannot be styled at the browser floor; `click()` on a hidden one opens the system's dialog. The dialog takes the window's focus and leaves the input's opener focused.
- ARIA allows `aria-required` on textboxes, comboboxes and groups of choices, not on a button.
- CDK's `LiveAnnouncer` hides its live element with `cdk-visually-hidden` but does not load that class's styles; only `cdkAriaLive` and the focus trap load them (`_CdkPrivateStyleLoader` and `_VisuallyHiddenLoader` from `@angular/cdk/private`). Without them the announcement showed on the page.
- A file dropped where the page does not prevent the default is opened by the browser, leaving the page. `dropEffect` can be set only during a real drag.
- The product owner chose (2026-09-25) a drop zone with the button inside it, and the list of files under it.

## Decision

1. **Numbers** (`@avelune/ui/i18n`): `aveNumberFormat(locale, options)` returns `Intl.NumberFormat`, with Uzbek Cyrillic's symbols for plain numbers and percentages in Uzbek (Latin); `aveFileSize(bytes, locale)` writes units of 1024 with one decimal under 10 (`2,4 МБ`, `2,4 MB`, `2.4 MB`), units from the kit's table per script.
2. **`@avelune/ui/file-upload`** (composites), `<ave-file-upload>`: a zone (`radius.lg`, a dashed `border.strong`, `space.4` padding) holding a secondary `button[aveButton]` with the `upload` icon and "or drag them here" (left out without a fine pointer, hidden but kept in place when disabled); a hidden `input[type=file]` with `accept` and `multiple`; under them a boxed list (`border.subtle`, `radius.lg`, rows of `control.height.lg`) of each file's icon, name (wrapping anywhere), size and a ghost `sm` IconButton 4px from the edge with an inset focus ring.
3. **Behaviour:** one file replaces the one there; `multiple` adds, skips a file already there (name, size, time) and stops at `maxFiles`. Every file, chosen or dropped, is checked against `accept` (extensions, MIME types, wildcards) and `maxSize` (bytes). Files not taken are listed with the reason in the locale until removed or until the next choice. The zone prevents the default of every drag and drop, and takes the accent while files are over it. `LiveAnnouncer` says how many files were attached and why any were not; the component loads CDK's visually hidden styles itself. After a removal, focus goes to the remove button in its place, the one before, or the choose button (no library behaviour covers this).
4. **Forms:** the value is `File[]` (a `model`), bound as ADR 0046 does; "at least one" is `minLength(path, 1)` (ADR 0049). The field is touched when focus leaves it, not when the system's dialog takes the window's focus.
5. **Accessibility:** the button is named by the field's label (or `label`) and its words (`aria-labelledby`), described by "Required" (a new message), the hint and the error. `AveControlOwner` gains `controlDescriptions` for such ids, and `connectToField` never puts `aria-required` on a plain button.
6. **Messages** (ADR 0047) may be functions: `removeFile(name)`, `fileTooLarge(limit)`, `tooManyFiles(max)` (Russian genitive by `Intl.PluralRules`), `filesAdded(count)`, with `chooseFile(s)`, `dropFile(s)`, `files`, `fileTypeRejected`, `required`.

## Alternatives considered

- **A styled native file input** or an `input[type=file][aveFileUpload]` directive: the input cannot be styled, and a directive cannot render the zone and the list around it.
- **`cdkAriaLive` on an element of the component:** it announces a text only when it differs from the last, so the same file added twice would be silent.
- **The kit's own visually hidden class for CDK's element:** 1px sizes are not tokens, and it duplicates CDK's own styles.
- **CDK DragDrop:** it reorders elements; it does not take files.

## Consequences

- The kit does not upload: the application sends the files it gets. Progress, previews and cropping are not in this version.
- `@angular/cdk/private` is a private entry point; an upgrade that renames it fails the type-check. Report the missing style load upstream.
- Slider formats its values with `aveNumberFormat`; the ROADMAP risk on Uzbek numbers is resolved for plain numbers and percentages, not for currency.
