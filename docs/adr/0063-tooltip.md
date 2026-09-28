# 0063. Tooltip: a directive on any element, a CDK overlay in the top layer, CDK's describer, dark tooltip colours

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0002, 0011, 0031, 0046, 0058; brief §6.3, §8.2, §9.1; WCAG 1.4.13

## Context

Brief §6.3: a tooltip fades in and moves `distance.sm` away from its anchor after about 500ms, and fades out without delay. WCAG 1.4.13 asks content on hover or focus to be dismissible (without moving the pointer or focus), hoverable and persistent. Facts, verified on 2026-09-28 (Angular 22.2.0, CDK 22.2.0, Chromium 153):

- Neither Angular Aria nor CDK has a tooltip. CDK has the pieces: a connected overlay (`createOverlayRef`, `createFlexibleConnectedPositionStrategy`, a popover in the top layer inserted after its origin, `inline`), `AriaDescriber` (a hidden message referenced by `aria-describedby`, skipped when the text equals the element's `aria-label`) and a reposition scroll strategy that detaches the overlay when the element scrolls away.
- `animate.enter` in a CDK overlay throws NG0205 at teardown (ADR 0046); the catalog's classes put on by the component do not.
- An attribute bound with `[aveTooltip]` is not in the DOM, so a harness cannot find the element by it.
- Storybook's Vite pre-bundled `@angular/cdk/overlay` and `@angular/cdk/portal` in separate passes, each with its own copy of the portal classes, and the overlay rejected a `ComponentPortal` ("unknown Portal type"). An application's bundle has one copy.
- No colour role suits a tooltip: on a raised surface it would read as a small popover.

## Decision

1. **`AveTooltip`** (`@avelune/ui/tooltip`, layer components), a directive on `[aveTooltip]`: `aveTooltip` (the text; empty shows nothing) and `aveTooltipSide` (`top` by default, `bottom`, `start`, `end`).
2. **Behaviour** (hand-written on CDK's parts, since no library behaviour covers it): a mouse or pen resting on the element for `timing.tooltip-delay` shows it, keyboard focus (`:focus-visible`) at once, and so does any request within that delay after another tooltip hid. A touch never shows one. It hides at once on leaving both the element and the tooltip, on focus leaving, on a press, and on Escape, caught on the document in the capture phase and stopped, so it does not also close a dialog. The panel's host is a transparent frame whose padding is the gap, so the pointer can cross onto the text. A pending task keeps the application unstable while a tooltip is about to show or leave, so tests and harnesses wait for it.
3. **Overlay:** the positions tried are the side centred, then aligned with the element's start or end, then the opposite side the same way; pushed 8px (`space.2`, read from the element) inside the viewport as a last resort. The side reached is `data-side`.
4. **Motion:** the panel carries `ave-motion-tooltip-enter`, and `-exit` while it leaves; the overlay detaches once the exit's animations finish.
5. **Accessibility:** `AriaDescriber` describes the element with the text, unless the text is its name; the bubble is `aria-hidden`.
6. **Look:** new tokens `color.bg.tooltip` (neutral 800 in light, 700 in dark, lighter than every dark surface) and `color.fg.on-tooltip` (white, neutral 50), declared at 4.5:1 (10:1 and 7.3:1). `font.body-sm`, `radius.md`, `elevation.popover`, 8px from the element (its focus ring reaches 4px), at most `container.xs` wide; forced colours paint a transparent border.
7. **Harness:** `AveTooltipHarness` on `[data-ave-tooltip]`; the panel carries `data-ave-tooltip-of`.
8. **Storybook** pre-bundles `@angular/cdk/overlay` and `@angular/cdk/portal` together (`viteFinal` in `main.ts`).

## Alternatives considered

- **The Popover API with `popover="hint"`:** after the browser floor, and no positioning without anchor positioning.
- **A `role="tooltip"` element referenced while shown:** a screen reader reads a description when focus arrives, before the delay has passed.
- **Built into IconButton:** every focused icon button in the Wave 1 stories would show a tooltip, changing beta baselines; applications add `aveTooltip` with the label instead, and the docs say so.

## Consequences

- Menu and Popover give their icon-only triggers a tooltip of their label.
- The overlay invariant (brief §8.2) covers tooltips separately: `radius.md`, not a container's `radius.lg`.
