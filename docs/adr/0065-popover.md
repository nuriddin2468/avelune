# 0065. Popover: a non-modal dialog under its own button, focus in and back, closed by Escape, a press or focus leaving

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0002, 0046, 0063, 0064; brief §6.3, §8.2; ROADMAP.md tracked risk "iOS Safari 17–18.2 implements popover without light dismiss"

## Context

Wave 3 lists a Popover: content next to a control, used now and then, that does not block the page. Facts, verified on 2026-09-28 (CDK 22.2.0, Chromium 153):

- WAI-ARIA has no popover pattern; a panel with controls is a non-modal `dialog`. Neither Aria nor CDK has the component. CDK's connected overlay (`usePopover: 'inline'`) puts the panel in the top layer, right after its button in the DOM and so in the focus order, and reports a press outside it (`overlayOutsideClick`), on iOS too. CDK's `FocusTrapFactory` finds `cdkFocusInitial` or the first tabbable element without trapping.
- A panel pressed against the viewport's edge (a button at the end of a phone's row) drew its focus ring off screen until CDK's `push` and `viewportMargin` were set.
- Menu (ADR 0064) draws its own trigger; a popover opened from an application's button would read differently.

## Decision

1. **`AvePopover`** (`@avelune/ui/popover`, layer composites), `<ave-popover>`: `label` (required), `heading`, `open` (a model), `icon`, `variant`, `size`, `disabled`; the content is projected into the panel.
2. **Trigger:** as Menu's, a Button with a `chevron-down` or an IconButton with `aveTooltip` of its label, with `aria-haspopup="dialog"`, `aria-expanded` and, while open, `aria-controls`.
3. **Panel:** `role="dialog"`, not modal, named by the heading or the button, `tabindex="-1"`; the popup of ADR 0046 with 16px of padding, at least 256px and at most `container.sm` wide, within the viewport less 16px each side.
4. **Behaviour:** opening moves focus to `cdkFocusInitial` or the first tabbable element, or to the panel; Escape closes it (its default and propagation stopped, so a dialog around it stays) and closing with focus inside returns focus to the button; a press outside and focus leaving past it close it where the person went; a press on its own button toggles it. No focus trap.
5. **Overlay:** `aveConnectedOverlay` with `align: 'either'`, which now also pushes the panel inside the viewport, `space.2` from its edge, when neither edge fits (Menu gets the same). The catalog's popover classes through `aveOverlayPresence`.
6. **Harness:** `AvePopoverHarness` (`@avelune/ui/popover/testing`): label, open, close, disabled, heading, text, and a loader for the panel's content.

## Alternatives considered

- **The Popover API with `popover="auto"`:** light dismiss without positioning, and no light dismiss on iOS 17 to 18.2 (ROADMAP.md).
- **A focus trap:** the panel is non-modal; trapping would make it a dialog without a backdrop.
- **Staying open when focus leaves:** a panel left behind after Tab would cover the next control.

## Consequences

- The overlay invariants (brief §8.2) cover the popover: its radius and elevation, Escape, a press outside and focus return.
- A panel's state (checked filters) lives in the application's content, so it survives closing.
