# 0104. Consumer lint configs: `@avelune/eslint-config` and `@avelune/stylelint-config`, bundled from `tools/lint-rules`

- Status: Accepted (2026-10-02, technical decision within Phase 6)
- Date: 2026-10-02
- Related: 0007, 0023, 0024, 0030, 0089, 0103; brief §5.2, §5.3, §10; ROADMAP "Adoption plan"

## Context

- ADR 0023: applications get `no-raw-elements`, `no-restricted-imports` and the template rules through `@avelune/eslint-config`, which bundles `tools/lint-rules`. ADR 0024 wrote the root Stylelint config; ADR 0089 says the consumer config flags `--ave-*` declarations. The adoption plan has the configs warn on legacy paths and fail on new ones.
- `tools/lint-rules` is TypeScript run through Node's type stripping, which Node 24.21 refuses inside `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`, checked 2026-10-02). A published package must be JavaScript.
- esbuild 0.28.2, the latest release (2026-08-08), is already in the lockfile through `@angular/build` and `@size-limit/esbuild`.
- `@nx/enforce-module-boundaries` rejects a relative import into another project, and a buildable project's import of one without a build, such as `tools/lint-rules`.
- ESLint's plugin type does not accept a rule written with `@typescript-eslint/utils`, whose context is typescript-eslint's. angular-eslint asserts its plugins to ESLint's type for this reason.
- In a flat config a later object's setting of a rule replaces an earlier one. A Stylelint override may set `defaultSeverity`.
- The root Stylelint config checks custom properties with `value-no-unknown-custom-properties`, which also rejects an application's own properties declared in another file. Components declare private `--ave-<component>-*` properties (`--ave-badge-fill`); only the names in `tokens.css` are public.

## Decision

1. **Source and build:**
   - The configs' sources are `tools/lint-rules/src/consumers/<package>.ts`, beside the rules and settings they import.
   - Each package's build bundles its file with esbuild into `dist/index.js` (ESM, Node 20.19+), its peers and dependencies external. `tsc` emits `dist/index.d.ts`, which may import only those packages. The build fails on anything else.
   - The ESLint plugin is checked against typescript-eslint's plugin type, then asserted to ESLint's, as angular-eslint does.
   - `esbuild` 0.28.2 becomes a direct devDependency. The packages ship `files: ["dist"]` under MIT; `private` stays until the first publish.
2. **`@avelune/eslint-config`** exports `avelune(options?)`, which returns flat config objects:
   - Templates, `**/*.html` and inline templates through angular-eslint's processor:
     - angular-eslint's `templateRecommended` and `templateAccessibility`;
     - `no-inline-styles`, `button-has-type`, `no-positive-tabindex`, `no-duplicate-attributes`, and `elements-content` allowing `aveIconButton`;
     - `avelune/icon-label`, and `avelune/no-raw-elements` with `kitElements`.
   - TypeScript and JavaScript: `no-restricted-imports` bans `@angular/animations`, Angular Material and deep `@avelune/ui` imports. TypeScript files are parsed by typescript-eslint's parser.
   - `options.legacy`, a list of globs, turns the kit's rules into warnings there.
   - It also exports `restrictedImports`, for an application that has its own `no-restricted-imports`, and `kitElements`.
   - TypeScript strictness and code style stay the application's.
   - Peers: `eslint ^10`, `angular-eslint ^22.5`, `typescript-eslint ^8.70`. Dependency: `@typescript-eslint/utils`.
3. **`@avelune/stylelint-config`** exports a config for `extends`:
   - The root config's rules that apply to an application:
     - token-only values: no hex or named colours, raw colour or easing functions or token units, and strict values;
     - no `!important`, id selectors or `::ng-deep`; motion longhands only and no `transition: all`;
     - no `@keyframes`, since the catalog is the kit's; no outline property or `:focus`, since the ring is the kit's;
     - logical properties, with the same derived exceptions;
     - `avelune/media-query-tokens` and `avelune/nesting-same-element`.
   - Two new rules:
     - `avelune/no-token-declarations`: an application never declares `--ave-*` (ADR 0089).
     - `avelune/known-tokens`: a `var(--ave-*)` names a token of `@avelune/tokens/tokens.css`. The application's own properties stay free.
   - Not included: `stylelint-config-standard`, which is style, and the kit's layer rules.
   - Legacy paths: an override with `defaultSeverity: 'warning'`, shown in the README.
   - Peer: `stylelint ^17`. Dependencies: its two plugins and `@avelune/tokens`.
4. **One source:** the lists that the root configs and the packages share move into `tools/lint-rules`, and both import them. The shared lists are the token units, the raw functions, the keywords, the strict-value properties, the logical exceptions, the restricted imports and the template rules.
5. **Proof:**
   - `eslint-config:test` and `stylelint-config:test` lint code through the built `dist/index.js`, which the package's name resolves to. Each rule group has a violation and there is a clean control, and `legacy` (or the override) turns the failures into warnings.
   - The bundle's imports equal the package's peers and dependencies, read from esbuild's metafile.
   - The two new rules have unit tests in `lint-rules:test`. The showcase, linted as an application, applies both, with workspace fixtures.

## Alternatives considered

- **The config's source in the package, importing the rules:** Nx rejects the relative import into `tools/lint-rules`. A path alias fails too, because `tools/lint-rules` has no build. Rejected.
- **The rules in the packages, imported by `tools/lint-rules`:** a tool would depend on a package, against the project tags. Rejected.
- **`tsc` to JavaScript without a bundle:** the output would mirror the repository's folders. Rejected.
- **The root's `value-no-unknown-custom-properties` for applications:** it fails on the application's own properties. Rejected for `known-tokens`.
- **`stylelint-config-standard` in the consumer config:** formatting is the application's choice. Rejected.

## Consequences

- An application's own `no-restricted-imports` is replaced by the kit's unless it merges `restrictedImports`. The README says how.
- ROADMAP Phase 6's token item keeps the deprecated names and their autofix; unknown names and declarations are checked from now on.
- `kitElements` reaches applications only with a new version of the package, which moves with the kit's (ADR 0007).
