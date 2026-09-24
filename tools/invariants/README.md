# invariants

Axe and the cross-component invariants of brief §8.2 on every showcase screen, in the pinned container (ADR 0027).

`pnpm nx run invariants:e2e` builds the showcase on the host and runs `playwright.config.ts` in the image through `tools/visual/src/container.ts`. The suite finds the screens by following links from `/`, then checks each one in light and dark at 1280 and 390 px:

- axe finds no violation (every default rule, `region` included);
- no horizontal scroll at 320 px;
- every animation's duration and easing equal a motion token (`src/motion.ts` records every animation on every frame; the easings compare in the browser's serialisation, so `linear()` stops match);
- under reduced motion nothing translates or scales.

The invariants that need components (same-size controls, overlays, `animate.leave` removal) are added with those components in Phase 5. `pnpm nx run invariants:test` unit-tests the motion checks; `tools/test-check` proves that the suite fails on each violation (`pnpm nx run test-check:e2e`).
