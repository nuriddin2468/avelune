# 0051. Slider and RangeSlider: native range inputs, the value in the field's label row, the ring on the thumb

- Status: Accepted (2026-09-25; the value's place chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0030, 0040, 0046, 0048, 0050; brief §6.1, §9.1, §9.4

## Context

Facts, verified on 2026-09-25 in Angular 22.2.0 and in the pinned image's Chromium, Firefox and WebKit:

- A native `input[type=range]` has the slider role, `aria-valuenow`, `-min` and `-max`, and the arrow keys, Page Up, Page Down, Home and End. Angular Aria and CDK have no slider. There is no native input with two thumbs.
- Its parts are styled only through vendor pseudo-elements: `::-webkit-slider-runnable-track` and `::-webkit-slider-thumb`, `::-moz-range-track` and `::-moz-range-thumb`. A browser drops a whole rule whose selector list holds a pseudo-element it does not know. Chromium has no pseudo-element for the part before the thumb.
- An `outline` on the thumb's pseudo-element is drawn in all three browsers; `getComputedStyle` cannot read it.
- Signal Forms binds a control's `min` and `max` inputs from the schema's `min()` and `max()` rules, typed as the control's value, and rejects a template binding of `[min]` or `[max]` next to `[formField]` (NG8022).
- A positioned track is painted over the inputs that follow it in the same grid cell.
- The product owner chose (2026-09-25) the value at the end of the label's row and the bounds under the ends of the track.

## Decision

1. **`@avelune/ui/slider`** (composites): `<ave-slider>` (a number) and `<ave-range-slider>` (`AveNumberRange`, `start` never above `end`), each on native range inputs with `data-focus-ring="thumb"`. The kit draws a 4px track in `border.strong` (3:1) with `radius.full`, the chosen part in the accent (the danger colour while invalid), a 16px accent thumb with `elevation.raised`, all in a 24px row; the bounds under the ends in `body-sm`.
2. **Bounds** are `minValue`, `maxValue` and `step`, named apart from Signal Forms' rules as a date field's `minDate` is; the rules still validate. `format` takes `Intl.NumberFormatOptions`, written with `aveNumberFormat` (ADR 0050) for the value, the bounds and `aria-valuetext`.
3. **The chosen part** is an element of the unpositioned track, sized from `--ave-slider-start` and `--ave-slider-end`, the shares of the track before each thumb, which the host binds as state (declared, with defaults, in the stylesheet). No appearance is set from code.
4. **The range:** two inputs over one track; only their thumbs take the pointer; a thumb stops at the other, and its input is put back there; past the middle the lower thumb is painted on top, so where they meet the one that can move is reachable. Each thumb is named by the field's label (or `label`) and "Minimum" or "Maximum" (new messages); both are described by the hint and error.
5. **The value's place:** `AveFieldContext.showValue(text)` puts it at the end of the `<ave-form-field>`'s label row, hidden from screen readers, which hear `aria-valuetext`; without a field, the slider writes it above its track.
6. **The focus ring** on an input with `data-focus-ring="thumb"` moves to its thumb (`focus.css`, one rule per vendor), so a range shows which end moves.
7. **Forms:** as ADR 0046. `AveControlOwner` gains `controlDisabled`, the component's own disabled state, which `aveControlTarget` gives the field, so the label dims for every composite control disabled by its input, not only by a form.

## Alternatives considered

- **A drawn slider (`role="slider"` on a div, keys in code):** hand-written keyboard behaviour where the native input gives it.
- **`min` and `max` inputs:** NG8022 next to `[formField]`, and a range's would have to be ranges.
- **The ring around the whole input:** on a range it does not say which thumb has focus.
- **A tooltip over the thumb, or a number field beside it:** the product owner chose the label row.

## Consequences

- No marks, no vertical slider, no editable value in this version; a click on a range's track moves no thumb.
- The kit's ring rule now has a thumb variant; the Global styles page shows it and checks that the input draws none.
- Firefox and WebKit were checked for the ring by screenshot; the visual suite covers Chromium only.
