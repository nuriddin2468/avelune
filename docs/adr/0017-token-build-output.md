# 0017. Token build output: px, one CSS file with mode blocks, typed TS

- Status: Accepted (2026-09-23, technical decision within Phase 2); "consumers are not meant to override tokens" replaced for colour by [0089](0089-brand-themes.md)
- Date: 2026-09-23
- Related: 0003, 0004, 0016

## Context

Brief §4.3 fixes what `tokens.css` and `tokens.ts` contain and which selectors carry the themes, density and motion. It leaves open the length unit, how each mode is resolved, and the shape of the TS output. Style Dictionary (SD) 5.5.5 resolves DTCG references, `$type` inheritance and composites correctly, but its CSS formats write one selector per file and its DTCG duration support is unfinished (ADR 0003).

Legacy consumer apps are the migration target (Phase 6). Some set `html { font-size: 62.5% }` or similar; any rem-based kit would shrink inside them.

## Decision

- **Lengths are px**, in the sources and in the output. The kit renders the same in every consumer regardless of its root font size, and computed styles land exactly on the 4px grid that the visual checks measure (brief §8.1). Text scales with browser zoom, which meets WCAG 1.4.4.
- **SD is the resolver.** `scripts/build.ts` runs SD once per mode from `sources.json` (ADR 0016): the base mode, then each override file in place of its base. It takes SD's resolved tokens and emits only those from the mode's own files. Values are converted by `scripts/token-values.ts` (pure functions, every output pinned by a test), not by SD transforms: colour components to hex (eight digits with alpha), px, ms, `cubic-bezier()` or `linear()`, quoted font families, shadow layers, typography.
- **One `dist/tokens.css`**, everything inside `@layer tokens`, in this order: `:root` (light, all tokens); `[data-theme='light']` (light colours again, so a light island inside a dark page works); `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` and `[data-theme='dark']`; `[data-density='compact']`; `@media (prefers-reduced-motion: reduce) { :root }` and `[data-motion='reduced']`. Theme blocks set `color-scheme`. Values are resolved, not `var()` chains.
- **Typography** is emitted as a `font` shorthand (`--ave-font-body-md: 400 14px/20px …`) plus one property per part (`-family`, `-size`, `-weight`, `-line-height` in px, `-letter-spacing`), because `font` does not set letter spacing.
- **`dist/tokens.ts`** exports `tokens`, an `as const` object keyed by token name with `cssVar`, `type`, the typed `value`, the `css` string, and `dark` / `compact` / `reduced` values where a mode overrides the token; `TokenName = keyof typeof tokens`; and `tokenVar(name)`. It is compiled to `tokens.js` and `tokens.d.ts`, the package's main export; `@avelune/tokens/tokens.css` is the stylesheet.

## Alternatives considered

- **rem for type and spacing:** respects a user's default font size, but breaks inside consumers that change the root size, and turns the 4px grid into fractions there. Revisit for citizen-facing products (BASE_TEXT 16/24).
- **SD's `css/variables` format per mode, concatenated:** one file per selector and no control over media wrappers or the light island. Rejected.
- **`var()` references between tiers in the output:** keeps chains live, but consumers are not meant to override tokens, and resolved values are simpler to check. Rejected.
- **A hand-written `.d.ts` next to generated JS:** two outputs to keep in agreement; compiling one generated `.ts` gives both. Rejected.

## Consequences

- `tools/tokens-check` reads `dist/tokens.css` to assert that no primitive is emitted (ADR 0003) and that the dark blocks declare the light names.
- Media and container queries cannot read custom properties; breakpoint values reach them through `tokens.ts` and a lint check (Phase 3).
- SD's future DTCG duration support changes nothing here, since durations are converted by `token-values.ts`; the pinned test keeps it that way.
