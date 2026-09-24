# 0029. Repository guardrails: project tags, browser floor, commits, formatting, dependency policy

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0001, 0005, 0007, 0012, 0014, 0015; brief §5

## Context

Brief §5 requires every guardrail to be proven to fail on a violation. The audit of the enforcement map at the end of Phase 3 found seven gaps: rules enforced by configuration or by hand, with nothing proving they reject a violation.

- The layer and type tags of Nx projects: a project without one escapes `@nx/enforce-module-boundaries` (Phase 1 carry-over).
- ADR 0014's floor rule for `.browserslistrc` (Phase 1 carry-over).
- commitlint.
- Prettier.
- pnpm's `minimumReleaseAge` and `allowBuilds`.
- API Extractor's two failure modes: proven once by hand in Phase 1, with no permanent fixtures.
- The `ng add` and `ng update` collections: never loaded by a test.

Facts:

- `@angular/build` 22.1.8 pins Angular's supported set as `baseline widely available on 2026-05-07` in `src/utils/supported-browsers.js`.
- MDN browser-compat-data 8.1.2 gives the first full version of each feature ADR 0005 requires. The result is Chrome and Edge 117, Firefox 129, Safari and iOS 17.5. `HTMLElement.popover` is partial on iOS 17–18.2: no light dismiss, WebKit bug 267688. The `popover` attribute itself is full from iOS 17.
- `pnpm config list --json` reports pnpm's effective settings, including the ones read from `pnpm-workspace.yaml`.

## Decision

1. **`tools/repo-check`** holds the repository-level rules that no linter covers.
   - `repo-check:check` fails when a project has anything other than exactly one of the tags that `@nx/enforce-module-boundaries` constrains. The tags are read from the effective ESLint config, and the projects from `nx graph`.
   - It also fails when `.browserslistrc` breaks ADR 0014. For each browser, the floor must equal the higher of two versions: the first with every required CSS feature (browser-compat-data) and Angular's supported set (the Baseline date read from `@angular/build`). A lower floor is unsupported; a higher one needs a new ADR.
2. **`repo-check:test`** proves those checks with fixtures (four wrong `.browserslistrc` files, and invalid tag sets). It also proves the rules that live in configuration:
   - commitlint rejects a wrong type, an unknown scope, a sentence-case subject and an overlong body line;
   - the Prettier config rejects unformatted code and ignores `.md`;
   - pnpm's effective policy: 1440 minutes, no exclusions, `engineStrict`, install scripts for esbuild only, pnpm pinned. That pnpm enforces its own settings is taken as given, and the test pins the settings.
3. **API reports:** `api-report.mjs` accepts `--package` and `--build`. `test-check:test` runs it on a miniature library whose entry points are clean, stale and untagged. The test asserts one pass and the two failures.
4. **Schematics:** `ui:test-schematics` loads the built collections with `SchematicTestRunner`. `ng add` must run and change nothing (until Phase 6), the migration collection must load empty, and `ng-update.packageGroup` must list every `@avelune` package. The tests run under `node:test`, as the addendum to ADR 0015 records.

## Alternatives considered

- **Putting these checks in `lint-rules` or `compiler-check`:** neither is about linting or compiler options, and both would blur what their fixtures prove.
- **A fixed list of allowed tags in `repo-check`:** it would drift from the ESLint config. Rejected in favour of reading the effective rule.
- **Proving `minimumReleaseAge` with a real install of a version under 24 hours old:** needs the network and a package that happens to have just been released. Flaky. Rejected.

## Consequences

- Every row of the enforcement map now names its proof.
- An Angular upgrade that moves the Baseline date fails `repo-check:check` until the floor follows ADR 0014 again, with the product owner's approval if it rises.
- iOS popovers need their own light dismiss until iOS 18.3 is the floor (tracked in ROADMAP.md for Wave 3).
