# Architecture decision records

Every decision of consequence is an ADR. Read the ADRs that touch an area before changing it. An ADR is never edited to reverse its decision: write a new ADR that supersedes it and set the old one's status to `Superseded by NNNN`.

Status values: `Proposed` → `Accepted` → (`Superseded by NNNN` | `Deprecated`).

| # | Title | Status |
|---|---|---|
| [0001](0001-workspace-nx-pnpm-entry-points.md) | Workspace: Nx, pnpm, secondary entry points | Accepted |
| [0002](0002-behavior-layer-aria-cdk-native.md) | Behaviour layer: Angular Aria, CDK, native HTML; no Angular Material | Accepted |
| [0003](0003-tokens-dtcg-style-dictionary.md) | Tokens: DTCG 2025.10, Style Dictionary 5, three tiers | Accepted |
| [0004](0004-styling-custom-properties-layers.md) | Styling: custom properties, cascade layers, emulated encapsulation | Accepted |
| [0005](0005-motion-and-browser-floor.md) | Motion: `animate.enter`/`leave` + CSS; browser floor | Accepted; decision 1 superseded by 0014 |
| [0006](0006-testing-strategy.md) | Testing: Vitest browser mode, harnesses, Playwright in Docker, axe | Accepted |
| [0007](0007-versioning-release-api-reports.md) | Versioning: changesets, semver, API reports, `ng update` | Accepted |
| [0008](0008-storybook-angular-vite.md) | Storybook on `@storybook/angular-vite` | Accepted |
| [0009](0009-stylelint-logical-css-plugin.md) | Logical-properties lint: `stylelint-plugin-logical-css` | Accepted |
| [0010](0010-visual-test-determinism.md) | Visual-test determinism: pinned image, amd64, fonts | Accepted |
| [0011](0011-color-generation-and-contrast.md) | Colour generation in OKLCH and contrast maths | Accepted |
| [0012](0012-pnpm-11.md) | Package manager: pnpm 11 | Accepted |
| [0013](0013-vitest-4-now-5-later.md) | Vitest 4 now, Vitest 5 after Angular 22.2 | Accepted |
| [0014](0014-browser-floor-follows-angular.md) | Browser floor follows Angular's supported set | Accepted |

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
