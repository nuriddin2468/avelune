# 0025. Storybook compiles stories JIT; ngc type-checks them

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: supersedes the "AOT, not JIT" point of ADR 0008's addendum; 0006, 0010

## Context

ADR 0008's addendum set `jit: false` for `@storybook/angular-vite`, so that stories compile ahead of time as the library does. On 2026-09-24 the static build (`nx build storybook`) turned out to render no story, with "JIT compiler unavailable". The build had been broken since Phase 2; only the dev server had been used.

The cause (angular-vite 10.6.0, `@analogjs/vite-plugin-angular` 2.7.2):

- The renderer creates `StorybookWrapperComponent` at runtime, so it needs the JIT compiler and imports `@angular/compiler` for that.
- With `jit: false`, Analog's build optimizer treats `@angular/compiler` as side-effect free (`sideEffects = jit && …`), and the production bundle drops it.
- The dev server doesn't tree-shake, so the defect didn't show there.

The visual, axe and invariant jobs (ADR 0006, 0010) run against the static build, so it has to work.

## Decision

- **Storybook uses the framework's default, `jit: true`.** Stories and the kit components they render are compiled in the browser.
- **Templates stay type-checked:** `storybook:typecheck` runs `ngc --noEmit` with the workspace strictness (`strictTemplates`, extended diagnostics as errors, ADR 0022) on every story. It runs in pre-commit and CI.
- **Component styles go through the same emulated shim** (`@angular/compiler`'s `ShadowCss`), now at runtime. Stylelint's same-element nesting rule (ADR 0024) keeps the output identical to AOT.
- Revisit when angular-vite keeps the compiler in AOT builds (tracked in ROADMAP.md).

## Alternatives considered

- **Keep AOT and register the compiler by hand** (import `publishFacade` and call it from `preview.ts`): this relies on a compiler internal and works around the plugin rather than using it as designed. Rejected.
- **Only use the dev server:** visual tests need a static, reproducible build in Docker. Rejected.

## Consequences

- The static build includes `@angular/compiler` (larger bundle, slightly slower first render). Neither matters for a docs and test build.
- A template error in a story fails `storybook:typecheck`, not the Storybook build.
