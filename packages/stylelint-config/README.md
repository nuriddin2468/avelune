# @avelune/stylelint-config

Stylelint rules for applications built on Avelune (ADR 0104). They keep an application's CSS on the kit's tokens; formatting stays the application's choice.

- **Values from tokens:** no hex, named or functional colours, no raw easing, no length or time unit outside a token (`px` stays allowed in `@media` widths); colours, spacing, radii, shadows, z-index, fonts and motion timing take a `var(--ave-*)` or a keyword.
- **Tokens as the kit defines them:** an application never declares an `--ave-*` property (`avelune/no-token-declarations`); a brand colour goes through the brand generator (ADR 0089). Every `var(--ave-*)` names a token of `@avelune/tokens/tokens.css` (`avelune/known-tokens`). The application's own custom properties are free.
- **No escape hatches:** no `!important`, id selectors or `::ng-deep`.
- **Motion and focus are the kit's:** motion longhands only, never `transition-property: all`; no `@keyframes` (use the motion catalog's classes); no `outline` property and no `:focus` (the kit draws one focus ring).
- **Layout:** logical properties and units (the few physical ones the browser floor still needs are allowed); `@media` and `@container` widths equal the kit's breakpoint and container tokens (`avelune/media-query-tokens`); a nested rule refines its parent element only, as Angular's emulated encapsulation requires (`avelune/nesting-same-element`).

Descriptionless, needless and badly scoped disable comments are reported.

## Use

`ng add @avelune/ui` installs it and writes `stylelint.config.mjs` when the workspace has none (ADR 0103). By hand:

```js
// stylelint.config.mjs
export default {
  extends: ['@avelune/stylelint-config'],
  // Code written before the kit warns until it is migrated (ROADMAP, "Adoption plan").
  overrides: [{ files: ['src/app/legacy/**'], defaultSeverity: 'warning' }],
};
```

Peer: `stylelint` 17.

## In this repository

The source is `tools/lint-rules/src/consumers/stylelint-config.ts`. `pnpm nx run stylelint-config:build` bundles it with the rules it imports into `dist/`, and `pnpm nx run stylelint-config:test` lints CSS through the built package. The kit's own `stylelint.config.mjs` shares its rules (`tools/lint-rules/src/stylelint/application-rules.ts`), and the showcase is held to both `--ave-*` rules. `private` is removed at the first publish.
