# Architecture

How Avelune is built. Decisions and their reasons live in the [ADRs](adr/README.md); this file describes the resulting structure and how to work within it. Sections on the token pipeline, CSS, motion and releases are added in the phases that build them ([ROADMAP.md](ROADMAP.md)).

## Repository map

| Path | Nx project | Tags | What it is |
|---|---|---|---|
| `packages/tokens` | `tokens` | `layer:tokens` | DTCG sources and the Style Dictionary build |
| `packages/icons` | `icons` | `layer:foundations` | Icon set and the generated `IconName` union (Phase 4) |
| `packages/ui` | `ui` | `layer:patterns` | The Angular library, one secondary entry point per component |
| `packages/eslint-config` | `eslint-config` | `type:config` | Shared ESLint config for consumers (Phase 3) |
| `packages/stylelint-config` | `stylelint-config` | `type:config` | Shared Stylelint config for consumers (Phase 3) |
| `apps/showcase` | `showcase` | `type:app` | Real Angular app composing the kit into screens |
| `apps/storybook` | `storybook` | `type:app` | Foundations pages (Phase 2); component docs, stories, interaction and a11y tests (Phase 3) |
| `tools/tokens-check` | `tokens-check` | `type:tool` | Token validation |
| `tools/fonts` | `fonts` | `type:tool` | Builds and checks the web font in `packages/ui/styles/fonts` |
| `tools/lint-rules` | `lint-rules` | `type:tool` | Custom ESLint rules (Phase 3) |
| `tools/invariants` | `invariants` | `type:tool` | Cross-component Playwright invariants (Phase 3/5) |
| `tools/adoption-metrics` | `adoption-metrics` | `type:tool` | Consumer-repo scanner (Phase 6) |

Only `packages/*` are pnpm workspace packages (they are published). Apps and tools are Nx projects with a `project.json` only. All tool versions live once, in the `catalog:` of `pnpm-workspace.yaml` (ADR 0012). Nx also adds `npm:public` / `npm:private` tags from each `package.json`; they carry no constraints.

## Layers

Dependencies flow one way: `tokens → foundations → components → composites → patterns`.

**Between projects**, the root `eslint.config.mjs` enforces this with `@nx/enforce-module-boundaries`:

| Source tag | May depend on |
|---|---|
| `layer:tokens` | `layer:tokens` |
| `layer:foundations` | tokens, foundations |
| `layer:components` | tokens, foundations, components |
| `layer:composites` | … and composites |
| `layer:patterns` | every layer |
| `type:app` | every layer |
| `type:tool` | `layer:tokens`, `type:tool` |
| `type:config` | `layer:tokens`, `type:tool`, `type:config` |

A project's layer tag is the highest layer it contains. `ui` holds entry points from foundations to patterns, so it is tagged `layer:patterns`: only apps may depend on it. Relative imports across projects are rejected too.

**Inside `@avelune/ui`**, Nx cannot see entry points, so each one declares its layer in `entry.json` (schema: `packages/ui/entry.schema.json`, values `foundations`, `components`, `composites`, `patterns`). An entry point may import only entry points of its own or a lower layer, and only through their public specifier (`@avelune/ui/button`, never `…/button/button`). A `testing` entry point belongs to its parent's layer. The ESLint rule `avelune/entry-point-layers` that enforces this is built in Phase 3; until then the manifests are written but not checked.

## Entry points

```
packages/ui/
├── index.ts                primary entry point; exports nothing on purpose
├── ng-package.json         ng-packagr config (dest, primary entry file)
├── package.json            peer dependencies, ng-add / ng-update wiring
├── entry.schema.json       schema of every entry.json
├── api/                    committed API reports, one per entry point
├── schematics/             ng-add and ng-update collections (CommonJS)
├── scripts/                build helpers (schematics assets, API reports)
└── button/                 one folder per entry point → @avelune/ui/button
    ├── index.ts            public API of the entry point
    ├── entry.json          { "layer": "components" }
    ├── ng-package.json     { "lib": { "entryFile": "index.ts" } }
    ├── button.ts, button.css, button.spec.ts, button.stories.ts
    └── testing/            → @avelune/ui/button/testing
        ├── index.ts
        ├── ng-package.json
        └── button-harness.ts
```

Conventions:

- Files have no type suffix (`button.ts`, not `button.component.ts`), per the Angular v20+ style guide.
- Exported symbols start with `Ave` (`AveButton`, `AveButtonHarness`, `AveButtonVariant`) so they never collide with consumer or Angular Aria names. Selectors use the `ave` prefix (`button[aveButton]`, `<ave-form-field>`).
- Every exported symbol carries an API Extractor release tag that mirrors its ROADMAP status: experimental → `@alpha`, beta → `@beta`, stable → `@public` (ADR 0007).
- `packages/ui/sample` is scaffolding that proves this layout. It is deleted when the first real entry point lands (Phase 4).

### Adding an entry point

1. Create the folder with `index.ts`, `entry.json` and `ng-package.json`, plus `testing/` with its own `index.ts` and `ng-package.json`.
2. No path mapping is needed: `tsconfig.base.json` maps `@avelune/ui/*` to `packages/ui/*/index.ts`.
3. `pnpm nx build ui`, then `pnpm nx run ui:api-report --update`; review and commit the new report.

## Build

`nx build ui` runs two steps:

1. `build-lib`: `@angular/build:ng-packagr` with `tsconfig.lib.prod.json` (partial compilation) into `dist/packages/ui`, in Angular Package Format with an `exports` entry per entry point.
2. `build`: compiles `schematics/` with `tsconfig.schematics.json` to CommonJS and copies their JSON manifests. The published package is `"type": "module"`, and the Angular CLI loads schematic factories with `require()`, so `dist/packages/ui/schematics/package.json` marks that folder `"type": "commonjs"`. The marker is written into `dist` only: a `package.json` inside the source tree would become a separate Nx project.

`nx build showcase` uses `@angular/build:application`; it resolves `@avelune/ui/*` to the sources through the path mapping, so no library build is needed for the app.

`nx run ui:api-report` compares every entry point's `.d.ts` with `packages/ui/api/*.api.md` and fails on a difference; `--update` rewrites the reports. See ADR 0007, "Phase 1 spike result", for how cross-entry-point imports are analysed.

## TypeScript

- `tsconfig.base.json` holds the strictness flags of brief §5.1 (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`, extended diagnostics as errors) for every project.
- TypeScript 6 specifics: no `baseUrl` (paths are relative to the config file), `types: []` by default, and `rootDir` defaults to the config's folder. Apps that compile library sources through path mappings set `rootDir` to the workspace root.
- `typecheck` targets run `ngc --noEmit`, which also type-checks templates; `ui:typecheck` checks the schematics too.

## Schematics

`packages/ui/schematics/collection.json` holds `ng-add`; `migrations.json` is the `ng update` collection and is empty until the first breaking change. `package.json` wires both (`schematics`, `ng-update.migrations`) and declares the fixed `packageGroup`, so `ng update @avelune/ui` moves every `@avelune/*` package together (ADR 0007). `ng-add` only logs a message until Phase 6.

## Tokens

`packages/tokens` holds the DTCG sources (`src/*.tokens.json`) and the scripts that produce or build them (ADR 0003, 0011). Scripts are TypeScript run directly by Node, tested with `node:test` (ADR 0015).

```
packages/tokens/
├── src/                               DTCG 2025.10 sources; tier of each file in ADR 0016
│   ├── primitives.color.tokens.json   generated; never edited by hand
│   ├── primitives.tokens.json         dimension (px), font-family, font-weight
│   ├── semantic.tokens.json           theme-independent: space, size, radius, font, z-index, breakpoints
│   ├── semantic.light.tokens.json     colour roles and elevation, light
│   ├── semantic.dark.tokens.json      the same names, dark
│   ├── motion.tokens.json             duration, easing, motion distance/scale, timing
│   ├── motion.reduced.tokens.json     reduced-motion overrides
│   ├── component.tokens.json          control height and padding
│   └── density.compact.tokens.json    compact overrides
├── sources.json                       tier of every source file and the override files
├── scripts/
│   ├── palette.config.ts              inputs: lightness ladder, chroma curve, hues, brand, contracts
│   ├── palette.ts                     colour generation and checks (pure functions)
│   ├── generate-colors.ts             CLI: check (default) or --update
│   ├── sources.ts                     reads sources.json, derives the build modes
│   ├── token-values.ts                DTCG value → CSS / TS value (pure functions)
│   ├── build.ts                       Style Dictionary per mode → dist/tokens.css, dist/tokens.ts
│   └── *.spec.ts                      node:test
└── dist/                              build output, not committed: tokens.css, tokens.ts, tokens.js, tokens.d.ts
```

**Tiers.** Primitives hold values and are never emitted. Semantic tokens name a purpose (`color.bg.surface`, `space.4`, `font.body-md`) and reference primitives; component tokens (`control.height.md`) exist only where a component must be themable, today for density, and reference semantic tokens. Durations, easings and plain numbers are literals in the semantic tier (ADR 0016).

**Build** (`pnpm nx build tokens`, ADR 0017). Style Dictionary resolves the sources once per mode: the base mode (light theme, comfortable density, full motion) and one mode per override file (dark, compact, reduced motion). `dist/tokens.css` holds every semantic and component token as a `--ave-*` custom property inside `@layer tokens`, in px, with one block per mode: `:root`, `[data-theme='light']`, `prefers-color-scheme: dark` and `[data-theme='dark']`, `[data-density='compact']`, `prefers-reduced-motion` and `[data-motion='reduced']`. `dist/tokens.ts` exports `tokens` (typed values, CSS names, per-mode values), `TokenName` and `tokenVar()`; it is compiled to the package's JS and `.d.ts`. The build first runs `tokens:colors`, so it never builds from stale colour primitives.

**Adding a token.** Put it in the file of its tier (ADR 0016): a purpose name, a reference to the tier below, a `$description` saying when to use it. Themed colours go into both theme files. Run `pnpm nx build tokens` and `pnpm nx run tokens:test`, look at the new lines in `dist/tokens.css`, and declare contrast pairs in `contrast-pairs.json` for any new text or boundary colour; `pnpm nx run tokens-check:check` must pass.

**Colour primitives.** Every scale (`neutral`, `orange`, `red`, `amber`, `green`, `blue`) has twelve steps, 50–950 plus 850, at the same OKLCH lightness per step, so a step plays the same contrast role in every hue. The brand colour is kept exact at `orange.500`. The ladder's contracts (which step carries text or boundaries on which surface) are checked on every generation; see ADR 0011, addendum. To change the palette: edit `palette.config.ts`, run `pnpm nx run tokens:colors --update`, review the diff of the generated file (each token's `$description` shows its OKLCH), commit both.

## Storybook

`apps/storybook` runs `@storybook/angular-vite` with AOT compilation (ADR 0008 and its addendum). `pnpm nx serve storybook` builds the tokens first and serves on `http://127.0.0.1:6006`; `pnpm nx build storybook` writes `dist/apps/storybook`. The toolbar switches theme, density and motion through the `data-*` attributes on `<html>`.

The **Foundations** pages live in `apps/storybook/src/foundations`: colour roles and every declared contrast pair per theme (WCAG ratio, APCA Lc for information), the type specimen in uz-Latn, uz-Cyrl, ru and en, spacing and control sizes, radius, elevation and stacking order, and the motion playground. They read `tokens` from `@avelune/tokens` and style themselves with tokens only; primitives never appear. Component stories will live next to their components (`packages/ui/<name>/<name>.stories.ts`) from Phase 5.

## Fonts

The kit's typeface is IBM Plex Sans, shipped as **"Avelune Sans"** (ADR 0018): `tools/fonts` subsets the pinned source (`tools/fonts/source`) into `packages/ui/styles/fonts/avelune-sans-{latin,latin-ext,cyrillic}.woff2` (variable, weights 400–600), renames it as the OFL requires, maps ʻ ʼ to Plex's ‘ ’ glyphs, and writes `fonts.css` with the `@font-face` rules and one metric-matched Arial fallback face per weight. The outputs are committed; `pnpm nx run fonts:check` rebuilds them in memory and fails on any difference, on a character a locale needs but the files lack, and on a leftover Reserved Font Name. `styles.css` imports `fonts.css` in Phase 4.

## Enforcement map

What is checked today, by which tool, at which stage. Phase 3 completes this table (brief §5).

| Rule | Tool | Pre-commit | CI |
|---|---|---|---|
| Project layers, no relative cross-project imports | `@nx/enforce-module-boundaries` (ESLint) | staged files | Phase 3 |
| TS strictness, template types | `ngc --noEmit` (`typecheck` targets) | affected projects | Phase 3 |
| Formatting | Prettier (`.md` excluded) | staged files | Phase 3 |
| Conventional commits, scope = Nx project or `repo`, `deps`, `docs`, `ci`, `release` | commitlint | commit message | n/a |
| Public API unchanged or report updated; release tags present | API Extractor (`ui:api-report`) | no | Phase 3 |
| No dependency younger than 24 h; install scripts only where listed | pnpm (`minimumReleaseAge`, `allowBuilds`) | `pnpm install` | `pnpm install` |
| Colour primitives are exactly what the config generates (no hand edits) | `tokens:colors` | no | Phase 3 |
| Shipped fonts equal a fresh build; every character of uz-Latn, uz-Cyrl, ru and en (incl. Intl output) covered; no Reserved Font Name; axes and checksums | `fonts:check`, proven by `fonts:test` | no | Phase 3 |
| DTCG schema, references, naming, tier direction and literals, line-height grid, theme parity, contrast pairs in both themes, no primitives in `dist/tokens.css` | `tokens-check:check`, proven by `tokens-check:test` (a fixture per rule) | no | Phase 3 |
| Palette rules: ladder contracts, exact lightness and hue, brand lightness, neutral tint | `generatePalette` (`tokens:colors`), proven by `tokens:test` | no | Phase 3 |

Hooks are a fast local gate and are never bypassed (`--no-verify` is not used). CI runs the same checks on the whole affected graph.
