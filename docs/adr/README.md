# Architecture decision records

Every decision of consequence is an ADR. Read the ADRs that touch an area before changing it. An ADR is never edited to reverse its decision: write a new ADR that supersedes it and set the old one's status to `Superseded by NNNN`.

Status values: `Proposed` → `Accepted` → (`Superseded by NNNN` | `Deprecated`).

| # | Title | Status |
|---|---|---|
| [0001](0001-workspace-nx-pnpm-entry-points.md) | Workspace: Nx, pnpm, secondary entry points | Accepted |
| [0002](0002-behavior-layer-aria-cdk-native.md) | Behaviour layer: Angular Aria, CDK, native HTML; no Angular Material | Accepted |
| [0003](0003-tokens-dtcg-style-dictionary.md) | Tokens: DTCG 2025.10, Style Dictionary 5, three tiers | Accepted |
| [0004](0004-styling-custom-properties-layers.md) | Styling: custom properties, cascade layers, emulated encapsulation | Accepted |
| [0005](0005-motion-and-browser-floor.md) | Motion: `animate.enter`/`leave` + CSS; browser floor | Accepted; decision 1 superseded by 0014; nesting result in addendum (0024) |
| [0006](0006-testing-strategy.md) | Testing: Vitest browser mode, harnesses, Playwright in Docker, axe | Accepted |
| [0007](0007-versioning-release-api-reports.md) | Versioning: changesets, semver, API reports, `ng update` | Accepted |
| [0008](0008-storybook-angular-vite.md) | Storybook on `@storybook/angular-vite` | Accepted; addendum's AOT point superseded by 0025 |
| [0009](0009-stylelint-logical-css-plugin.md) | Logical-properties lint: `stylelint-plugin-logical-css` | Accepted |
| [0010](0010-visual-test-determinism.md) | Visual-test determinism: pinned image, amd64, fonts | Accepted |
| [0011](0011-color-generation-and-contrast.md) | Colour generation in OKLCH and contrast maths | Accepted; accent fill replaced by 0019, restored by 0021 |
| [0012](0012-pnpm-11.md) | Package manager: pnpm 11 | Accepted |
| [0013](0013-vitest-4-now-5-later.md) | Vitest 4 now, Vitest 5 after Angular 22.2 | Accepted |
| [0014](0014-browser-floor-follows-angular.md) | Browser floor follows Angular's supported set | Accepted |
| [0015](0015-node-scripts-typescript-node-test.md) | Repository scripts in TypeScript, run by Node; `node:test` | Accepted; resolution exception in addendum (0022) |
| [0016](0016-token-sources-and-tier-rules.md) | Token sources: files, tier rules, literal values | Accepted |
| [0017](0017-token-build-output.md) | Token build output: px, one CSS file with mode blocks, typed TS | Accepted |
| [0018](0018-fonts-subset-rename-fallback.md) | Fonts: IBM Plex Sans subsets, renamed "Avelune Sans", metric-matched fallback | Accepted |
| [0019](0019-accent-exact-brand-dark-text.md) | Accent fill: the exact brand colour with dark text | Superseded by 0021 |
| [0020](0020-icons-lucide.md) | Icons: Lucide | Accepted |
| [0021](0021-accent-nearest-passing-step.md) | Accent fill: back to the nearest passing step | Accepted |
| [0022](0022-compiler-strictness.md) | Compiler strictness: required options, checked in every tsconfig, proven by fixtures | Accepted |
| [0023](0023-eslint-configuration.md) | ESLint: strict type-aware presets, kit rules, fixtures that lint as real paths | Accepted |
| [0024](0024-stylelint-configuration.md) | Stylelint: token-only values, same-element nesting, logical exceptions derived from browser data | Accepted |
| [0025](0025-storybook-jit.md) | Storybook compiles stories JIT; ngc type-checks them | Accepted |
| [0026](0026-unit-and-story-tests.md) | Unit and story tests: Angular's unit-test builder in Chromium, per-file thresholds, failing fixtures | Accepted |
| [0027](0027-browser-suites-in-the-pinned-container.md) | Browser suites: visual, axe sweep and invariants in the pinned container | Accepted |
| [0028](0028-size-budget-per-entry-point.md) | Size budgets: one per entry point, declared in its manifest | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed
- Date: YYYY-MM-DD
- Related: ADR numbers, issues

## Context
What forces are at play. Facts, with sources and versions.

## Decision
What we do. Concrete and checkable.

## Alternatives considered
Each with the reason it lost.

## Consequences
What gets easier, what gets harder, what must be enforced and by which check.
```

Keep every ADR under one page.
