# 0045. Switch: a drawn native checkbox with the switch role, a thumb that slides on its own timing

- Status: Accepted (2026-09-25; the size chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0005, 0016, 0031, 0041, 0044; brief §6.2, §6.3, §6.5, §9.1

## Context

A switch turns a setting on or off at once; a checkbox is a choice that takes effect when a form is sent (GUIDELINES.md). Facts, verified on 2026-09-25 (Angular 22.2.0, Chromium 153):

- WAI-ARIA's switch pattern allows a native checkbox with `role="switch"`: browsers expose its checked state as on or off, Space toggles it, and both form APIs bind it as a checkbox.
- The product owner chose (2026-09-25) a 40 × 24 track with a 16px thumb 4px from its edge. The thumb travels 16px.
- The motion catalog (brief §6.3) gives the thumb a translate on `duration.fast` with `easing.spring`. Brief §6.5 says nothing moves under reduced motion, through token overrides only; no duration is 0 there, and the durations are frozen (ADR 0005).
- `stylelint-declaration-strict-value` accepts one value per motion longhand, not a list.

## Decision

1. **`AveSwitch`** (`@avelune/ui/switch`, layer components) on `input[type=checkbox][aveSwitch]` with `role="switch"`, empty template, `injectControlState()` and `connectToField()`. Its label is `label[aveChoice]` from `@avelune/ui/checkbox`, the switch first.
2. **Look**, from tokens: the track `size.icon.sm` × 2.5 by `size.target.min`, `radius.full`, a `border.strong` border on `bg.surface`, `bg.hover` on hover; the thumb `size.icon.sm`, `space.1` from the outer edge, in `border.strong`. On: the `accent.bg` fill (`-hover` on hover) and the thumb in `fg.on-accent`. Invalid: `danger.border`. Disabled: `bg.disabled`, the thumb in `fg.disabled`. Forced colours: system colours only, as the checkbox. The track reaches 2px above and below its label's 20px line, into the label's padding, so the label stays 24px tall.
3. **Motion:** only the thumb's `translate` transitions, on the new token **`timing.slide`**: 120ms (the value of `duration.fast`), 0ms under reduced motion, where the thumb jumps. Its colour changes at once. The tabs indicator (Wave 4) uses the same token. The thumb slides only once the person has toggled that switch: its `change` handler writes `data-toggled` at once, not through change detection. The showcase showed why (2026-09-25): in a zoneless application Signal Forms writes `checked` a frame after the first render, and every switch that starts on slid into place as the page opened.
4. **Harness:** `AveSwitchHarness` in `@avelune/ui/switch/testing`: label, on, disabled, invalid, toggle, turn on, turn off.
5. `input` with `aveSwitch` joins `kitElements`.

## Alternatives considered

- **`duration.fast` for the thumb:** the thumb would still slide 16px under reduced motion, against brief §6.5.
- **A `motion.distance` token for the travel:** 0 under reduced motion would leave the thumb where it started, showing the wrong state.
- **A `<button role="switch" aria-checked>`:** no native form binding, and hand-rolled state.

## Consequences

- `timing` holds one more token; `tokens-check` and the reduced-motion file cover it. A later part that slides to show a state takes `timing.slide`, never a duration.
- The thumb moves left to right; an RTL locale would need a flipped translate (out of scope, ROADMAP.md).
