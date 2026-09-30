# 0097. FormPage: the application's form with its heading, and its actions in a bar that sticks to the window's bottom

- Status: Accepted (2026-09-30; the sticky actions are the product owner's, "Wave 6 looks" in ROADMAP.md; the rest is the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0037, 0040, 0066, 0091; brief §9.4; WCAG 2.2 SC 2.4.11

## Context

- The product owner chose (2026-09-30): the actions under the form, in a bar that sticks to the bottom of the window while the form is longer than it.
- The showcase's new contract is a raised card at most `container.lg` wide. Its heading and "* — обязательные поля" sit over two columns of fields, the groups of choices and a footer of actions, with the draft's action at the start, Cancel and the primary at the end, and a status under them. On a phone the buttons stack at full width.
- The form is the application's `<form>`: its submit handler, `novalidate` and Signal Forms' `submit()`. A submit button must be inside it. The kit enhances native elements with attribute selectors (non-negotiable 6).
- A bar that sticks to the bottom can cover the field that has focus near the window's edge. WCAG 2.4.11 fails only when the focused element is entirely hidden. The browser scrolls a focused element above the document's `scroll-padding`, which only a global rule can set, as `base.css` already locks the page's scroll for a modal dialog (ADR 0066).

## Decision

1. **`form[aveFormPage]` in `@avelune/ui/form-page`** (layer `patterns`), a component on the application's `<form>`:
   - It draws the page's `h1` (`heading`, `font.heading-xl`) and `description` muted under it ("* — обязательные поля"). The form is a landmark named by its heading.
   - The application's content follows, 24px apart. The form is at most `container.lg` wide, at the page's start, and an inline-size container for the application's own columns.
2. **`[aveFormPageActions]`** is the bar, the form's last part. It sticks to the window's bottom (`position: sticky`, `z-index.sticky`) while the form reaches past it, and rests under the content otherwise.
   - It sits on `bg.surface` over a `border.subtle` line, 12px of padding in the block axis, and 16px beyond the content at each side, so its buttons line up with the fields.
   - Its items stand at the inline end, 8px apart, the primary last. `[aveFormPageActionsStart]` goes at its start, for a secondary action such as "Сохранить черновик" and the form's status. The row wraps on a narrow page.
   - The bar sets `data-ave-form-actions`. `base.css` gives the document a `scroll-padding-block-end` as tall as the bar's one row, so a field focused near the window's edge scrolls above it.
3. **Checks:** `AveFormPageHarness`, unit tests in Chromium (the bar stuck to the window's bottom, then at rest after the content), stories (the contract form, a short form, the status, long text), whose play functions also read the document's scroll padding from `base.css`, and the showcase's new contract.

## Alternatives considered

- **`<ave-form-page>` around the form, or containing it:** the form element is the application's, with its handlers. Wrapping it adds an element without a role, and containing it would need the pattern to forward the submit.
- **A raised card for the form, as the showcase drew it:** shadows stay with what floats over the page (ADR 0083). The page is the form's surface, and the bar is what floats.
- **Buttons stacked at full width on a phone:** three stacked buttons in a bar that sticks would cover about 124px of a 640px window. They wrap in rows instead.
- **Scrolling a covered field into view from TypeScript on `focusin`:** the browser's own scroll padding does it for every focus change, from the keyboard and from script alike.

## Consequences

- `base.css` gains one rule, keyed to the bar's attribute, as the dialogs' scroll lock is.
- The showcase's contract form loses its card and its footer's CSS.

## Addendum: the scroll padding follows the bar's height (2026-09-30)

Wave 6's visual review tabbed through the Form page's stories with a real keyboard at 1280, 390 and 320 px, at two window heights and both densities. On a phone the bar's row wraps: the new contract's bar is 105px tall at 390 px and 149px at 320 px (97 and 137 compact). `base.css`'s scroll padding was one row, 61px (57 compact). A field focused near the window's bottom therefore scrolled above one row and stayed under the rest. At 390 × 600 the confirmation checkbox was entirely hidden, and at 320 × 844 so was the counterparty's phone. That fails WCAG 2.4.11.

- Decision: `[aveFormPageActions]` measures its border box (`ResizeObserver`) and sets the document's `scroll-padding-block-end` to its height. It writes the value into `<html>`'s style through the CSSOM, which a strict CSP allows, and removes it when the bar goes. It is a measured length, not an authored style. `base.css`'s one-row rule stays for the first paint and for a server-rendered page, until the bar has measured itself.
- The same walk then left no focused field entirely under the bar in any of the twelve combinations. At 390 × 600 the four-row textarea stays partly under it (69 of 96px): Chromium does not scroll a field that already shows in part. That meets 2.4.11 (AA); only 2.4.12 (AAA) asks for the whole field. The stories' check reads the scroll padding against the bar's own height. The unit test checks one row, a wrapped bar of two rows, and the value gone with the bar.
