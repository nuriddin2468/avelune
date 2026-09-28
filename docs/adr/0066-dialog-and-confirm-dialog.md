# 0066. Dialog and ConfirmDialog: a native modal dialog that is its own backdrop, the catalog's classes, an announcer inside

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0002, 0005, 0031, 0046, 0047, 0050, 0063; brief §5.2, §6.3, §6.4, §8.2; GUIDELINES.md "Dialog, drawer or page"

## Context

ADR 0031 left open whether top-layer overlays use the catalog's classes or `@starting-style` transitions. Facts, verified on 2026-09-28 (Angular 22.2.0, CDK 22.2.0, Chromium 153, MDN browser-compat-data 8.1.2):

- `showModal()` puts a `<dialog>` in the top layer, makes everything outside it inert, focuses its first focusable element, fires `cancel` on Escape and returns focus to the element focused before; a `close` event follows `close()` in a later task. `closedby` (light dismiss) needs Chrome 134, after the floor.
- `::backdrop` inherits custom properties from its element only from Chrome 122, after the floor (119): a tokenised scrim there would be transparent in Chrome 119 to 121.
- An exit held by the kit (classes, then `close()`) plays in every browser at the floor; `@starting-style` with `overlay` cuts the exit short in Firefox (ADR 0005).
- Inert content is hidden from assistive technology, CDK's `LiveAnnouncer` element in `<body>` included: a file upload in a modal dialog announced nothing. `LiveAnnouncer` takes its element from `LIVE_ANNOUNCER_ELEMENT_TOKEN`.
- A story's keys are synthetic and never reach the browser's Escape.
- angular-eslint forbids `autofocus` in templates.

## Decision

1. **`@avelune/ui/dialog`** (layer composites): `AveDialog` on `dialog[aveDialog]` (`heading`, `open` model, `size` `sm` 480, `md` 640 by default, `lg` 960 at most), `AveDialogActions` (`[aveDialogActions]`, a component whose host is the row of actions), and `AveConfirmDialog` on `dialog[aveConfirmDialog]` (`heading`, `action`, `cancel`, `variant` `danger` by default or `primary`, `open`, output `confirm`). The native `<dialog>` stays the element; `dialog` joins `kitElements` with both.
2. **The dialog is its own backdrop:** shown, it is fixed over the viewport in `color.bg.backdrop` with the panel centred in one grid cell (so the panel's height is capped); `::backdrop` is transparent. A click that starts and ends on the element outside the panel closes it. In forced colours the element keeps its scrim (`forced-color-adjust: none`) and the panel takes the system colours.
3. **Behaviour, shared by `aveModal()`:** `open` true calls `showModal()`; false puts the exit classes on and calls `close()` once their animations end; `cancel` is prevented and closes the same way; a `close` from the browser sets `open` false, and one that arrives after the dialog opened again is ignored. While open, `data-ave-scroll-lock` makes `base.css` stop the page scrolling, keeping its scrollbar gutter when it had one.
4. **Motion:** the catalog's classes, not `@starting-style`: `ave-motion-backdrop-enter` and `-exit` on the element, `ave-motion-dialog-enter` and `-exit` on the panel.
5. **Focus:** the browser's. The close button comes last in the DOM, after the actions, and is drawn at the top, so focus starts in the content; a body that scrolls takes `tabindex="0"` while it overflows (`aveOverflows`), so it can be scrolled from the keyboard. A confirmation's first control is Cancel.
6. **Announcer:** each dialog provides a `LiveAnnouncer` whose live element is inside it; controls inside inject that one.
7. **Look:** the panel is the raised surface with `elevation.dialog`, `radius.lg` and a `border.subtle` edge; heading `font.heading-lg`, 24px of padding; the actions under a subtle rule; a confirmation's two buttons share its last row and wrap to a row each. The close button is a ghost `sm` IconButton with `aveTooltip`, named by the `close` message; Cancel's default words are the new `cancel` message.
8. **Harnesses:** `AveDialogHarness` and `AveConfirmDialogHarness` (`@avelune/ui/dialog/testing`); their `pressEscape()` sends the browser's `cancel`.

## Alternatives considered

- **CDK's Dialog:** no top layer and no inert page (it relies on `aria-modal` and a focus trap), and its service would open dialogs away from the template that owns their state.
- **A tokenised `::backdrop`:** transparent below Chrome 122.
- **`autofocus` on Cancel:** forbidden by the lint rules; DOM order gives the same result.

## Consequences

- The Drawer (ADR 0067) and the Toast (ADR 0068) build on `aveModal` and on the announcer; a toast shown while a modal is open is inert.
- Stories close dialogs with their buttons; unit tests press the real Escape through the browser.
