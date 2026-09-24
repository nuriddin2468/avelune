# 0015. Repository scripts in TypeScript, run by Node; Node-side tests with `node:test`

- Status: Accepted (2026-09-23, technical decision within Phase 2)
- Date: 2026-09-23
- Related: 0006, 0011, 0012

## Context

Phase 2 adds the first substantial Node-side code: the colour generator (`packages/tokens/scripts`), the Style Dictionary build and `tools/tokens-check`. The brief asks for maximum typing everywhere (§1 rule 5). The Phase 1 scripts are plain `.mjs`.

Node 24.21.0 (the pinned runtime, `.nvmrc`) runs `.ts` files directly: `process.features.typescript` is `'strip'`. Type stripping removes erasable syntax only: no enums, namespaces or parameter properties, and relative imports keep their `.ts` extension. TypeScript 6.0 checks exactly that subset with `erasableSyntaxOnly`, `allowImportingTsExtensions` and `verbatimModuleSyntax`.

Component tests use Vitest in browser mode (ADR 0006), which Phase 3 installs. Scripts and tools run in Node and have no DOM.

## Decision

- **Node-side code is TypeScript**, run with `node file.ts`, with no build step and no loader. Each project with scripts has a `tsconfig.json` with `module: nodenext`, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax` and `types: ["node"]`, and a `typecheck` target running `tsc -p`. Its `package.json` (or the root one) sets `"type": "module"`.
- **`@types/node` follows `engines.node`** (24.x), declared once in the catalog.
- **Node-side tests use `node:test`** and `node:assert/strict`, run by `node --test "<glob>"` in a `test` target. Failing fixtures for guardrails (brief §5) are test cases that assert the rule rejects them.
- Existing `.mjs` scripts stay until they are next changed substantially; new scripts are `.ts`.

## Alternatives considered

- **`.mjs` with JSDoc types:** typed only if checked with `checkJs`, and the annotations are noisier than TypeScript. Rejected.
- **`tsx` or `ts-node`:** a loader dependency to do what Node now does natively. Rejected.
- **Vitest for Node-side tests:** one runner for everything, but it needs Vite and a config for code that has no DOM, and `node --test` starts in milliseconds. Revisit if Node-side tests need snapshots or coverage thresholds that `node:test` handles poorly.

## Consequences

- No emitted JavaScript to keep in sync, and a script's types are checked by the same `typecheck` target that the pre-commit hook runs.
- Syntax outside the erasable subset fails `typecheck` before it can fail at runtime.
- Two test runners exist: Vitest for Angular code, `node:test` for Node code. A project uses one of them, never both.

## Addendum: bundler resolution for tools that import the Angular compiler (Phase 3, 2026-09-24)

`tools/compiler-check` imports `@angular/compiler-cli`, whose declarations use extensionless relative imports that `nodenext` cannot follow. Its tsconfig uses `module: preserve` with `moduleResolution: bundler` instead; everything else in this ADR applies unchanged (ADR 0022).

## Addendum: the schematics of `@avelune/ui` (Phase 3, 2026-09-24)

`packages/ui` uses Vitest for its Angular code (ADR 0026). Its schematics are not Angular code: the Angular CLI runs them in Node from the built package. They are tested with `node:test` (`ui:test-schematics`) against `dist/packages/ui/schematics`, from `packages/ui/schematics/tests/*.spec.mts`, which has its own `tsconfig.json`. The `.mts` extension makes them ES modules in a package without `"type": "module"`. This is the one place where a project uses both runners, each for the code it runs (ADR 0029).
