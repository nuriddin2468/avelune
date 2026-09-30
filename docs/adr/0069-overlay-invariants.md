# 0069. Overlay invariants: one control per kind, opened as a person does, and CDK kept from closing on Escape

- Status: Accepted (2026-09-29; decided by the agent, which the product owner delegated for Wave 3)
- Date: 2026-09-29
- Related: 0027, 0031, 0046, 0066, 0068; brief §8.2

## Context

Brief §8.2: all overlays share elevation, radius, enter and exit animation, Escape to close, outside click to close and focus return to the trigger; after `animate.leave` the element is gone from the DOM. The invariants suite (ADR 0027) left the overlays to Wave 3. Facts, verified on 2026-09-29 (CDK 22.2.0, Chromium 153, the showcase at 1280 and 390 px):

- Every control of the kit that opens an overlay carries `aria-haspopup`: the select family, the date fields, Menu, Popover, and the showcase's export button (`dialog`). A combobox's input opens on ArrowDown, not on a click.
- CDK's connected overlay detaches itself on Escape unless `disableClose` is set: an overlay whose component does not stop the key (the date fields) vanished at once, without its exit. The select family and Menu stop it in Angular Aria, so theirs played.
- The popups share `radius.lg` and `elevation.popover`; the modal dialogs `radius.lg` and `elevation.dialog`. Tooltips (`radius.md`) and toasts open from no control and are covered by their unit tests.

## Decision

1. **`src/overlay-probe.ts`** opens the overlay of the first visible, enabled control of each kind on every screen (the kit component around the `aria-haspopup` element and its popup type), by a click, or ArrowDown on an input, once the screen has stopped loading (`aria-busy`). It finds the overlay (the topmost `:modal` dialog, else the last `:popover-open` that is not a tooltip or the toast region) and its surface (the first element that casts a shadow). It records the surface's radius and shadow, the catalog keyframes `recordMotion` saw (`ave-motion-*-in`, `-out`), closes it with Escape (focus back on the control? the surface out of the DOM, or the dialog not displayed?) and opens it again to close it with a press on a point outside it that reaches nothing interactive (a dialog's backdrop).
2. **`src/overlays.ts`** judges the probes: each family's radius and shadow equal the first of the family on any screen; an enter, and after Escape an exit, of the catalog; focus returned; removed; closed by the outside press. Violations are reported per screen. The fixture site of `tools/test-check` proves the test fails on a popup with square corners, no catalog motion and deaf to Escape, and passes the index's.
3. **`aveConnectedOverlay` sets `disableClose: true`**: CDK never closes a kit overlay itself; every component already closes its own on Escape through `aveOverlayPresence`, so the date fields now play their exit too.

## Alternatives considered

- **A list of overlays per screen in the suite:** it would miss a new one; the probe finds them as axe finds elements.
- **Every control of a kind** (the six row menus of the contracts): the same component, six times the emulated time.
- **Menu items that open dialogs (the drawer, the confirmation):** opening them would change the showcase's data on the way; they are the dialog's `aveModal`, which the dialog's probe and the unit tests cover.

## Consequences

- A kit overlay that opens from a control without `aria-haspopup` is not probed; the kit's controls all carry it, and the showcase's own dialog buttons must.
- The test takes the longest of the suite (two openings per kind per screen); its timeout is 5 minutes.

## Addendum: the largest corner (2026-09-29)

Wave 4 opens a drawer from a control for the first time: the showcase's navigation, from the start edge on a phone (ADR 0072). A drawer rounds only its corners away from its edge (ADR 0067), so the probe's top-left corner read 0px for a drawer from the start and would have called it square. The probe now records the largest of the four corners: a surface with square corners still reads 0px, and one with another radius still differs.

## Addendum: a script's focus target is not interactive (2026-09-30)

Wave 6's first run of the invariants failed two overlays at 390 px: the page size's list on `/contracts` and the multiselect's list on `/contracts/new`, each "does not close on a press outside it". The probe had found no point to press. Since the application shell (ADR 0092), every screen is inside `main`, which has `tabindex="-1"` so the skip link can focus it. The probe counted any `[tabindex]` as interactive, so on a phone every point outside a list scrolled to the page's end was skipped.

- Decision: `outsidePoint` counts `[tabindex]` only when it is not `-1`. A script's focus target activates nothing when pressed, and a person's press on it closes an overlay like any press on the page. Links, buttons, fields, labels, any `[role]` and a keyboard-focusable scroller still count.
- Checked on the host first: at the point the probe now finds (the pagination's text on `/contracts`, the form's bar on `/contracts/new`), a real press closes both lists.
