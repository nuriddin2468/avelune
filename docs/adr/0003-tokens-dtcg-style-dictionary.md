# 0003. Tokens: DTCG 2025.10, Style Dictionary 5, three tiers

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0004, 0011

## Context

Consistency across products requires one source of truth for every visual value. DTCG 2025.10 is the stable token format. Style Dictionary (SD) 5.5.5 supports its colour objects (`colorSpace`, `components`, `alpha`, `hex`; since 5.3) and dimension objects (`{ value, unit }`; since 5.4). Per the SD docs, 2025.10 support is still "work in progress": duration and gradient are unfinished (issue #1590), and there is no resolver module.

## Decision

- **Sources** are DTCG 2025.10 JSON in `packages/tokens/src/`: `primitives.tokens.json`, `semantic.light.tokens.json`, `semantic.dark.tokens.json`, `density.compact.tokens.json`, `motion.tokens.json`, `component.tokens.json`.
- **Tiers:** primitive (named by value, `color.orange.500`), semantic (named by purpose, `color.bg.surface`) and component (only where a component must be themable, for example density). References go strictly component → semantic → primitive. Skipping a tier is a build error.
- **Naming:** `{category}.{concept}.{role}.{variant}.{state}`. A semantic name containing a colour name or a raw number is an error; the one exception is the spacing scale (`space.4`).
- **Build:** SD 5.5.5 with custom transforms where SD's DTCG support is incomplete (duration objects → `ms`). The outputs are:
  - `dist/tokens.css`: semantic + component tokens only, with the theme, density and motion selectors listed in brief §4.3
  - `dist/tokens.ts`: typed values and a `TokenName` union
- **Primitives are never emitted.** The SD filter excludes them, and `tools/tokens-check` asserts that no primitive name appears in `dist/tokens.css`.
- **CSS variable prefix `--ave-`**, for example `--ave-color-bg-surface`. This prevents collisions with legacy consumer CSS during migration.
- **`tools/tokens-check`** validates everything itself rather than trusting SD: DTCG schema, unresolved references, naming, tier direction, declared contrast pairs in both themes (ADR 0011), and light/dark parity. Contrast pairs are declared in `packages/tokens/contrast-pairs.json`, never inferred.

## Alternatives considered

- **Tokens Studio format + `@tokens-studio/sd-transforms`:** adds a proprietary dialect when the DTCG standard is now stable. Rejected. There is no Figma source (`DESIGN_SOURCE: none`).
- **Hand-written CSS variables:** no tier checks, no typed names, no contrast gate. Rejected.
- **Terrazzo** (an alternative DTCG compiler): viable, but the brief mandates SD 5 and SD's plugin surface covers our needs.

## Consequences

- Components can reference only semantic and component variables. Stylelint's unknown-custom-property check reads `dist/tokens.css`, so a primitive or a typo fails lint.
- When SD completes 2025.10 duration support, the custom transform is removed. A test pins its output, so the swap is verified.

## Addendum (Phase 2, 2026-09-23)

Colour primitives are generated into `src/primitives.color.tokens.json` by the colour script (ADR 0011, addendum) and never edited by hand; `src/primitives.tokens.json` holds the hand-written primitives. ADR 0016 adds `semantic.tokens.json` (theme-independent semantic tokens) and `motion.reduced.tokens.json`, and states which values may be literals.
