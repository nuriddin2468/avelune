# 0038. IconButton: a square Button with a required label, in the button entry point

- Status: Accepted (2026-09-24, technical decision within Wave 1)
- Date: 2026-09-24
- Related: 0033, 0036, 0037; brief §4.2, §8.2, §9.1

## Context

An action shown by an icon alone needs an accessible name the icon cannot give (brief §9.1: "IconButton: label required"). Everything else about it is a Button's: variants, sizes, disabled, `disabledInteractive`, loading, the blocked activation (ADR 0037). Facts, verified on 2026-09-24 (Angular 22.1.7):

- A component that extends another inherits its inputs, its host bindings and its constructor; it declares its own selector, template, styles and providers. `styleUrls` may list several files.
- A host directive's inputs are not the component's own. `ɵcmp` then references the directive's class, so it would have to be exported, and Storybook's props table does not list host-directive inputs.
- Content projection is the brief's rule for icons *next to* a label. Here the icon is the whole content, and its size must follow the button's.

## Decision

1. **`AveIconButton`** is in `@avelune/ui/button` (layer components), on `button[aveIconButton]` and `a[aveIconButton]`. It extends `AveButton`, so it has the same inputs, states and click guard, and adds:
   - `icon` (required, `AveIconName`): the icon, which the application registers with `provideAveIcons`;
   - `label` (required): the accessible name (`aria-label`). In development an empty label throws.
2. **The icon is drawn by the component**, decorative, at `sm` (16px) in `sm` and `md` buttons and `md` (20px) in `lg` buttons. The spinner takes the same size.
3. **Look:** `button.css` plus `icon-button.css`. The box is square: the inline size equals the control height of the size, with no inline padding. Height, radius, border and every colour and state are the Button's, so an IconButton sits in a row of buttons and inputs of its size (brief §8.2; padding does not apply to a square).
4. **Harness:** `AveIconButtonHarness` in `@avelune/ui/button/testing`, with the Button harness's methods plus `getLabel()` and `getIcon()`.
5. `aveIconButton` joins `kitElements` for `button`.
6. **The template rule knows it.** `@angular-eslint/template/elements-content` requires content in every `<button>` and `<a>`, or one of its attributes (`aria-label`, `title`, …); it does not know the `label` input. It also accepts `aveIconButton` (`allowList` in `eslint.config.mjs`), and nothing else: an empty `<button aveButton>` still fails. Two workspace fixtures in `tools/lint-rules` prove both.

## Alternatives considered

- **A separate entry point with a shared host directive:** the directive would become public API, and the docs' props table would lose every input.
- **A projected `<ave-icon>` inside `button[aveIconButton]`:** the size and `decorative` would be the application's to get right in every use; the component knows both.
- **`aria-label` written by the application:** nothing would require it. A required input fails the build instead.

## Consequences

- `@avelune/ui/button` exports both components; tree-shaking drops the one an application does not use.
- A tooltip that shows the label on hover and focus comes with the Tooltip (Wave 3); until then the label is for assistive technology only, so the docs ask for well-known icons.
