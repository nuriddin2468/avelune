# 0058. Spinner: the delayed spinner as a component, a named progress bar that keeps its box

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0031, 0036, 0037, 0047, 0056; brief §6.3, §7.3

## Context

Brief §6.3 shows a spinner only after 300ms of waiting and keeps it at least 500ms. Button (ADR 0037) and the select family's lists (ADR 0056) already draw one: Lucide's `loader-circle` turning with `ave-motion-spin`, timed by `aveDelayedSpinner` in `@avelune/ui/theme`. ADR 0037 planned to move that timer "to the Spinner component in Wave 3"; ADR 0056 moved it to `theme` instead, so both could share it. Applications also wait outside buttons and lists: a panel that loads, a search. Facts, verified on 2026-09-28 (Angular 22.2.0, Chromium 153):

- ARIA gives an indeterminate wait the `progressbar` role without `aria-valuenow`; it needs a name (axe `aria-progressbar-name`).
- A spinner that is added only once its delay has passed moves the words next to it, unless its box is there before.

## Decision

1. **`AveSpinner`** (`@avelune/ui/spinner`, layer components), `<ave-spinner>`: `loading` (default `true`), `size` (`sm` 16, `md` 20 by default, `lg` 24, the icon sizes) and `label`. The timer stays `aveDelayedSpinner`; Button and the lists keep their own icon, since their spinner sits in their own box and must stay nameless.
2. **Look:** the host is an icon box of its size, always; the icon appears in it once the delay has passed, in `currentColor`, turning with `ave-motion-spin`.
3. **Accessibility:** while shown, `role="progressbar"` and `aria-label`: `label`, or the kit's `loading` message ("Loading…") in the application's locale (ADR 0047). Before and after, `aria-hidden="true"` and no role. The region that loads carries `aria-busy`; the docs page says so.
4. **Harness:** `AveSpinnerHarness` (`@avelune/ui/spinner/testing`): shown, label, size.

## Alternatives considered

- **`role="status"` with hidden text:** announced once when it appears, but a `status` says nothing about the kind of thing it is; screen readers name a `progressbar` as one, and the busy region carries the rest.
- **Adding the host only after the delay** (`@if` inside the application): the words next to it jump.
- **A CSS `animation-delay` for the 300ms:** covers the show delay, not the 500ms minimum (ADR 0037).

## Consequences

- "Loading" looks the same in a button, a list and a panel. The ROADMAP's note that the timer moves to the Spinner is settled by this ADR: it stays in `theme`.
- Stories wait for the spinner to show; the visual suite stops the infinite spin at its first frame.
