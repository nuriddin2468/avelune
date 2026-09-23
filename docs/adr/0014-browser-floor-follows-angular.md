# 0014. Browser floor follows Angular's supported set

- Status: Accepted (2026-09-23, product owner)
- Date: 2026-09-23
- Related: 0005 (supersedes its decision 1 only)

## Context

ADR 0005 set the floor from the CSS features Avelune needs: `Chrome >= 117, Edge >= 117, Firefox >= 129, Safari >= 17.5, iOS >= 17.5` (Chrome 117 is the first with `@starting-style` and `transition-behavior`).

Angular has its own floor. `@angular/build` 22.1.8 (`src/utils/supported-browsers.js`) defines Angular's supported set as `baseline widely available on 2026-05-07`, which resolves to **Chrome, Edge and Firefox ≥ 119, Safari and iOS ≥ 17**. The first showcase build in Phase 1 printed:

> One or more browsers which are configured in the project's Browserslist configuration fall outside Angular's browser support for this version. Unsupported browsers: chrome 118, chrome 117, edge 118, edge 117

Angular still builds for those versions, but it neither tests nor supports them. Chrome and Edge 117–118 shipped in September–October 2023 and update automatically.

## Decision

1. The floor is, per browser, the **higher** of two values: the CSS-feature floor from ADR 0005 and Angular's supported set. Today that gives:
   `Chrome >= 119, Edge >= 119, Firefox >= 129, Safari >= 17.5, iOS >= 17.5`
2. The floor is re-checked on every Angular upgrade, because Angular moves its baseline date forward with each release. An Angular upgrade that prints the "outside Angular's browser support" warning is not merged until this ADR's rule is applied again, with the product owner's approval if the floor rises.
3. ADR 0005's feature table and its other decisions stay as they are.

## Alternatives considered

- **Keep Chrome/Edge 117.** Ships a configuration Angular calls unsupported, and the warning appears on every build, which trains people to ignore build output. Rejected.
- **Raise Chrome/Edge to 120** so that CSS nesting needs no lowering. Nothing needs it yet, and Angular's builder lowers nesting correctly. Not needed.
- **Adopt Angular's set as-is** (Firefox 119, Safari 17). It drops below our feature floor: no `@starting-style` in Firefox 119–128. Rejected.

## Consequences

- `.browserslistrc` and the "Browsers" row in ROADMAP.md were changed on acceptance, and ADR 0005 is marked "decision 1 superseded by 0014".
- The build warning disappears, so any future appearance of it is a real signal.
- Phase 3 can turn the rule into a check: compare `.browserslistrc` with Angular's supported set and fail on browsers outside it.
