# 0055. Rich options in the select family: fields of an option in one row layout, and templates inside the kit's row

- Status: Accepted (2026-09-25; the image's size and place chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0033, 0036, 0046, 0052; brief §9.1; ROADMAP.md "Wave 2 additions", item 4

## Context

Facts, verified on 2026-09-25 in Angular 22.2.0, Angular Aria 22.2.0 and Chromium 153:

- An option of the select family (ADR 0046) is its label and a check. Work systems choose among people (a name and a department), countries (a flag and a code), accounts (a number and a balance).
- Angular Aria's option takes a `label` only for typeahead (`searchTerm`); its accessible name is its content.
- `NgOptimizedImage` throws in development on a `data:` or `blob:` URL (NG02952), which an application uses for a local image or a preview; `@angular-eslint/template/prefer-ngsrc` rejects a plain `<img src>`. A host binding of a custom property (`[style.--…]`, as the slider does, ADR 0051) is outside the template rules.
- CSS keeps a `url()` background image in forced colours.
- The product owner chose (2026-09-25) an image in a 20px square, drawn whole (`contain`), with `radius.sm`, level with the first line; one size for flags, avatars and logos.

## Decision

1. **Fields of an option** (`AveOption<V>`): besides `value`, `label` and `disabled`, `description` (a second line), `icon` (a registered icon's name) or `image` (a URL), never both (the type is a union), and `meta` (text at the end: a code, a count). `label` stays required: it is the option's accessible name, what typeahead and the combobox's search read, and what the trigger says.
2. **One row layout**, drawn by an internal `ave-option-content` in every list of the family: the icon or image in a 20px box at the start (an icon at `size.icon.sm`, centred), the label and under it the description in `body-sm` and `fg.muted`, the meta at the end in `body-sm`, `fg.muted` and tabular figures, the check last. The start box, the meta and the check are level with the first line; the row keeps the control height, its padding and the check. The image is the box's background, from a custom property the component binds on its host, decorative.
3. **Names:** each option is named by its label (`aria-label`); its description and meta describe it (`aria-describedby`).
4. **The trigger:** a select shows the chosen option's icon or image before its label; a multiselect names the chosen labels; a combobox's input holds text only.
5. **Templates, the way out:** `<ng-template aveOption let-option>` draws the inside of every option in the application's markup, and `<ng-template aveSelectValue let-option>` the chosen value inside a select's trigger. Both are drawn inside the kit's row or trigger: its height, padding, check, chevron and clear button stay. `[aveOptionOf]` and `[aveSelectValueOf]` take the options, so `let-option` is typed with their value. An option drawn by a template is still named by its label.

## Alternatives considered

- **An `<img>` with `ngSrc`:** it refuses data and blob URLs. **With `src`:** the template rule, which the kit keeps.
- **Options as projected components:** Aria's option injects its listbox (ADR 0046).
- **A template without the kit's row:** every application would draw its own height, padding and check.
- **Icon and image both allowed:** two marks at the start of one row, one of them ignored.
- **The description in the name:** a long name read at every arrow key; a description is read after it.

## Consequences

- The option row aligns its check with the first line: a label that wraps keeps its check at the top, not in the middle.
- An application registers the icons its options name (`provideAveIcons`, ADR 0036); `AveIcon` throws in development for one it did not.
- The harnesses read an option's label from its name, so a description or a template does not change what they find.
- Found on the way: Aria's listbox cuts its selection to its options whenever they change, so a combobox's search that hid the chosen option unchose it, and the typed text went with it; a list of grid rows past its height kept every row at an option's minimum, so a second line overflowed. The family now ignores a change that only drops values no option holds (a multiselect keeps them, after the values the list shows), and the list's rows are as tall as their options.
