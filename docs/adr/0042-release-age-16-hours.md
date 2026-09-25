# 0042. Release age: 16 hours

- Status: Accepted (2026-09-25, product owner)
- Date: 2026-09-25
- Related: 0012 (addendum superseded in its `minimumReleaseAge` point), 0029, 0025, 0035

## Context

The addendum to ADR 0012 set `minimumReleaseAge: 1440`: pnpm resolves no version younger than 24 hours, with no per-package exceptions. Facts, verified on 2026-09-25:

- The Angular 22.2 upgrade (framework, `@angular/build` 22.2.0) breaks the Storybook build: `@analogjs/vite-plugin-angular` 2.7.2 calls `@angular/build`'s hash utility, which 22.2 requires to be initialised first (`AssertionError: Hash utility must be initialized by awaiting initializeHash() before use`).
- `@analogjs/vite-plugin-angular` 2.7.3 initialises it; it was published on 2026-09-24 at 13:04 UTC, and 2.7.4 at 13:18 UTC. At 07:32 UTC on 2026-09-25, pnpm refused 2.7.3 (`ERR_PNPM_NO_MATURE_MATCHING_VERSION`).
- A per-package exception (`minimumReleaseAgeExclude`) would remove the guard entirely for that package and is forbidden by AGENTS.md.

The product owner decided on 2026-09-25 to shorten the release age to 16 hours.

## Decision

1. `pnpm-workspace.yaml` sets **`minimumReleaseAge: 960`** (16 hours), for every package, direct and transitive. Still no `minimumReleaseAgeExclude`.
2. `repo-check:test` (ADR 0029) pins 960 and no exclusions; any other value fails it.
3. The docs that stated 24 hours (AGENTS.md, compatibility.md, ARCHITECTURE.md's enforcement map, ROADMAP.md) state 16 hours and cite this ADR.

## Alternatives considered

- **Keep 24 hours and wait:** 2.7.3 matures at 13:04 UTC the same day; the product owner chose not to wait.
- **`minimumReleaseAgeExclude` for Analog:** removes the guard for that package for good; forbidden.
- **Call `initializeHash()` from `.storybook/main.ts`:** reaches into a private file of `@angular/build`, and would have to be undone after the upgrade.

## Consequences

- A compromised release has 16 hours instead of 24 to be found and unpublished before this repository can resolve it: the margin is smaller.
- pnpm 11's own default is 1440; this repository sets a lower value explicitly, so it cannot drift back silently either.
- A release is adopted 16 hours after publication at the earliest; held-back rows in compatibility.md mature sooner.
