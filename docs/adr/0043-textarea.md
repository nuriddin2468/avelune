# 0043. Textarea: a native textarea in the box of an input, a fixed number of rows

- Status: Accepted (2026-09-25, technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0024, 0039, 0040; brief §8.2, §9.1

## Context

Wave 2 starts with Textarea: text of several lines, such as a comment or the subject of a contract. ADR 0039 gives every control its state and its link to a form field. Facts, verified on 2026-09-25 (Angular 22.2.0, `@mdn/browser-compat-data` 8.1.2):

- Both form APIs bind a `<textarea>` natively: Signal Forms' `[formField]` accepts it as a native control, and Reactive Forms' `DefaultValueAccessor` selects `textarea[formControl]`, `textarea[formControlName]` and `textarea[ngModel]`.
- `resize: block` is supported at the floor (Chrome and Edge 118, Firefox 63, Safari 16); iOS Safari shows no resize handle at all.
- `field-sizing: content`, which lets a textarea grow with its text, is not: Chrome and Edge 123, Firefox 152, Safari 26.2. Growing would need script, such as CDK's `cdkTextareaAutosize`.
- The `rows` property falls back to the browser's 2 for 0, a negative number or `NaN`, and drops a fraction (Chromium, probed on 2026-09-25); `numberAttribute` turns a non-numeric attribute into `NaN`.
- `font.body-md` is 14/20. An input of each size is `control.height.*` tall with its text on one 20px line.

## Decision

1. **`AveTextarea`** (`@avelune/ui/textarea`, layer components) is a component on `textarea[aveTextarea]` with an empty template. It calls `injectControlState()` and `connectToField()`, so it works in `<ave-form-field>` like Input.
2. **Inputs:** `size` (`sm`, `md`, `lg`; `md` by default) and `rows`, the lines it shows before it scrolls: 3 by default; a fraction is dropped, and anything below 1 or not a number becomes 3.
3. **Box:** Input's border, radius, inline padding and 14/20 text for its size. The block padding is half of the control height minus the line, minus the border, so a one-row textarea is exactly as tall as an input of its size, in both densities, and a textarea of n rows is 20n + (control height − 20) px tall. Its minimum height is one row. People can drag it taller (`resize: block`), never wider.
4. **States** as Input: the `danger.border` border when invalid; readonly dashed on `bg.surface-sunken`; disabled flat on `bg.disabled` without a resize handle; `GrayText` in forced colours.
5. **No growing with the content** in this version. A textarea that grows is an addition through an RFC, on CDK's autosize, once a screen needs it.
6. **Harness:** `AveTextareaHarness` in `@avelune/ui/textarea/testing`, with the Input harness's methods plus `getRows()`.
7. `textarea` with `aveTextarea` joins `kitElements`; the same-size invariant compares a textarea's radius, border, font size and inline padding with the other controls of its size, but not its height.

## Alternatives considered

- **`aveInput` on a `<textarea>` too:** one directive for two elements would need a type check at run time and a `rows` input that means nothing on an input.
- **`field-sizing: content` where the browser has it:** the same form would grow in one browser and scroll in another.
- **The browser's default of 2 rows:** too little for the comments and subjects of the consumers' forms; 3 rows show a short paragraph without scrolling.

## Consequences

- A textarea lines up with the inputs of its size in a form: the same left edge of text, the same corners, and one line of it the same height.
- Enter inserts a line break; a textarea never submits its form.
