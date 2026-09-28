# 0060. Skeleton: lines and blocks on a placeholder colour of their own, the catalog's shimmer

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0011, 0016, 0031, 0058, 0059; brief §6.3, §6.5, §7.3

## Context

Brief §7.3 asks for skeletons for content and spinners for actions; §6.3 gives the skeleton a linear shimmer of 1.2 to 1.5s, and §6.5 replaces it with a static fill under reduced motion. ADR 0031 made both: `ave-motion-shimmer` translates an element from -100% to 100% over `timing.shimmer-period` (1.4s), and the period is 0 under reduced motion. Facts, verified on 2026-09-28 (Chromium 153):

- An animation of duration 0 ends at once, however often it repeats, and leaves the element at its own position.
- In dark, `bg.surface-sunken` equals the canvas (ROADMAP.md): a skeleton in it would vanish on the canvas. `bg.track` (ADR 0059) means the empty part of a bar.
- A skeleton says nothing to assistive technology; the region that loads does (`aria-busy`, a status line).

## Decision

1. **`AveSkeleton`** (`@avelune/ui/skeleton`, layer components), `<ave-skeleton>`: `shape` (`text` by default, or `block`) and `lines` (1 by default). Text draws one bar per line of body text, 12px in a 20px line, `radius.sm`, the last of several 60% wide. A block fills its box, `radius.md`, as tall as a medium control unless the page sizes the element.
2. **Two new colour tokens:** `color.bg.placeholder` (neutral 200 in light, 800 in dark) and `color.bg.placeholder-highlight` (neutral 50 and 700), lighter than the fill in both themes. Decorative, so no contrast pair. The Foundations colour page shows both.
3. **Motion:** each part holds a band, a gradient from transparent to the highlight and back, that rests at `translate: -100%`, out of sight; `ave-motion-shimmer` sweeps it across. Under reduced motion the animation ends at once and the band stays hidden: the fill is still, from the tokens alone.
4. **Accessibility:** `aria-hidden="true"` on the host; the docs page puts `aria-busy` and a status on the region.
5. **Forced colours:** fills are dropped, so each part takes an outline in `CanvasText` and the band is not drawn.
6. **Harness:** `AveSkeletonHarness` (`@avelune/ui/skeleton/testing`): shape, parts, hidden.

## Alternatives considered

- **A circle shape for avatars:** Avatar and its sizes arrive in Wave 5; the shape comes with them.
- **`bg.surface-sunken` or `bg.active` for the fill:** invisible on the dark canvas, or translucent and different on each surface.
- **A `width` or `height` input:** an appearance input (brief §9.1); the page sizes a block with its own layout CSS, as it sizes any element.

## Consequences

- Two more semantic colours; `tokens-check` covers their parity.
- A page's loading state is drawn with the kit's parts, and stands still under reduced motion without code.
