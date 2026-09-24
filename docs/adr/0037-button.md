# 0037. Button: a native button or link, four variants, disabled that can stay focusable, a delayed spinner

- Status: Accepted (2026-09-24; the secondary look chosen by the product owner, the rest a technical decision within Wave 1)
- Date: 2026-09-24
- Related: 0002, 0004, 0020, 0030, 0031, 0036; brief §4.2, §6.3, §8.2, §9.1

## Context

Brief §9.1 asks for `button[aveButton]` and `a[aveButton]` with variant, size and state only; loading keeps the size and sets `aria-busy`; a disabled control that explains itself uses `aria-disabled` so it stays focusable. §6.3 shows a spinner only after 300ms of waiting and keeps it at least 500ms. §8.2 requires same-size controls to share height, radius, border width, font size and horizontal padding. Facts, verified on 2026-09-24 (Angular 22.1.7, Chromium 153):

- `aria-disabled` does not stop activation: a click, Enter on a button, or the implicit submission of a form (a synthetic click on its default button) still reaches the element's `click` listeners.
- Angular creates a component before the listeners of its element: the constructor runs in `elementStart`, the template's `(click)` and every host listener are registered after it. A listener added in the constructor runs first, and `stopImmediatePropagation()` stops the rest. In Chromium a capture listener on the target also runs before the target's other listeners; MDN browser-compat-data does not track that ordering for other engines.
- A host `[attr.disabled]` binding that evaluates to `null` removes a static `disabled` attribute the template wrote.
- `visibility: hidden` removes text from the accessibility tree; `opacity: 0` keeps it.
- The token set has `color.bg.hover` and `color.bg.active` as translucent state layers, declared in `contrast-pairs.json` over the surfaces (ADR 0016).
- The product owner chose the secondary look: a surface with a 1px border, as Yaru draws it, rather than libadwaita's grey fill (2026-09-24). The border is `border.default`: a button is identified by its label, so its boundary needs no 3:1 (WCAG 1.4.11). An input's does, so inputs take `border.strong`; same width, radius and height, a darker tone (product owner, 2026-09-24).

## Decision

1. **`AveButton`** (`@avelune/ui/button`, layer components) is a component on `button[aveButton]` and `a[aveButton]`. The element stays the native one: its role, keyboard and form behaviour are the browser's (a button activates on Enter and Space, a link on Enter).
2. **Inputs:** `variant` (`primary`, `secondary` by default, `ghost`, `danger`), `size` (`sm`, `md` by default, `lg`), `disabled`, `disabledInteractive` and `loading`. State is reflected in `data-variant`, `data-size`, `disabled`, `aria-disabled` and `aria-busy`, which the CSS reads.
3. **Disabled:**
   - `disabled` alone: a button gets the native `disabled` attribute (not focusable); a link gets `aria-disabled="true"` and `tabindex="-1"`.
   - `disabled` with `disabledInteractive`: both keep focus and get `aria-disabled="true"`, so a person can reach the button and read why it is unavailable.
   - The component owns `aria-disabled`; applications set these inputs instead of the attribute.
   - Activation is blocked by one click listener on the host, added in the constructor and in the capture phase. While the button is `aria-disabled` or busy it calls `preventDefault()` (no submit, no navigation) and `stopImmediatePropagation()` (no `(click)` handler).
4. **Loading:** `loading` sets `aria-busy="true"` and blocks activation at once; the button keeps its focus and its accessible name. The spinner (Lucide `loader-circle` in `<ave-icon>`, turning with `ave-motion-spin`) appears after `timing.spinner-delay` and, once shown, stays at least `timing.spinner-min-visible`; the button stays busy while it shows. The content fades to `opacity: 0` under the spinner, in the same grid cell, so nothing moves. Both timings are read from the computed tokens when loading starts, so a theme or mode that overrides them is followed. On the server nothing is scheduled. The timer moves to the Spinner component in Wave 3.
5. **Look**, from tokens only:
   - Every variant has the same box: `control.height.*` as the minimum block size, `control.padding-inline.*`, a `border-width.default` border (transparent where it is not drawn), `radius.md`, `font.label-md` at every size. Same-size controls therefore match (§8.2).
   - `primary`: `accent.bg` fill with `fg.on-accent`; `-hover` and `-active` fills. `danger`: the same with the danger roles. `secondary`: `bg.surface` with `border.default` and `fg.default`. `ghost`: no fill and no border.
   - Hover and press on `secondary` and `ghost` are the `bg.hover` and `bg.active` state layers, drawn by a `::before` under the content. Colour changes use `duration.instant` and `easing.standard` (catalog: hover colour).
   - Disabled: `bg.disabled` and `fg.disabled`, without the variant's colour; `ghost` stays unfilled.
   - Text wraps and the button grows; it never truncates. An icon and the text are 8px apart (`space.2`).
   - On a coarse pointer, an `::after` extends the hit area to `size.target.coarse` without changing the drawing.
6. **Icons** are projected: `<ave-icon name="…" decorative />` before or after the text. An icon-only button is IconButton.
7. **Harness** `AveButtonHarness` (`@avelune/ui/button/testing`). The unit tests use it.
8. **Consumers:** `button` and `a` with `aveButton` join `kitElements`, so `avelune/no-raw-elements` accepts them.

## Alternatives considered

- **A grey filled secondary (libadwaita):** the product owner chose the bordered one. It also needs no new tokens.
- **`border.strong` on secondary too, to match inputs exactly:** heavier buttons, close to primary in weight; the product owner kept the lighter border.
- **Styling `[aria-disabled='true']` written by the application:** `loading` has to set the same attribute, and a host binding would remove the application's value. The component owns the attribute instead.
- **Only native `disabled`:** removes the button from the tab order, so the reason for disabling can never be reached by keyboard.
- **The spinner delay in CSS (`transition-delay`):** covers the 300ms show delay, but not the 500ms minimum, which depends on when the spinner appeared.
- **The timings from `@avelune/tokens` in TypeScript:** the `tokens` object is not tree-shakable, so the button would bundle every token, and it would not follow a mode that overrides a timing.
- **`visibility: hidden` on the content while loading:** the button would lose its accessible name.

## Consequences

- `button[aveButton]` and `a[aveButton]` are the only buttons applications write; raw `<button>` fails `avelune/no-raw-elements`.
- Stories and unit tests cover every variant × size × state, loading timing with fake timers, blocked activation (click, Enter, form submit, link navigation), and the equal box of every variant.
- A later control of the same size (Input, IconButton) must keep the same box; the showcase invariant checks it.
