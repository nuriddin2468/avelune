# 0067. Drawer: the kit's dialog against an edge, and a token that turns its slide into a fade under reduced motion

- Status: Accepted (2026-09-28; the reduced-motion token decided by the agent, which the product owner delegated for Wave 3)
- Date: 2026-09-28
- Related: 0005, 0016, 0031, 0066; brief §6.2, §6.3, §6.5; GUIDELINES.md "Dialog, drawer or page"

## Context

Brief §6.3: a drawer slides 100% from its edge, `slow` in and `normal` out. Brief §6.5: under reduced motion distances are 0 and fades stay, from token overrides only. ADR 0031 deferred the drawer's reduced-motion slide to this wave: no token can turn a percentage into 0, and a new token needs an ADR (ADR 0005). The ROADMAP left the choice to the product owner, who delegated every Wave 3 decision to the agent (2026-09-28). Facts, verified on 2026-09-28 (Chromium 153):

- `translate` takes `calc(100% * n)`; with `n` 0 the element does not move, and `getComputedStyle` reads it as `0%`.
- ADR 0031 rejected `min(100%, distance × N)` as obscure.
- The kit's dialog (ADR 0066) already is a modal native `<dialog>` that draws its own backdrop and holds a panel.

## Decision

1. **`AveDrawer`** on `dialog[aveDrawer]` in `@avelune/ui/dialog`: `heading`, `open` model, `side` (`end` by default, the inline end, or `start`) and `size` (`sm` 320, `md` 480 by default, `lg` 640 at most, the viewport's width on a phone). It shares `aveModal()`, the announcer, `aveOverflows()`, the close button and `aveDialogActions` with the dialog, and `dialog.css` with a drawer's overrides: the panel against its edge, the full height, its two inner corners `radius.lg`, its inner edge `border.subtle`. `dialog` in `kitElements` gains `aveDrawer`.
2. **A new motion token, `motion.travel.edge`** (a number): 1, and 0 under reduced motion; "the share of its own size an element slides in from a screen edge".
3. **Catalog entry:** `ave-motion-drawer-enter` and `-exit` in `motion.css`, on the new keyframes `ave-motion-slide-in` and `-out`: `translate: calc(100% × travel)` (negative from the start, `data-side`) and `opacity: travel`. So the panel slides in opaque, and under reduced motion it neither moves nor starts opaque: it fades in place. `duration.slow` with `easing.enter` in, `duration.normal` with `easing.exit` out; the backdrop fades as the dialog's. The Foundations "Motion catalog" page plays and checks it in both modes.

## Alternatives considered

- **`min(100%, motion.distance.lg × 9999)`:** no new token, but a trick nobody would read (ADR 0031).
- **No motion under reduced motion:** the panel would appear at once; brief §6.5 keeps fades.
- **A drawer on CDK's overlay:** see ADR 0066 for the dialog; the drawer is the same element.

## Consequences

- The motion token set grows by one number, which `tokens-check` and the reduced-motion file cover; brief §6.2's durations and easings are unchanged.
- A later element that slides in from an edge (a mobile navigation sheet) takes the same classes.
