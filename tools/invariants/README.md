# invariants

Axe and the cross-component invariants of brief §8.2 on every showcase screen, in the pinned container (ADR 0027).

`pnpm nx run invariants:e2e` builds the showcase on the host and runs `playwright.config.ts` in the image through `tools/visual/src/container.ts`. The suite finds the screens by following links from `/`, then checks each one in light and dark at 1280 and 390 px:

- axe finds no violation (every default rule, `region` included);
- no horizontal scroll at 320 px;
- every animation's duration and easing equal a motion token (`src/motion.ts` records every animation on every frame; the easings compare in the browser's serialisation, so `linear()` stops match);
- under reduced motion nothing translates or scales;
- controls of one size share height, radius, border width and font size, and those with a text label the inline padding (`src/controls.ts`; icon buttons are squares);
- every overlay a control opens (one control per kind: the kit component around an `aria-haspopup` control, and its popup type) shares the radius and the elevation of its family, the popups or the modal dialogs, across screens; plays an enter and an exit of the motion catalog; closes on Escape, giving focus back to its control, and on a press outside; and is gone from the DOM once closed, a modal dialog no longer displayed (`src/overlay-probe.ts` opens them, `src/overlays.ts` judges; ADR 0069).

`pnpm nx run invariants:test` unit-tests the motion, control and overlay checks; `tools/test-check` proves that the suite fails on each violation (`pnpm nx run test-check:e2e`).
