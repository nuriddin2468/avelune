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

## Phase 1 spike result (2026-09-23)

**The primary path holds; the fallback is not needed.** API Extractor 7.59.1 (bundled TypeScript 5.9.3) analyses the `.d.ts` that ng-packagr 22.1.1 emits with TypeScript 6.0.3 without parse errors. It prints a notice that the project uses a newer TypeScript; that notice is expected until rushstack PR #5841 ships.

Implementation: `packages/ui/scripts/api-report.mjs`, Nx target `ui:api-report` (depends on `build`). One report per entry point in `packages/ui/api/<specifier>.api.md`; `--update` rewrites them locally, the default mode fails when a report differs. All compiler, extractor and TSDoc messages are errors, with one exception below. Both failure modes were proven: an export without a release tag, and a tagged export whose report was not updated.

Findings that shape the implementation:

1. **Cross-entry-point imports.** Inside the package, `import … from '@avelune/ui/sample'` resolves as a TypeScript self-reference, which API Extractor treats as local, so every shared type became `ae-forgotten-export`. The script analyses a copy of each `.d.ts` outside the package and places the package under `node_modules/`, so those imports are external, as they are for consumers.
2. **Release tags are required** (`ae-missing-release-tag`). `@experimental` is not an API Extractor release tag. The component statuses in ROADMAP.md map to release tags: experimental → `@alpha`, beta → `@beta`, stable → `@public`; `@internal` for anything not meant for consumers.
3. **`ae-undocumented` is off.** Angular writes undocumented static members (`ɵfac`, `ɵdir`, `ɵcmp`) into every `.d.ts`. JSDoc coverage of public inputs and outputs is enforced by ESLint on the sources in Phase 3 instead. The `ɵdir`/`ɵcmp` lines stay in the reports on purpose: they show the selector, input aliases, `required` flags and outputs, so a change to any of them is visible in review.
4. **`{@link}` with an import path** (`@avelune/ui/sample#AveSample`) is not supported by API Extractor's TSDoc resolver. Refer to other entry points in prose.
5. **ES2024 lib.** The analysis tsconfig uses `lib: ES2024` because TypeScript 5.9 does not know ES2025, as the context above anticipated.

CI wiring (merge-request diff, stage order) is Phase 3.
