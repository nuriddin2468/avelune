# 0076. Menubar: Angular Aria's menubar, menus as data, each menu moved into its overlay while it is open

- Status: Accepted (2026-09-29, technical decision within Wave 4)
- Date: 2026-09-29
- Related: 0002, 0046, 0064, 0069, 0075; brief §6.3, §8.2, §9.1, §9.4; WAI-ARIA APG "Menubar"

## Context

Brief §9.1 names Angular Aria's `MenuBar` for the menubar (ADR 0002, decision 2). Facts, verified on 2026-09-29 (Angular Aria 22.2.0, CDK 22.2.0, Chromium 153):

- A top item of `ngMenuBar` is an `ngMenuItem` whose `submenu` is an `ngMenu` instance. Opening it (a click, Enter, Space, Down, Up) focuses the submenu's first or last item at once, and an item without a submenu is taken for a command: the submenu must exist before the item opens.
- Aria's menubar guide therefore renders every menu once the bar first takes focus, and hides the closed ones with CSS. The overlay invariants (ADR 0069, brief §8.2) require a closed popup's surface to leave the DOM, as every other kit popup's does.
- CDK's `DomPortal` moves an existing element into an overlay and back to where it was; an element whose parent has left the document leaves with it. A programmatic overlay (`createOverlayRef`) with `withPopoverLocation('inline')` puts its popover right after its origin, so a submenu stays inside the menubar's element and the menubar's `focusout` does not close it.
- An element that enters the DOM starts its CSS animation again: the catalog's popover enter plays each time a menu moves into its overlay.
- axe accepts an `aria-controls` whose element is absent while `aria-expanded` is `false`.

## Decision

1. **`AveMenubar<V>`** (`<ave-menubar>`) joins `@avelune/ui/menu`, whose items, popup and styles it shares with the menu button (`panel.css`): `label` (required, names the bar), `menus` (required), `AveMenubarMenu<V>`s (`label`, `items`: the Menu's `AveMenuEntry<V>`s), and the output `itemSelected: V`.
2. **Behaviour:** Aria's `ngMenuBar` of top items and one `ngMenu` per menu, with its keyboard: the arrows between the top items, a menu opened by Down, Up, Enter or Space, open menus following the arrows and the pointer, Escape back to the top item, letters to an item.
3. **Menus exist before they open and leave the DOM when they close:** the menus are drawn in a holder that leaves the document after the first render; opening a menu moves its element into a CDK overlay at its top item (a `DomPortal`), and once its exit has played it goes back into the holder, out of the page. A press outside the bar and the open menu closes it.
4. **Motion:** the catalog's popover classes, `ave-motion-popover-enter` as the menu enters its overlay, `-exit` while it leaves; under reduced motion it fades.
5. **Look:** the bar's items as ghost buttons of `control.height.md` in `font.label-md`, the hover fill, and the pressed fill while their menu is open; the menus are the Menu's popup (ADR 0064), opening under their item from its start, or ending at its end without room.
6. **Harness:** `AveMenubarHarness` (`@avelune/ui/menu/testing`): the bar's name, its menus, opening one, its items, choosing an item.

## Alternatives considered

- **Aria's guide as it is (every menu rendered, the closed ones hidden):** a closed menu would stay in the DOM, against brief §8.2 and the overlay probe.
- **Rendering a menu only while it is open:** its top item would not know it has a menu, and would be chosen as a command.
- **A row of the kit's menu buttons:** the arrows would not move between them, and an open menu would not follow them; the APG's menubar needs Aria's.
- **Submenus:** Aria has them; no screen of the kit needs a second level, as for the Menu (ADR 0064).

## Consequences

- The showcase's template editor (`/templates`) has a menubar over a toolbar and the template's text.
- The overlay probe opens a menubar's first menu on every screen that has one; the bar's items carry `aria-haspopup`.
