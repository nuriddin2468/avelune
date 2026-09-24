# 0028. Size budgets: one per entry point, declared in its manifest

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0001, 0006; brief §5.4, §9.3

## Context

Brief §5.4 asks for a `size-limit` budget per entry point, and the definition of done includes meeting it. Facts:

- size-limit 14.0.0 loads a `.ts` or `.mts` config through Node, and leaves out the `peerDependencies` of the nearest `package.json` (for `packages/ui`: Angular and the CDK).
- `@size-limit/esbuild` bundles and minifies each check with esbuild 0.28, the version Angular's application builder already uses. `@size-limit/file` measures the result with brotli at quality 11. `preset-small-lib` now uses rolldown instead.
- ng-packagr writes one FESM bundle per entry point (`fesm2022/avelune-ui-<name>.mjs`), in partial compilation. Component styles are inlined in it.
- Every entry point already has a manifest, `entry.json` (ADR 0001), and testing entry points have none.

## Decision

1. **The budget lives in the entry point's manifest:** `"sizeLimit": "900 B"` in `entry.json`, required by `entry.schema.json`.
2. **`packages/ui/scripts/size-limit.mts`** makes one check per manifest. The check measures that entry point's FESM bundle, bundled and minified by esbuild and compressed with brotli. Peers and the other `@avelune/ui/*` entry points stay external, because each carries its own budget. A manifest without a valid budget fails the config.
3. **`ui:size`** runs size-limit after `ui:build-lib` and fails when any entry point is over its budget.
4. **Budget policy:** the measured size plus 10%, rounded up to the next 100 B. Raising a budget needs a reason in the merge request, like any other guardrail change. The sample entry point measures 758 B, so its budget is 900 B.
5. **Proof** (`test-check:test`) runs the real checks on a miniature library. One entry point is over its budget, one is within it, and a third declares no budget.

## Alternatives considered

- **One central `.size-limit.json`:** a new entry point could be forgotten. With the budget in the manifest, the entry point cannot exist without one.
- **`@size-limit/file` alone:** it measures the unminified FESM file, which is not what consumers ship.
- **`preset-small-lib` (rolldown):** a second bundler with different minification from the one Angular applications use.
- **Counting imported entry points in each budget:** closer to one screen's cost, but it counts shared code once per importer, and the budgets would move together.

## Consequences

- Adding an entry point means measuring it and writing its budget (ARCHITECTURE.md, "Adding an entry point").
- Partial-compiled code is slightly larger than what the Angular linker produces in a consumer build, so the budgets err on the safe side.
- Testing entry points have no budget; they never ship in an application bundle.

## Addendum: the size check hashes the build it measures (2026-09-24)

`ui:size` and `ui:api-report` listed their inputs as paths into `dist/` (`{workspaceRoot}/dist/packages/ui/fesm2022/**/*`). Nx hashes such paths before the task's dependencies run, so a changed library was measured against the cached result of the previous build: IconButton brought the button entry point to 2.77 kB, over its 2.7 kB budget, and `ui:size` still reported 2.42 kB and passed. Both targets now take the build's outputs as `dependentTasksOutputFiles`, which Nx hashes after `build-lib` has run; the same change then failed at 2.77 kB, as it should.
