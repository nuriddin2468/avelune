# 0007. Versioning: changesets, semver, API reports, `ng update`

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0001

## Context

Consumers must be able to upgrade safely. Every public API change must be visible in review, and every breaking change must be automatable. `REGISTRY` is not set yet and CI is local-only for now. `@microsoft/api-extractor` 7.59.2 bundles TypeScript 5.9.3, and its PRs to move to TS 6.0.3 are still open. Known issue: an ES2025 `lib`/`target` breaks it; the workaround is a dedicated ES2024 tsconfig.

## Decision

- **Semver with changesets 3.0.3.** Every merge request that touches `packages/` includes a changeset (a CI check). Packages form one **fixed** version group (`@avelune/tokens`, `ui`, `icons`, `eslint-config`, `stylelint-config`), so a consumer reasons about one kit version and version lag is one number.
- **0.x until the 1.0 criteria in ROADMAP.md are met.** In 0.x, minor versions may break, but only with a changeset marked breaking and an `ng update` migration.
- **API reports:** one committed report per entry point, diffed in every merge request.
  - **Primary:** API Extractor run against ng-packagr's `.d.ts` output with a dedicated ES2024 tsconfig. It also enforces release tags (`@public`, `@beta`, `@internal`) and flags forgotten exports.
  - **Fallback**, if the Phase 1 spike shows API Extractor mis-parsing TS 6 output: commit ng-packagr's combined per-entry-point `types/*.d.ts` as the golden, diff it in CI, and add a small check for untagged exports. The spike result is appended to this ADR.
- **`ng update` migration collection** in `packages/ui/schematics/migrations.json` from day one, even when empty. Every breaking change ships a migration plus a test with before/after fixtures.
- **Publishing** only from a release merge request, via a CI job that stays disabled until `REGISTRY` is set.

## Alternatives considered

- **Independent versioning:** a precise signal per package, but consumers juggle compatible combinations. Rejected for 0.x; revisit at 1.0.
- **semantic-release:** version inferred from commit messages, with no human-written changelog entry per change. Rejected in favour of explicit changesets.
- **No API report:** breaking changes would slip through review. Rejected.

## Consequences

- The API-report diff is a required review item in the merge-request template.
- Deprecations follow the policy in ROADMAP.md: `@deprecated` with a replacement, one dev-mode warning, removal only in the next major, always with a migration.
