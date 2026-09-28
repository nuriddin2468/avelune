# 0059. Progress: a native progress bar with a value, on a new track colour

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0002, 0011, 0016, 0051, 0058; brief §6.4, §9.1

## Context

Wave 3 lists a Progress component. Facts, verified on 2026-09-28 (Angular 22.2.0, Chromium 153, MDN browser-compat-data 8.1.2):

- A native `<progress>` has the `progressbar` role, exposes its value as a percentage, is labelable by `<label for>`, and is styled at the floor through `appearance: none` and its vendor parts: `::-webkit-progress-bar`, `::-webkit-progress-value` and `::-moz-progress-bar`.
- A `<progress>` without a value is indeterminate. A moving stripe for it would need an animation on a vendor part, which cannot take the motion catalog's classes; the catalog has no entry for it; and under reduced motion it would have to stand still, which says nothing. The spinner (ADR 0058) already shows a wait of unknown length.
- The fill must keep 3:1 against the empty track (WCAG 1.4.11). No colour role fits the track: `bg.surface-sunken` is the canvas in dark, and the slider's `border.strong` track (ADR 0051) is as dark as the accent fill, about 1.2:1.

## Decision

1. **`AveProgress`** (`@avelune/ui/progress`, layer components) on `progress[aveProgress]`, empty template. The native `value` and `max` are its value; inputs `variant` (`accent` by default, `success`, `danger`) and `size` (`sm` 4px, `md` 8px by default), reflected in `data-*`.
2. **Determinate only:** without a value the track stays empty; the docs page sends waits of unknown length to the spinner.
3. **A new colour token, `color.bg.track`**: neutral 200 in light, neutral 800 in dark, visible on every surface. The pairs "a progress bar's fill against its track" (accent, success and danger fills, 3:1) join `contrast-pairs.json`: 4.1 to 4.9:1 in light, 4.6 to 5.2:1 in dark. The Foundations colour page shows it.
4. **Look:** full width, `radius.full`, the fill in the variant's solid colour. The fill's width is never transitioned (brief §6.4). Forced colours: an outline in `CanvasText`, the fill `Highlight`.
5. **Labels** are the application's, as for a native input: a label row with the name and the value in words, which the docs page shows. `aveNumberFormat` writes the percentage.
6. **Harness:** `AveProgressHarness` (`@avelune/ui/progress/testing`): label, value, max, percent, variant, size.
7. `progress` joins `kitElements`, with `aveProgress`, so `avelune/no-raw-elements` rejects a raw `<progress>` in consumer templates.

## Alternatives considered

- **A `div` with `role="progressbar"`:** a hand-written copy of the native element's semantics (ADR 0002).
- **An indeterminate stripe:** see above; the spinner covers it.
- **`border.subtle` for the track:** the same colours, but the role says "decorative divider"; the track carries the 100% the fill is read against.

## Consequences

- One more semantic colour; `tokens-check` covers its parity and pairs.
- A consumer's raw `<progress>` becomes a lint error, like a raw `<input>`.
