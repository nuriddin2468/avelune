# 0068. Toast: a service, a popover region that moves into an open modal dialog, a queue of three, F8

- Status: Accepted (2026-09-29; decided by the agent, which the product owner delegated for Wave 3)
- Date: 2026-09-29
- Related: 0005, 0031, 0046, 0061, 0063, 0066; brief §6.2, §6.3, §7.3, §9.3; GUIDELINES.md "Toast, inline alert or banner"

## Context

Brief §9.1 asks for toasts with a queue, a pause on hover and focus, and a live region; §6.3 gives the motion, which ADR 0031 put in the catalog (`ave-motion-toast-*`). Facts, verified on 2026-09-29 (Angular 22.2.0, CDK 22.2.0, Chromium 153):

- A popover shown after a modal `<dialog>`, outside it, is drawn above it but is inert: its buttons cannot take focus. Inside the dialog it is usable. Moving a popover in the DOM hides it; it must be shown again. A popover inside a dialog that closes is not displayed.
- Inert content is hidden from assistive technology: CDK's live element in `<body>` says nothing while a modal is open (ADR 0066).
- `animate.enter` removes its class once the animation ends, so a re-inserted toast does not play its entry again. With the region destroyed by the application's `DestroyRef`, switching stories logs nothing (no NG0205, unlike content inside a CDK overlay, ADR 0046).
- No WAI-ARIA APG pattern covers toasts; APG's Alert has no keyboard interaction. Radix's toast moves focus to its viewport on F8; no CDK, Aria or native feature does this.
- WCAG 2.2.1 asks that a time limit can be paused or extended.

## Decision

1. **`@avelune/ui/toast`** (layer composites): `AveToaster`, a root service; `show(message | { message, variant?, action? })` returns an `AveToastRef` with `dismiss()`. Variants are those of Alert (`info` by default), with its icons and names, which `@avelune/ui/alert` now exports (`aveStatusIcon`, `-Icons`, `-Label`, `-Role`). One action at most (`{ label, run }`); choosing it runs it and closes the toast. On the server `show()` does nothing.
2. **The region** is a component the service creates at the first toast, attached to the application and appended to `<body>`: `popover="manual"`, a landmark `region` named "Notifications (F8)" in the locale, a list of toasts. At the bottom of the viewport, across its width on a phone (16px from the edges), at the inline end from `breakpoint.sm` (24px), as wide as its widest toast between `container.xs` and `container.sm`. It leaves the top layer once its last toast has played its exit.
3. **Over a modal dialog:** while toasts show, a `MutationObserver` follows the `open` attribute of every `<dialog>`; the region moves into the topmost `:modal` one and back to `<body>` when that closes or is removed, and shows again wherever it lands.
4. **Announcements** through a `LiveAnnouncer` whose live element is inside the region (`aveHostAnnouncer`, which moves from the dialog entry to `@avelune/ui/overlay`): information and success politely, warnings and errors assertively, the action's words after the message. The toasts themselves are not live regions, so nothing is read twice.
5. **Timing:** a new token, `timing.toast`, 6000ms, the same under reduced motion. The clocks of all toasts stop while the pointer or focus is on the region or the page is hidden, and resume with what was left. Three show at once; the others queue in order.
6. **Keyboard:** F8 moves focus to the region while toasts show; Escape inside it returns focus to where it came from, and is kept from a dialog around it. When the focused toast closes, focus goes to the region while others show, else back.
7. **A toast** is the raised surface of every popup (ADR 0046) with `radius.lg` and the popover elevation: the icon, the message, the action (`aveButton` small, secondary) wrapping under a long message, and a close button with a tooltip, in rows of the small control height: 48px tall, 44px compact. `animate.enter` / `animate.leave` with the catalog's toast classes; the harness skips a toast that plays its exit.

## Alternatives considered

- **CDK's global overlay:** its container in `<body>` is inert under a native modal dialog, as a popover is; moving it would fight CDK.
- **`role="status"` on each toast:** a live region inserted with its content is often not announced, and a toast in an inert region never is.
- **Toasts with an action stay until closed:** a stack that never clears; the pause and F8 meet WCAG 2.2.1 instead.
- **A hotkey of the application's choosing:** a configuration for one key; F8 is Radix's and free in browsers.

## Consequences

- The overlay entry gains `aveHostAnnouncer`; the dialog's announcer ids become `ave-announcer-*`.
- Toasts appear above what was open when the region was shown; a popover opened later over the corner covers them until the region is shown anew.
- When a toast leaves, the others close up at once; the catalog has no collapse.
- The Foundations motion page already plays the toast entry; the unit tests cover the queue, the pause, F8, Escape and the move into a dialog.
