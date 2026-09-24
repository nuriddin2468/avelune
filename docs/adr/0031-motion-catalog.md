# 0031. Motion catalog: motion.css classes, reduced motion from tokens, linear only on loops

- Status: Accepted (2026-09-24, technical decision within Phase 4)
- Date: 2026-09-24
- Related: 0005, 0016, 0027, 0030; brief §6.3–6.5, §8.2

## Context

Brief §6.3 lists the motion of every element. §6.4 puts all `@keyframes` in `motion.css` as `ave-motion-*` classes for `animate.enter` and `animate.leave`. §6.5 makes reduced motion a matter of token overrides only. Facts, verified on 2026-09-24 (Angular 22.1.7, Chromium in Vitest and in the pinned image):

- `[animate.enter]` and `[animate.leave]` take class expressions. Angular removes the enter class when the animation ends, and removes a leaving element only after its animation.
- Keyframes may read custom properties, and each element resolves them.
- A zero-length animation is not listed by `getAnimations()`. Storybook pauses animations only after the `play` function.
- Gaps between the brief's catalog and its frozen token set:
  1. The skeleton shimmer and the spinner run `linear`, but no easing token is linear, and the invariants suite accepts easing tokens only.
  2. No token makes the skeleton static under reduced motion.
  3. The drawer slides 100% of its size. No existing token can turn a percentage into 0 under reduced motion.
  4. A list item "expands", which is a height animation. §6.4 allows that for the accordion alone.
  5. A shared-element view transition moves and scales, even under reduced motion.

## Decision

1. **`packages/ui/styles/motion.css`** sits in the `utilities` layer (ADR 0030), above the components, so an entering or leaving class wins. Its keyframes:
   - `fade-in`, `fade-out`;
   - `pop-in`, `pop-out`, from and to `motion.scale.enter`;
   - `shift-in`, `shift-out`, offset by `--ave-motion-from-x` and `--ave-motion-from-y`. The classes set these from a distance token, or 0. They are private to this file; Stylelint rejects them anywhere else as unknown properties;
   - `shimmer` and `spin`.
2. **Classes:**

   | Class pair | Keyframes | Duration, easing (in / out) |
   |---|---|---|
   | `ave-motion-popover-enter`, `-exit` (menus, select popups, popovers) | pop-in / fade-out | normal, enter / fast, exit |
   | `ave-motion-tooltip-enter`, `-exit` | shift-in by `distance.sm` away from the anchor (`data-side`: top by default, bottom, start, end) / fade-out | fast, enter / fast, exit |
   | `ave-motion-dialog-enter`, `-exit` | pop-in / pop-out | slow, enter / normal, exit |
   | `ave-motion-backdrop-enter`, `-exit` | fade-in / fade-out | slow, enter / normal, exit |
   | `ave-motion-toast-enter`, `-exit` | shift-in and shift-out by `distance.lg` from the edge (bottom by default, `data-side='top'`) | normal, spring / fast, exit |

   Every exit class fills forwards, so nothing flashes back between the end of the animation and the element's removal. The loops are `ave-motion-shimmer` (`timing.shimmer-period`) and `ave-motion-spin` (`timing.spin-period`). `::view-transition-old(root)` and `::view-transition-new(root)` take `duration.slow` and `easing.standard`.
3. **`linear` is allowed on loops only.** A loop runs at a constant rate, so `linear` is not a curve that a token should hold. Stylelint accepts it in `motion.css` alone. The invariants suite accepts it only on an animation that repeats forever and fails it on one that ends.
4. **Reduced motion** keeps the existing overrides (distances 0, scale 1, slow and slower 150ms, no stagger) and adds one: `timing.shimmer-period` becomes 0ms, so the skeleton is a static fill. The spinner keeps turning: rotation is not movement (ADR 0027).
5. **Deferred to the component that needs it**, each with its own decision:
   - the drawer's reduced-motion slide (Wave 3; a new token would need the product owner, ADR 0005);
   - the list item's expand and collapse (Wave 5);
   - shared-element view transitions (Wave 6);
   - whether top-layer overlays use these classes or `@starting-style` transitions (the Dialog ADR in Wave 3).
   State changes (hover, accordion, tabs indicator, switch thumb) stay transitions in component CSS, on tokens.
6. **Proof:**
   - The Foundations page "Motion catalog". Its `play` function hides and shows every entry. For each class it checks the keyframes, the duration and easing tokens, the pose away from rest, and that `animate.leave` removed the element. It then checks the loops and the route cross-fade. It does all of this in the current mode and again under `data-motion="reduced"`. Two deliberate breaks, a wrong duration and an offset that is no token, both failed it.
   - Fixtures: `linear` in a component stylesheet fails Stylelint. The invariants fixture site fails a `linear` animation that ends and passes a `linear` loop.

## Alternatives considered

- **An `easing.linear` token:** the brief froze the easing set; a constant rate is the absence of a curve.
- **One keyframes rule per direction and distance:** a dozen near-copies instead of two custom properties.
- **A pulsing skeleton under reduced motion:** the brief asks for a static fill.
- **A drawer slide of `min(100%, distance × N)`,** which collapses under reduced motion: it works, but it is obscure. Decide it with the drawer.

## Consequences

- A component gets its enter and leave motion only from these classes; it cannot declare keyframes (Stylelint).
- A new catalog entry is a class here, a row on the "Motion catalog" page and its check in the `play` function.
