# 0024. Stylelint: token-only values, same-element nesting, logical exceptions derived from browser data

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0004, 0005, 0009, 0014, 0017, 0023; brief §5.3

## Context

Brief §5.3 lists what Stylelint must enforce. ADR 0005 left one question open: does CSS nesting survive Angular's emulated encapsulation? ADR 0009 left another: should `width` and `height` be flagged? Facts, verified on 2026-09-24:

- **The shim does not scope nesting.** Angular 22.1.7's shim (`encapsulateStyle`) scopes only the outer selector of a nested rule. `.card { .title {} }` becomes `.card[_ngcontent-c] { .title {} }`, so `.title` also matches inside child components. `:host(…) &` turns into an invalid selector.
- **It works today only by accident.** The application build currently flattens nesting before the shim runs, because the Chrome 119 floor lacks relaxed nesting. A floor at Chrome 120 or later would stop that.
- **Some logical properties are missing at the floor.** `overflow-inline` and `overflow-block` need Chrome 135 and Safari 26; `overscroll-behavior-inline` needs Chrome 144 (MDN browser-compat-data 8.1.2). The same goes for the logical values of `caption-side`, `offset-anchor` and `offset-position`.
- **Standard rules miss two cases.** Stylelint's `selector-nested-pattern` skips a rule whose parent is an at-rule inside a rule (`.card { @media (…) { .title {} } }`). `stylelint-declaration-strict-value` ignores every function, so `calc(100% - 13px)` passes it.

## Decision

1. **Presets:** `stylelint-config-standard` 40, `stylelint-declaration-strict-value`, `stylelint-value-no-unknown-custom-properties` (reading `packages/tokens/dist/tokens.css`) and `stylelint-plugin-logical-css`, whose rule names are re-verified (ADR 0009). Every rule is an error. Disable comments need a description; needless or invalid disables are errors.
2. **Only tokens carry values:**
   - `color-no-hex`, `color-named: never`, and a `function-disallowed-list` for every colour constructor, `color-mix()` and every easing function.
   - `unit-disallowed-list` for every length and time unit that a token carries (`px`, `rem`, `em`, `ch`, `ms`, `s`, …). This also covers `calc()`. `%`, `fr`, `deg` and logical viewport and container units stay allowed.
   - Strict values, as the brief lists them, for colours, `fill`, `stroke`, fonts, `line-height`, radii, `box-shadow`, `z-index`, motion longhands, margins, paddings and gaps. The allowed keywords are `0`, `auto`, `none`, `inherit`, `initial`, `unset`, `revert`, `transparent`, `currentColor`, plus the CSS system colours for forced-colors styles.
3. **Motion:**
   - The `transition` and `animation` shorthands are banned, so each longhand is checked.
   - `transition-property: all` is banned.
   - `@keyframes` is allowed only in `packages/ui/styles/motion.css`.
4. **Selectors:**
   - No `!important`, no ids, and specificity at most `0,4,0`: a host with variant, size and state attributes plus one pseudo-class.
   - No `::ng-deep`, `/deep/` or `>>>`.
5. **Nesting refines the same element only.** This is the fixture result for ADR 0005. `avelune/nesting-same-element` allows a nested rule anywhere under a rule only as `&` followed by pseudo-classes, pseudo-elements or attribute selectors (`&:hover`, `&[aria-disabled='true']`, `&::before`). Everything else is written flat. `encapsulation.spec.ts` pins the shim's behaviour: if Angular starts scoping nested selectors, it fails, and this rule can be relaxed.
6. **Logical properties everywhere**, `width` and `height` included (use `inline-size` and `block-size`), with one exception. A physical property or keyword is allowed only where its logical form falls short of the physical one at the browser floor. The two ignore lists are not remembered: `logical.spec.ts` derives them from the plugin's own suggestions, MDN browser-compat-data and `.browserslistrc`, and fails when the config differs. When the floor rises, the test fails, and the ignore list shrinks.
7. **Queries use tokens** (ADR 0017). `avelune/media-query-tokens` accepts a width in a `@media` query only if it equals a breakpoint token, and a width or inline size in a `@container` query only if it equals a container token. The values are read from the built `tokens.css`. Range notation is required (`stylelint-config-standard`).
8. **Layers** (ADR 0004): `avelune/component-layer` requires every rule of a `packages/ui/<entry>/**/*.css` file to sit inside `@layer components`. The global stylesheets in `packages/ui/styles` declare their own layers.
9. **All CSS is in `.css` files.** ESLint bans `styles` in `@Component` (ADR 0023), so no stylesheet escapes Stylelint. The Foundations pages moved theirs into files. The generated `fonts.css` is ignored, because `fonts:check` verifies it.
10. **Proof:** `lint-rules:test` covers:
    - unit tests for the three `avelune` rules;
    - 34 fixtures linted through the real `stylelint.config.mjs` as the path on their `Lint as:` line, each producing exactly the rules on its `Expect:` line;
    - the derived logical exceptions;
    - the shim characterisation.

## Alternatives considered

- **Allow nesting because the build flattens it:** true for Chrome 119 only, and Storybook's Vite pipeline is not guaranteed to flatten. Rejected.
- **Ban nesting entirely:** `&:hover` and `&[aria-…]` stay scoped and keep state styles next to their element. Rejected.
- **A hand-kept ignore list for logical properties:** it goes stale silently when the floor moves. Rejected.

## Consequences

- Kit CSS reads as tokens only. A missing token shows up as a lint error, not as a raw value.
- A new floor, a new Angular or a new plugin version can fail `lint-rules:test` until the lists or the rule are updated, which is the intent.
