# 0041. Checkbox: a drawn native checkbox and a choice label

- Status: Accepted (2026-09-24, technical decision within Wave 1)
- Date: 2026-09-24
- Related: 0030, 0039, 0040; brief §8.1, §9.1

## Context

Brief §9.1 enhances native elements and never wraps them, and every control works with both form APIs (ADR 0039). A native checkbox cannot be themed; with `appearance: none` it is drawn by CSS, and its `::before` renders in current browsers. Facts, verified on 2026-09-24 (Angular 22.1.7, Chromium 153):

- `indeterminate` is a DOM property only, with no attribute; a click clears it natively and toggles `checked`.
- A `model()` input takes no transform, so a static `indeterminate` attribute would bind an empty string.
- Forced colours paint author backgrounds with the canvas colour, which would hide a drawn fill and tick.
- A 16px box on a 20px line is smaller than the 24px minimum target (WCAG 2.5.8); its label, when it wraps the input, is part of the target.

## Decision

1. **`AveCheckbox`** (`@avelune/ui/checkbox`, layer components) is a component on `input[type=checkbox][aveCheckbox]` with an empty template. It calls `injectControlState()` and `connectToField()`. Its one input is the model `indeterminate`, bound to the DOM property and cleared on `change`, as the browser clears it.
2. **`AveChoice`** on `label[aveChoice]` is its label: the control, then its text, 8px apart, `body-md`, a single line 24px tall; it dims when its control is disabled (`:has(:disabled)`). Radio and Switch (Wave 2) reuse it.
3. **Look**, from tokens: a box of `size.icon.sm` with a `border.strong` border and `radius.sm`, 2px above and below it, so it sits on the middle of a 20px line. Checked and mixed: the `accent.bg` fill (`-hover` on hover), a tick (a `clip-path` polygon) or a 2px bar in `fg.on-accent`. Invalid: `danger.border`. Disabled: `bg.disabled`, mark in `fg.disabled`. Forced colours: `forced-color-adjust: none` with `CanvasText`, `Highlight`, `HighlightText` and `GrayText`.
4. **Required** comes from Signal Forms' `required` or Reactive Forms' `Validators.requiredTrue`, which `injectControlState()` now recognises beside `Validators.required`.
5. **Harness:** `AveCheckboxHarness`: checked, mixed, disabled, required, invalid, the label (its `aria-label`, or the text of its first label), toggle, check, uncheck.
6. `input` with `aveCheckbox` joins `kitElements`.

## Alternatives considered

- **A `<ave-checkbox>` wrapper with its own label:** wraps a native element (brief §9.1).
- **An SVG tick as a data URI mask:** a second drawing technique, a raw path in CSS, and no forced-colours control.
- **A kit `ControlValueAccessor`:** the native checkbox accessors of both form APIs already bind it.

## Consequences

- An application writes `<label aveChoice><input type="checkbox" aveCheckbox …> Text</label>`; a checkbox without a visible label needs `aria-label`.
- Firefox and WebKit render `::before` on `appearance: none` checkboxes; the visual suite runs Chromium, so a check in the other engines belongs to the manual a11y checklist before stable.
