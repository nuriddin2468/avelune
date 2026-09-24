# 0026. Unit and story tests: Angular's unit-test builder in Chromium, per-file thresholds, failing fixtures

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0006, 0008, 0013, 0015, 0025; brief §5.4

## Context

ADR 0006 chose Vitest browser mode through `@angular/build:unit-test`, a coverage gate of 90% lines and branches, and Storybook `play` and axe gates. ADR 0013 pins Vitest 4. Vitest 5 stays blocked: `@storybook/addon-vitest` 10.6.0 peers `^3 || ^4` (checked 2026-09-24).

Facts found while wiring the tests:

- **The builder accepts a library.** `@angular/build:unit-test` 22.1.8 takes an `@angular/build:ng-packagr` build target (`ui:build-lib`).
- **Paths have two bases.** `coverageInclude` and `coverageExclude` are relative to the workspace root, where Vitest runs; `include` is relative to the project.
- **Coverage sees files, not unused exports.** A source file that no test imports is still reported, at 0%. An exported function that no test calls, inside a file that is imported, is tree-shaken from the test bundle and not counted at all.
- **Nx and ng-packagr disagree on self-imports.** `@nx/enforce-module-boundaries` rejects a project importing itself through an alias. ng-packagr requires exactly that between entry points (`@avelune/ui/sample/testing` from `sample.spec.ts`).
- **The Playwright browsers are already cached.** Playwright 1.63.0 needs chromium 1243, which is already in the user's Playwright cache. Its install script stays blocked (`allowBuilds`), so nothing is downloaded.

## Decision

1. **`ui:test`** runs `@angular/build:unit-test` (Vitest 4.1.11) in headless Chromium through `@vitest/browser-playwright`, with V8 coverage. Thresholds are **90% for statements, branches, functions and lines, in every file** (`perFile`). The coverage report covers every `.ts` file of `packages/ui` except specs, stories, `index.ts`, schematics and scripts.
2. **Tests use the harness** of their entry point and import from `vitest` explicitly (no globals). At least one test per component asserts something only a real browser provides, such as layout, focus or computed style, so a silent fallback to jsdom fails.
3. **`storybook:test`** runs every story as a test through `@storybook/addon-vitest` and `storybookAngularVitest()`, in Chromium. A story fails if it throws, if its `play` fails, or if axe finds any violation (`parameters.a11y.test = 'error'`).
4. **Proof** (`test-check:test`, node:test):
   - **Coverage:** the `coverage-gap` configuration of `ui:test` changes only which files run. Two fixtures in `tools/test-check/fixtures/coverage-gap` must fail it: a file with an untested branch, and a file no test imports. The spec also pins the thresholds.
   - **Stories:** a fixture Storybook in `tools/test-check/fixtures/storybook` reuses the real `main.ts`, preview and Vitest setup. It must fail on an unnamed button (axe `button-name`) and on a false `play` assertion.
5. **`packages/ui` allows self-imports** through entry-point specifiers in `@nx/enforce-module-boundaries` (`allowCircularSelfDependency`). `avelune/entry-point-layers` (ADR 0023) governs those imports more strictly.
6. **Vitest's failure screenshots** (`__screenshots__/<file>.ts/`, `.vitest-attachments/`) are debugging output and are git-ignored.

## Alternatives considered

- **Thresholds per entry point via globs:** each new entry point would need a config line. Per file is stricter and needs none. Chosen.
- **A separate Nx project for the coverage fixture:** it would be linted and built like a real project and need special cases. Rejected in favour of a configuration of `ui:test`.
- **Istanbul instead of V8, to count tree-shaken functions:** the builder bundles before Vitest instruments, so it isn't clear that Istanbul would see them either. Not pursued. The public-API JSDoc rule and the API report make every export visible in review instead.

## Consequences

- A component entry point cannot merge below 90% in any file. Anything it exports but no test touches still needs a reviewer, per the limitation above.
- `run-many -t test` now opens Chromium three times (`ui`, `storybook`, `test-check`'s nested runs), which takes about 20 seconds with a warm cache.
