# 0075. Toolbar: Angular Aria's toolbar on the application's element, its items marked, a menu that joins it

- Status: Accepted (2026-09-29, technical decision within Wave 4)
- Date: 2026-09-29
- Related: 0002, 0037, 0038, 0064; brief §9.1, §9.4; WAI-ARIA APG "Toolbar"

## Context

Brief §9.1 puts toolbar behaviour in Angular Aria. Facts, verified on 2026-09-29 (Angular Aria 22.2.0, Chromium 153):

- Aria's `ngToolbar` is the `toolbar` role with one Tab stop: the arrows, Home and End move between its `ngToolbarWidget`s (roving `tabindex`, wrapping). A widget injects the `Toolbar` directive itself, and is focused by its own element.
- With `softDisabled` (the default) a disabled widget keeps focus and is `aria-disabled`, as the APG allows; a Button that is `disabled` leaves the focus order natively, so the two would disagree; a Button with `disabledInteractive` agrees (ADR 0037).
- Aria's widget has a `disabled` input; a host directive's input may be the host's too, so one `[disabled]` reaches a Button and its widget.
- The Menu draws its own trigger (ADR 0064), so an application cannot put a widget directive on it; the trigger's own template can, where a toolbar is around it.
- The APG names a toolbar when a page has more than one, and separates groups of controls with `separator`s.

## Decision

1. **`@avelune/ui/toolbar`** (layer composites):
   - `AveToolbar` (`[aveToolbar]`, a component on the application's element) carries `ngToolbar` as a host directive, with `label` (required, the toolbar's name), and lays its items in a row that wraps.
   - `AveToolbarItem` (`[aveToolbarItem]`) carries `ngToolbarWidget` with its `disabled` input, on a Button, an IconButton or a link that looks like one.
   - `AveToolbarSeparator` (`[aveToolbarSeparator]`), a vertical `separator` between groups.
2. **Disabled items keep focus** (`softDisabled`): a disabled Button in a toolbar is written with `disabledInteractive`, so it stays focusable like its widget; the docs page says so, and the stories show it.
3. **The Menu joins a toolbar by itself:** `AveMenu` looks for Aria's `Toolbar` around it and, inside one, draws its trigger with `ngToolbarWidget`. Nothing changes outside a toolbar.
4. **Look:** items 4px apart, groups 8px apart around a separator of `border.subtle` as tall as a small control; ghost buttons by custom (GUIDELINES: toolbars are dense places); no surface of its own: the page decides where it stands. A toolbar wider than its container wraps its items onto another row.
5. **Harness:** `AveToolbarHarness` (`@avelune/ui/toolbar/testing`): the name, the items' names, the disabled ones, the one with focus.

## Alternatives considered

- **Items as data, the toolbar drawing the buttons:** a toolbar holds buttons, icon buttons, menus and links with their own states; data would copy each API.
- **An overflow menu for items that do not fit:** it needs measuring and moving items between the row and a menu; wrapping keeps every item where it was declared. Kept for a later RFC if a screen needs it.
- **Hard-disabled items (`softDisabled` false):** Aria marks such widgets `inert` and `disabled`, which would override a Button that asks to stay focusable.
- **Toggle buttons and groups (`ngToolbarWidgetGroup`):** the kit has no toggle button yet; a group of radios in a toolbar waits for it.

## Consequences

- The showcase's contract page gets a toolbar of its actions, its last a menu.
- The Popover's trigger does not join a toolbar yet; a popover in a toolbar would be a separate Tab stop.
