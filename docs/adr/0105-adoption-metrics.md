# 0105. Adoption metrics: the consumer lint configs' findings, counted per metric, with a ratchet

- Status: Accepted (2026-10-02, technical decision within Phase 6)
- Date: 2026-10-02
- Related: 0007, 0023, 0024, 0089, 0103, 0104; brief §10; ROADMAP "Adoption plan"

## Context

- Brief §10: `tools/adoption-metrics` scans a consumer repository for raw colours, raw pixel values, raw interactive elements, local keyframes, `::ng-deep` and the kit version lag, as JSON and a CI summary. The adoption plan wants a baseline per consumer in `docs/audit.md`, and raw values and lag that trend down.
- `@avelune/eslint-config` and `@avelune/stylelint-config` (ADR 0104) already find each of these, by rule. A second definition of "raw" would drift from them.
- The pilot's predecessor (`e-archive`, `apps/web`, read only, 2026-10-02) has 256 TypeScript files, 156 inline templates, 10 components with inline `styles`, 3 CSS files, `@keyframes` in 7 files, and Tailwind.
- Project tags let a tool import tools only, and Nx rejects relative imports between projects. `tools/visual` and `tools/invariants` consume other projects' build output through `implicitDependencies`.

## Decision

1. **One definition:** the tool runs the built consumer configs over the repository and counts their findings by rule:
   - `rawColors`: `color-no-hex`, `color-named`, and `function-disallowed-list` on a colour function;
   - `rawPixels`: `unit-disallowed-list` on `px` (query widths are allowed);
   - `rawElements`: `avelune/no-raw-elements`;
   - `localKeyframes`: `at-rule-disallowed-list` on `@keyframes`;
   - `ngDeep`: `selector-disallowed-list`;
   - `tokenOverrides`: `avelune/no-token-declarations` and `avelune/known-tokens`;
   - `inlineStyles`: angular-eslint's `no-inline-styles`;
   - `bannedImports`: `no-restricted-imports`.

   Every other finding of the configs is left out of the counts.
2. **What it reads:**
   - CSS files, and the `styles` of components, which TypeScript's parser extracts; a style with an interpolation is skipped and counted.
   - HTML templates and inline templates, through angular-eslint's processor.
   - TypeScript and JavaScript files for imports.

   It leaves out what is not the application's code: `node_modules`, build output and caches, spec files, minified files, and the files a build copies as they are (`public`, `vendor`). `--exclude` adds globs. In `e-archive` the vendored PDF viewer in `public/` held 892 of 928 raw colours.

   SCSS, Sass and Less files are counted as skipped, and an installed Tailwind is named in a note: its utility classes are not scanned. Disable comments are ignored, so a silenced finding still counts.
3. **The lag:** the installed `@avelune/ui` version (from `node_modules`, else the `package.json` range) against `--latest`, which defaults to this repository's version. It reports which part is behind and by how much. The lag is reported only; kit releases are not the consumer's to stop.
4. **Output:**
   - JSON (`--json`): the totals, the counts per file, the coverage, the notes and the lag.
   - A Markdown summary (`--summary`, or `$GITHUB_STEP_SUMMARY` when set), with the change against `--previous`.
   - `--ratchet` fails when any count rose against `--previous`.
5. **Loading:** `adoption-metrics` depends on `eslint-config` and `stylelint-config` through `implicitDependencies` and their `build`, and loads their `dist/index.js` by path, as an application loads them. It imports nothing from another project's source.
6. **Proof:** `adoption-metrics:test` scans fixture repositories, copied to a temporary folder with the files git does not keep (build output, `node_modules`).
   - A consumer with every metric at a known count: CSS, a component with inline template and styles, an HTML template, a skipped SCSS file, and build output that must be left out.
   - A clean consumer with every count at zero.
   - The lag cases, the ratchet, and the summary.

## Alternatives considered

- **Own regular expressions for raw values:** a second definition that drifts from the lint configs and misses what they know (query widths, nesting). Rejected.
- **Importing the configs' sources from `tools/lint-rules`:** Nx rejects the relative import, and Node's type stripping cannot follow a path alias. Rejected.
- **Allowing tools to depend on `type:config`:** loosens a project constraint for one tool. Rejected; the build output is the contract.
- **Scanning Tailwind classes and SCSS:** needs more parsers for the consumers that use them. Deferred until a consumer needs it; the JSON names the gap.

## Consequences

- A metric changes whenever a consumer config's rule changes. The fixtures' exact counts make that visible.
- A consumer's CI needs the tool. Until it is published, the kit's team runs it against a checkout and records the result in `docs/audit.md`.
