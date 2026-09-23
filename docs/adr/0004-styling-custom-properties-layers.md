# 0004. Styling: custom properties, cascade layers, emulated encapsulation

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0003, 0009

## Context

Components must look identical in every consumer, but consumers must still be able to lay them out, without anyone reaching into component internals. Our browser floor (ADR 0005) supports cascade layers, container queries, CSS nesting and logical properties natively.

## Decision

- **Plain CSS, no Sass.** Native nesting is allowed. Angular's esbuild pipeline lowers it for the configured browserslist where needed.
- **Layer order is declared once** in `@avelune/ui/styles.css`: `@layer reset, tokens, base, components, patterns, utilities, app;`. Every component stylesheet wraps its rules in `@layer components`, and consumer styles belong in `app`.
- **Emulated view encapsulation** (Angular's default). There is no `ShadowDom` (it would break global focus, typography and layer ordering) and no `None` (it leaks).
- **No `::ng-deep`, `/deep/` or `>>>`, no `!important`, no id selectors, and a specificity cap.** These are enforced by Stylelint (brief §5.3).
- **State lives in attributes:** `data-variant`, `data-size`, `data-state` and ARIA states are set via the `host` object. CSS targets those attributes and `:focus-visible`, never classes toggled from TypeScript.
- **Logical properties only** (ADR 0009). Container queries apply where a component adapts to its container.
- **Values come only from `--ave-*` semantic and component tokens** (ADR 0003).

## Alternatives considered

- **Sass:** unnecessary with native nesting and custom properties, and it encourages build-time values that bypass tokens. Rejected.
- **Tailwind / utility-first:** conflicts with the no-raw-values rule and moves styling decisions into consumer templates. Rejected.
- **ShadowDom encapsulation:** strongest isolation, but breaks inherited typography, global focus rules and layer ordering across shadow roots. Rejected.

## Consequences

- **Unlayered consumer CSS beats all layered CSS.** During migration, legacy global styles can override the kit. The migration guide (Phase 6) tells consumers to wrap legacy CSS in `@layer app` or a lower layer, and `tools/adoption-metrics` reports unlayered global rules.
- Emulated encapsulation adds one attribute selector to each rule. The Stylelint specificity cap is set with that in mind.
