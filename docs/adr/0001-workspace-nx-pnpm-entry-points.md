# 0001. Workspace: Nx, pnpm, secondary entry points

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0012, [compatibility.md](../compatibility.md)

## Context

Avelune ships several packages (tokens, ui, icons, lint configs), two apps (Storybook, showcase) and internal tools. Consumers must be able to import one component without paying for the rest, and the dependency direction `tokens → foundations → components → composites → patterns` must be enforced by a machine. The versions are Angular 22.1, TypeScript 6.0 and Nx 23.2.1, which supports Angular ~22.1.

## Decision

- **Nx 23.2.1 monorepo with pnpm** (ADR 0012). Nx provides task caching, affected-only CI and `@nx/enforce-module-boundaries`.
- **Layout:** `packages/{tokens,ui,icons,eslint-config,stylelint-config}`, `apps/{storybook,showcase}`, `tools/{tokens-check,lint-rules,invariants,adoption-metrics}`, as in brief §3.
- **`@avelune/ui` is one ng-packagr library with one secondary entry point per component** (`@avelune/ui/button`). Each entry point has a `testing` entry point for its harness (`@avelune/ui/button/testing`) and `packages/ui/styles` is exported as `@avelune/ui/styles.css`.
- **Project-level layering:** Nx tags `layer:tokens`, `layer:foundations`, `layer:components`, `layer:composites`, `layer:patterns`, `type:app`, `type:tool`, `type:config`, enforced by `@nx/enforce-module-boundaries`.
- **Entry-point layering inside `@avelune/ui`:** Nx boundaries work per project, not per entry point, so each entry point declares its layer in `packages/ui/<name>/entry.json` (`{ "layer": "components" }`). A custom ESLint rule in `tools/lint-rules` (`avelune/entry-point-layers`) rejects imports that point upward or skip into internals (`@avelune/ui/*/src/**`). Entry points import each other only through their public specifier, which ng-packagr also requires.
- **TypeScript ~6.0.3** everywhere (Angular's supported range is `>=6.0 <6.1`).
- `ng add` / `ng update` schematics live in `packages/ui/schematics` from day one.

## Alternatives considered

- **Plain Angular CLI workspace:** no module-boundary enforcement, no affected graph and no task cache. Rejected.
- **One npm package per component:** maximal isolation, but N versions to align and peer-dependency drift in consumers. Rejected. Secondary entry points give the same tree-shaking with one version.
- **Single entry point:** simpler, but it weakens tree-shaking and makes boundaries invisible. Rejected.
- **One Nx project per entry point (nested `project.json`):** would let Nx enforce entry-point layering directly, but it conflicts with ng-packagr building the library as one unit and multiplies project config. Rejected in favour of the manifest + custom rule.

## Consequences

- Adding a component means adding an entry point folder with `index.ts`, `entry.json` and `testing/`. The how-to is in ARCHITECTURE.md.
- The custom rule is itself a guardrail and ships with failing fixtures (brief §5).
- The Nx graph is the source of truth for CI `affected` runs.
