# 0061. Alert and Banner: a tinted notice in place and a strip across the page, one set of icons and roles

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0011, 0033, 0038, 0047; brief §7.3, §8.1; GUIDELINES.md "Toast, inline alert or banner"

## Context

GUIDELINES.md sends a notice about one part of the screen to an inline alert and a state of the whole product or page to a banner. Facts, verified on 2026-09-28 (Chromium 153, WAI-ARIA 1.2):

- `role="alert"` is an assertive live region and `role="status"` a polite one; either is announced when it appears or changes, not when the page loads with it.
- The four status roles have a subtle fill each. Text in `fg.default` and `fg.muted` on them is declared at 4.5:1 (ADR 0011). Links (`fg.link`) reach 5.4 to 6.0:1 on them and the focus ring 5.4 to 6.0:1, neither declared yet.
- Forced colours drop background colours; a transparent border is painted in the text colour there.
- The kit has no word for a message's kind; its icons would otherwise be unnamed.

## Decision

1. **`@avelune/ui/alert`** (layer components) holds `AveAlert` (`<ave-alert>`) and `AveBanner` (`<ave-banner>`), with `AveAlertVariant`: `info` by default, `success`, `warning`, `danger`.
2. **One set of icons and roles:** `info`, `circle-check`, `triangle-alert`, `circle-alert` (Lucide, 20px, in the variant's `fg`), each named by a new message in the four locales (`alertInfo`, `alertSuccess`, `alertWarning`, `alertDanger`); `warning` and `danger` are an `alert`, the rest a `status`.
3. **Alert:** the variant's `bg-subtle`, `radius.lg`, 12px and 16px of padding, the icon level with the first line and 12px from the text; an optional `heading` (label type) over the projected message.
4. **Banner:** the same fill across its container, no radius, rows of `control.height.sm`, so it is 40px with or without its close button; `dismissible` adds a ghost `sm` IconButton named by the new `close` message, which emits `dismiss`; the page removes the banner.
5. **Contrast:** two new declared pairs, links and the focus ring on every subtle fill. **Forced colours:** a transparent border (the banner's bottom edge) becomes the outline.
6. **Harnesses:** `AveAlertHarness` and `AveBannerHarness` in `@avelune/ui/alert/testing`.

## Alternatives considered

- **A coloured border or a bar at the start:** a second colour cue for the same meaning, and a decoration the fill already carries.
- **`role` chosen by the application:** most would forget it; the variant already says whether it interrupts.
- **A banner that hides itself:** the page could not remember the choice or bring it back.
- **Input for the action:** the message is content; a link or a small button inside it composes.

## Consequences

- The toast (ADR to come) reuses the icons and their names.
- After a banner is closed, focus falls to the document, and the next Tab continues from where the banner was (the browser's focus navigation starting point); the docs page says so. No library behaviour moves it, and the kit adds none.
