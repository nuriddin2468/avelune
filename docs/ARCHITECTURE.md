# Architecture

How Avelune is built. Decisions and their reasons live in the [ADRs](adr/README.md); this file describes the resulting structure and how to work within it. Sections on the token pipeline, CSS, motion and releases are added in the phases that build them ([ROADMAP.md](ROADMAP.md)).

## Repository map

| Path | Nx project | Tags | What it is |
|---|---|---|---|
| `packages/tokens` | `tokens` | `layer:tokens` | DTCG sources and the Style Dictionary build |
| `packages/icons` | `icons` | `layer:foundations` | Every Lucide icon as typed, tree-shakable data, the icon types and the `IconNames` interface (ADR 0033, 0036) |
| `packages/ui` | `ui` | `layer:patterns` | The Angular library, one secondary entry point per component |
| `packages/eslint-config` | `eslint-config` | `type:config` | Shared ESLint config for consumers; bundles `tools/lint-rules` when first published (Phase 6) |
| `packages/stylelint-config` | `stylelint-config` | `type:config` | Shared Stylelint config for consumers; bundles the `avelune` Stylelint rules when first published (Phase 6) |
| `apps/showcase` | `showcase` | `type:app` | Real Angular app composing the kit into screens |
| `apps/storybook` | `storybook` | `type:app` | Foundations pages (Phase 2); component docs, stories, interaction and a11y tests (Phase 3) |
| `tools/tokens-check` | `tokens-check` | `type:tool` | Token validation |
| `tools/fonts` | `fonts` | `type:tool` | Builds and checks the web font in `packages/ui/styles/fonts` |
| `tools/compiler-check` | `compiler-check` | `type:tool` | Checks every tsconfig for the required compiler strictness; fixtures prove each option |
| `tools/test-check` | `test-check` | `type:tool` | Proves that the coverage gate, the story gates (`play`, axe), the size budgets, the API reports and the browser suites fail on violations |
| `tools/repo-check` | `repo-check` | `type:tool` | Project tags and the browser floor; proves the commit, formatting and dependency rules (ADR 0029) |
| `tools/lint-rules` | `lint-rules` | `type:tool` | The `avelune` ESLint and Stylelint rules and the fixtures that prove both workspace configs (ADR 0023, 0024) |
| `tools/visual` | `visual` | `type:tool` | Visual regression and the axe sweep of every story, in the pinned container; the container runner and fixed environment every browser suite shares (ADR 0010, 0027) |
| `tools/invariants` | `invariants` | `type:tool` | Axe and the cross-component invariants on every showcase screen, in the pinned container (ADR 0027); component invariants join in Phase 5 |
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

**Inside `@avelune/ui`**, Nx cannot see entry points, so each one declares its layer in `entry.json` (schema: `packages/ui/entry.schema.json`, values `foundations`, `components`, `composites`, `patterns`). An entry point may import only entry points of its own or a lower layer, and only through their public specifier (`@avelune/ui/button`, never `…/button/button`). A `testing` entry point belongs to its parent's layer, and only specs, stories and other harnesses may import one. `avelune/entry-point-layers` enforces all of this (ADR 0023).

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
├── styles/                 the global stylesheet → @avelune/ui/styles.css, and the fonts → @avelune/ui/fonts/*
└── button/                 one folder per entry point → @avelune/ui/button
    ├── index.ts            public API of the entry point
    ├── entry.json          { "layer": "components" }
    ├── ng-package.json     { "lib": { "entryFile": "index.ts" } }
    ├── button.ts, button.css, button.spec.ts
    ├── button.mdx          the docs page, written first as the spec (brief §9.2)
    ├── button.stories.ts   stories, with their frame in button.stories.css
    └── testing/            → @avelune/ui/button/testing
        ├── index.ts
        ├── ng-package.json
        └── button-harness.ts
```

Conventions:

- Files have no type suffix (`button.ts`, not `button.component.ts`), per the Angular v20+ style guide.
- Exported symbols start with `Ave` (`AveButton`, `AveButtonHarness`, `AveButtonVariant`) so they never collide with consumer or Angular Aria names. Selectors use the `ave` prefix (`button[aveButton]`, `<ave-form-field>`).
- Every exported symbol carries an API Extractor release tag that mirrors its ROADMAP status: experimental → `@alpha`, beta → `@beta`, stable → `@public` (ADR 0007).

A service without a component, such as `theme` or `forms`, has no harness and no `testing` entry point. Closely related components may share one entry point: `button` holds Button and IconButton (ADR 0038), `form-field` FormField with its hint and error, `checkbox` Checkbox with its `label[aveChoice]`.

**Forms** (ADR 0039). Every control calls `injectControlState()` and `connectToField()` from `@avelune/ui/forms`: the same state signals for Signal Forms, Reactive Forms and a bare element, and the link to the `<ave-form-field>` around it (its label's id, `aria-describedby`, `aria-invalid`, `aria-required`). A control never adds a value accessor of its own where a native one binds the element.

### Adding an entry point

1. Create the folder with `index.ts`, `entry.json` and `ng-package.json`, plus `testing/` with its own `index.ts` and `ng-package.json`.
2. No path mapping is needed: `tsconfig.base.json` maps `@avelune/ui/*` to `packages/ui/*/index.ts`.
3. If the entry point enhances a native element (`button[aveButton]`, `input[aveInput]`), add its attribute to `kitElements` in `tools/lint-rules/src/kit-elements.ts`, so consumers may use that element with it.
4. Declare its size budget in `entry.json` (`"sizeLimit"`): run `pnpm nx run ui:size` with a generous value, then set the measured size plus 10%, rounded up to the next 100 B (ADR 0028).
5. `pnpm nx build ui`, then `pnpm nx run ui:api-report --update`; review and commit the new report.

## Build

`nx build ui` runs two steps:

1. `build-lib`: `@angular/build:ng-packagr` with `tsconfig.lib.prod.json` (partial compilation) into `dist/packages/ui`, in Angular Package Format with an `exports` entry per entry point.
2. `build`: compiles `schematics/` with `tsconfig.schematics.json` to CommonJS and copies their JSON manifests. The published package is `"type": "module"`, and the Angular CLI loads schematic factories with `require()`, so `dist/packages/ui/schematics/package.json` marks that folder `"type": "commonjs"`. The marker is written into `dist` only: a `package.json` inside the source tree would become a separate Nx project.

`@avelune/ui` depends on `@avelune/tokens` and `@avelune/icons` through `workspace:*`, and resolves both through `node_modules` to their built `dist/` files, as a consumer does (ADR 0033). Every target that compiles, lints or bundles the kit builds them first through Nx `dependsOn`; the lint hook does it too.

`nx build showcase` uses `@angular/build:application`; it resolves `@avelune/ui/*` to the sources through the path mapping, so no library build is needed for the app. Its one global stylesheet is `packages/ui/styles/styles.css`, loaded as a consumer loads it (see "CSS"), after building the tokens.

The library build copies `packages/ui/styles` into the package unchanged (`assets` in `ng-package.json`). `package.json` exports it as `@avelune/ui/styles.css` and `@avelune/ui/fonts/*`, marks CSS as a side effect, and depends on `@avelune/tokens`, whose `tokens.css` the stylesheet imports.

`nx run ui:size` measures every entry point against the budget in its `entry.json` (ADR 0028): the FESM bundle from `build-lib`, bundled and minified by esbuild with the peers and the other entry points left out, brotli-compressed. The checks come from `packages/ui/scripts/size-limit.mts`.

`nx run ui:api-report` compares every entry point's `.d.ts` with `packages/ui/api/*.api.md` and fails on a difference; `--update` rewrites the reports. See ADR 0007, "Phase 1 spike result", for how cross-entry-point imports are analysed.

## TypeScript

- `tsconfig.base.json` holds the required strictness for every project (ADR 0022): brief §5.1 (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`, extended diagnostics as errors), plus `noImplicitReturns`, `noFallthroughCasesInSwitch`, `exactOptionalPropertyTypes`, `allowUnreachableCode: false`, `strictInjectionParameters`, `strictInputAccessModifiers`, `strictStandalone`, `strictUnclaimedEventNames` (since Angular 22.2) and `typeCheckHostBindings`. The list lives in `tools/compiler-check/src/requirements.ts`. A project tsconfig may add options, but it may never weaken these: `pnpm nx run compiler-check:check` resolves every `tsconfig*.json` the way ngc does and fails on any weaker value.
- `pnpm nx run compiler-check:test` proves the options. Each fixture in `tools/compiler-check/fixtures/violations` breaks one option or one extended diagnostic and must produce exactly its declared error codes. The control fixture `valid.ts` must compile clean. Every required option, and every extended diagnostic the installed compiler knows, must have a fixture. When an upgrade adds a new `strict` flag or a new diagnostic, add a fixture for it: a header `// Proves: <option>` and `// Expect: <codes>`, and an entry in `requirements.ts` if it is a flag.
- Consequences for code: leave optional properties out rather than setting them to `undefined` (`...(x === undefined ? {} : { x })`). In host listeners `$event` is `Event`; narrow it inside the handler.
- `@avelune/visual` maps to `tools/visual/src/index.ts`, the browser suites' shared environment; Playwright resolves it through the mapping, Node-side tests never import it.
- TypeScript 6 specifics: no `baseUrl` (paths are relative to the config file), `types: []` by default, and `rootDir` defaults to the config's folder. Apps that compile library sources through path mappings set `rootDir` to the workspace root.
- `typecheck` targets run `ngc --noEmit`, which also type-checks templates; `ui:typecheck` checks the specs (`tsconfig.spec.json`) and the schematics too.
- Every folder with TypeScript has a `tsconfig.json` that editors, the Angular language service and type-aware lint find by name. Where a build uses another file (`tsconfig.lib.json`, `tsconfig.app.json`, `tsconfig.schematics.json`), the `tsconfig.json` extends it and adds specs and stories.

## CSS

Plain CSS with native nesting, custom properties and cascade layers; emulated encapsulation; values from `--ave-*` tokens only (ADR 0004, 0024).

**The global stylesheet** is `packages/ui/styles/styles.css` (ADR 0030). It declares the layer order first, then imports the rest:

| Layer | File | Holds |
|---|---|---|
| `reset` | `reset.css` | border-box sizing, margins, text inflation off, long words break, balanced headings, media capped at their container, form controls inherit the font |
| `tokens` | `@avelune/tokens/tokens.css` | every `--ave-*` property, per theme, density and motion mode (ADR 0017) |
| `base` | `base.css`, `focus.css` | canvas and text colours on `html` and every `[data-theme]` island; plain HTML typography (h1 heading-xl, h2 heading-lg, h3 heading-md, h4–h6 heading-sm, body-md, `pre` code); the focus ring |
| `components` | `packages/ui/<entry>/*.css` | every component |
| `patterns` | (Wave 6) | page patterns |
| `utilities` | `utilities.css`, `motion.css` | `.ave-tabular-nums`; the `ave-motion-*` classes and every `@keyframes` (see "Motion") |
| `app` | the application | its own styles; unlayered CSS beats every layer |

`fonts.css` (generated, ADR 0018) is imported unlayered: `@font-face` rules are not layered.

**The focus ring** is one rule in `focus.css`: `:focus-visible` gets a `focus-ring.width` outline in `color.border.focus`, `focus-ring.offset` outside the element, and `Highlight` under forced colours. An element inside a container that clips its overflow sets `data-focus-ring="inset"`, and the same rule draws the ring inside its edge. Nothing else sets an outline, transitions one or styles `:focus`; Stylelint enforces all three.

**Loading it.** An application loads `@avelune/ui/styles.css` once, through its bundler, which resolves the tokens and rebases the font URLs. With Angular's application builder, as in the showcase:

- `styles: ["@avelune/ui/styles.css"]` (the showcase uses the source path);
- `optimization.styles.inlineCritical: false`: the critical-CSS inliner drops the dark theme and loads the stylesheet late, so the first paint would be light;
- `outputHashing: "bundles"` and `<link rel="preload" href="media/avelune-sans-latin.woff2" as="font" type="font/woff2" crossorigin>` in `index.html`: hashed media names cannot be preloaded. The invariants suite fails a preload that no face uses or that downloads twice.

Storybook imports the same file in `.storybook/preview.ts` (`@avelune/ui/styles.css`, mapped in `tsconfig.base.json`).

**Adding global CSS** means adding it to one of these files, in its layer: `avelune/component-layer` accepts only `reset`, `base` and `utilities` there, and `avelune/layer-order` keeps the entry's first statement. Show it on the Foundations "Global styles" page and assert it in that page's `play` function.

## Motion

Motion is CSS only (ADR 0005). Two mechanisms, both on tokens:

- **State changes** (hover, pressed, expanded, the switch thumb, the tabs indicator) are transitions in the component's own CSS. They use the motion longhands with duration and easing tokens.
- **Entering and leaving** use the classes of `packages/ui/styles/motion.css` (ADR 0031), through `animate.enter` and `animate.leave`: `ave-motion-popover-*`, `-tooltip-*`, `-dialog-*`, `-backdrop-*` and `-toast-*`, each with `-enter` and `-exit`. The loops are `ave-motion-shimmer` and `ave-motion-spin`. `motion.css` also times the route cross-fade (`::view-transition-*(root)`). Tooltips and toasts take their direction from `data-side`.

```html
@if (open()) {
  <div class="menu" animate.enter="ave-motion-popover-enter" animate.leave="ave-motion-popover-exit">…</div>
}
```

**Reduced motion** (`prefers-reduced-motion: reduce` or `data-motion="reduced"`) is the tokens' override only: distances 0, scale 1, slow and slower 150ms, no stagger, and a shimmer period of 0 (a static skeleton). Fades stay, and so does rotation.

Every easing is a token, except `linear` on a loop (Stylelint allows it in `motion.css` only; the invariants accept it only on an animation that repeats forever). The drawer, list items, shared-element transitions and top-layer overlays get their motion with their components (ADR 0031, point 5). The Foundations page "Motion catalog" plays every class, and its `play` function checks them in both modes.

## Icons

`packages/icons` (ADR 0020, 0033, 0036) turns every icon of Lucide's `icon-nodes.json` into typed data:

- `pnpm nx run icons:generate` checks that `src/index.ts` (the types and `IconNames`, every Lucide name), `src/lucide.ts` (one export per icon, `lucideArrowDown`), `src/lucide-all.ts` (`lucideIcons`) and `LICENSE-lucide.txt` are what the installed `lucide-static` generates; `--update` rewrites them. The generator rejects any shape, attribute or fill outside Lucide's rules.
- `icons:build` compiles them to `dist/`, published as `@avelune/icons`, `@avelune/icons/lucide` and `@avelune/icons/lucide/all`.
- `icons:size` holds one icon to 250 B, which proves that a bundle keeps only the icons it imports, and the whole set to 78 kB.

`<ave-icon name="…">` (`@avelune/ui/icon`) draws a registered icon. `provideAveIcons([...])` registers icons in the application's, a route's or a component's providers, each registry extending its ancestor's; `defineAveIcon(name, svg, options)` turns an application's SVG into an icon, through a strict parser (`svg.ts`), fitted to the kit's colour and strokes by default. The component draws the `<svg>` through `Renderer2` (`draw.ts`), never as markup, with ids unique to each icon. Its sizes are 16, 20 and 24px (`sm` by default) and its strokes are frozen at 1.5, 1.5 and 1.75px. It needs `label` or `decorative`; `avelune/icon-label` checks templates, and the component throws in development, as it does for a name no provider registered.

A Lucide upgrade: run `icons:generate --update`, review the diff, the Gallery baselines and `icons:size`. Applications add their own icons with `defineAveIcon`; the Storybook guide "Custom icons / Check your icon" compares one with Lucide's rules.

## Runtime

`@avelune/ui/theme` (ADR 0032) is the kit's runtime API:

- `provideAvelune({ theme, density, motion, persist })` in the application's providers sets the defaults for a first visit. It creates `AveTheme` at bootstrap, so the attributes are on `<html>` before the first render.
- `AveTheme` exposes the signals `theme` (`light | dark | system`), `density` (`comfortable | compact`) and `motion` (`system | reduced`), and the methods `setTheme`, `setDensity` and `setMotion`. It writes `data-theme`, `data-density` and `data-motion`, which `tokens.css` reads. A preference that follows the system removes its attribute.
- It keeps the user's choices in `localStorage` (`avelune:preferences`) and follows a choice made in another tab. Storage failures are caught. On the server it writes the attributes and leaves storage alone.

The showcase calls `provideAvelune()`. Storybook sets the same attributes from its toolbar instead.

## Lint

`eslint.config.mjs` at the root lints every project (ADR 0023). Its layers:

1. The presets: `@eslint/js`, typescript-eslint `strictTypeChecked` (type-aware, through the project service), angular-eslint TS, template and accessibility rules, and eslint-comments. Every rule is an error, and lint runs with `--max-warnings=0`.
2. Kit-wide Angular rules from brief §9.1: the `ave` prefix, the signal API, the `host` object, emulated encapsulation. Also banned imports: `@angular/animations`, `@angular/material`, and deep `@avelune/ui` paths.
3. Per path:
   - `packages/ui`: `avelune/entry-point-layers`, `avelune/public-api-jsdoc`, `avelune/no-appearance-inputs`.
   - `apps/showcase`, linted as a consumer: `avelune/no-raw-elements`.
   - Every template, inline or in a file: `avelune/icon-label` (ADR 0033).
   - `apps/storybook/src/foundations`: the one documented exception, `[style.*]` bindings for token swatches.

`stylelint.config.mjs` lints every `.css` file (ADR 0024). Component styles always live in a `.css` file next to the component (`styleUrl`); ESLint bans `styles` in `@Component`, so nothing escapes. The rules:

- Values come from tokens only: no hex, named colours, colour functions, easing functions, or length and time units. Strict values apply to colours, fonts, radii, shadows, z-index, motion longhands and spacing.
- Unknown `--ave-*` names are errors.
- Selectors: no `!important`, no ids, specificity at most `0,4,0`, no `::ng-deep`.
- Motion: `transition` and `animation` longhands only; `@keyframes` only in `packages/ui/styles/motion.css`.
- The focus ring: `outline*` properties only in `packages/ui/styles/focus.css`, never in `transition-property`, and no `:focus` selectors (ADR 0030).
- `linear` as an easing only in `motion.css`, for its loops (ADR 0031).
- Logical properties throughout.
- Media and container query widths equal the breakpoint and container tokens.
- Kit stylesheets wrap everything in `@layer components`; the global stylesheets in `reset`, `base` or `utilities`, and `styles.css` starts with the layer order.

Nesting may only refine the same element (`&:hover`, `&[aria-disabled='true']`, `&::before`), and never `:host`: since Angular 22.2 the emulated shim scopes a nested `&` to the component's content, so `:host { &:hover {} }` never matches; write `:host(:hover)` (ADR 0024, addendum). `pnpm nx run-many -t stylelint` runs it per project, after the tokens are built.

The `avelune` rules live in `tools/lint-rules` (see its README). `pnpm nx run lint-rules:test` proves the plugin rules with RuleTester. It also lints each file in `tools/lint-rules/fixtures/config` (ESLint) and `tools/lint-rules/fixtures/stylelint` (Stylelint) through the real config, as if it were the path on its `Lint as:` line. It derives the logical-property exceptions from MDN browser-compat-data and pins how the emulated shim treats nesting. To add a rule or an exception, add a fixture that fails without it; the test also fails when a plugin rule has no fixture.

## Schematics

`packages/ui/schematics/collection.json` holds `ng-add`; `migrations.json` is the `ng update` collection and is empty until the first breaking change. `package.json` wires both (`schematics`, `ng-update.migrations`) and declares the fixed `packageGroup`, so `ng update @avelune/ui` moves every `@avelune/*` package together (ADR 0007). `ng-add` only logs a message until Phase 6.

`pnpm nx run ui:test-schematics` loads the built collections with `SchematicTestRunner` (`schematics/tests/*.spec.mts`, `node:test`; ADR 0015, addendum). `ng add` must run, the migration collection must load, and the package group must list every `@avelune` package. Every migration added later ships with a test there, with before and after trees.

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

`apps/storybook` runs `@storybook/angular-vite` with JIT compilation (ADR 0008, 0025); `storybook:typecheck` type-checks every story with ngc and the workspace strictness. `pnpm nx serve storybook` builds the tokens first and serves on `http://127.0.0.1:6006`; `pnpm nx build storybook` writes `dist/apps/storybook`. The preview imports `@avelune/ui/styles.css`, bundled by Vite as an application bundles it (ADR 0030). The toolbar switches theme, density and motion through the `data-*` attributes on `<html>`. Docs pages follow the theme too: `.storybook/docs-theme.ts` gives addon-docs a docs theme for each kit theme, built from the semantic colour tokens. The page sits on `color.bg.surface` and its story previews on the canvas. Its props table lists inputs only (`propsTable: 'inputs'`), so protected template members stay out, and a component page describes plain outputs in its prose; boolean arguments get a radio control, because Storybook's toggle fails contrast. MDX supports GitHub-flavoured Markdown (tables), and a story rendered through a helper sets `parameters.docs.source` to the markup an application writes, with the icons it must register (ADR 0034, 0036). `storybook:build` and `storybook:test` hash the stories of `apps/storybook` and `packages/ui`, so a change to a story alone rebuilds and retests (ADR 0036). `patches/` holds one pnpm patch of `@storybook/angular-vite`, for a bootstrap race on docs pages (ADR 0035).

The **Foundations** pages live in `apps/storybook/src/foundations`: colour roles and every declared contrast pair per theme (WCAG ratio, APCA Lc for information), the type specimen in uz-Latn, uz-Cyrl, ru and en, spacing and control sizes, radius, elevation and stacking order, and the motion playground. The "Motion catalog" page plays every `ave-motion-*` class; its `play` function checks their tokens, poses and removal in both motion modes. The "Global styles" page shows the layers, plain HTML, the focus ring, the figures utility and a theme island, and its `play` function asserts their computed styles. They read `tokens` from `@avelune/tokens` and style themselves with tokens only; primitives never appear. A story tagged `forced-colors` is also compared in forced colours (see "Tests"). Each component's docs page (`<name>.mdx`, written first, as the spec) and its stories (`<name>.stories.ts`) live next to it in `packages/ui/<name>/`, and appear under "Components". **Guides** live in `apps/storybook/src/guides`: "Custom icons / Check your icon" draws a pasted SVG as the kit would and checks it against Lucide's rules (ADR 0036).

## Tests

- **Library** (`pnpm nx run ui:test`, ADR 0026): `@angular/build:unit-test` runs every `packages/ui/**/*.spec.ts` with Vitest 4 in headless Chromium. Every file needs 90% statements, branches, functions and lines.
  - Specs test through the entry point's harness and import from `vitest` explicitly.
  - At least one assertion per component needs a real browser (layout, focus, computed style).
  - An exported function that no test calls is tree-shaken from the bundle and does not count, so review what each spec leaves out.
- **Stories** (`pnpm nx run storybook:test`): every story is a Vitest test in Chromium through `@storybook/addon-vitest`. It fails on an error, a failing `play` function or any axe violation.
- **Node-side code** (tools, token scripts) uses `node:test` (ADR 0015).
- **Browser suites** (ADR 0010, 0027) run only in the pinned Playwright image, linux/amd64, which `tools/visual/src/image.ts` names by digest. `container.ts` starts it with Docker, mounts the workspace, cuts the network and runs Playwright; inside the image (CI) it runs Playwright directly. Both Playwright configs refuse to start anywhere else. The host builds the site first (Nx `dependsOn`); `serve.ts` serves it in the container. The fixed environment (`environment.ts`: scale 1, `en-US`, Asia/Tashkent, reduced motion, a fixed date, the kit-font assertion) is shared through `@avelune/visual`.
  - **Visual** (`pnpm nx run visual:e2e`, or `pnpm visual`): every story in `index.json`, light and dark at 1280 and 390 px. Stories tagged `forced-colors` run once more in the `forced-colors` project (light, 1280 px, forced colours active) against `<story id>/forced-colors.png`, their play function included; axe is skipped there (ADR 0030). On one load of the story (ADR 0027, addendum), the screenshot must equal `tools/visual/baselines/<story id>/<project>.png` to the pixel, and axe (the Storybook gate's rules) must find nothing; each is a soft assertion, so both are reported. A story that errors, logs an error or renders in a fallback font fails; so do a missing baseline and a baseline without a story. `pnpm visual:update` rewrites changed and missing baselines: open every changed image and explain it in the merge request (non-negotiable 10). Arguments go to Playwright: `pnpm visual --grep=colour`. Every docs page in `index.json` is opened in light and dark at 1280 px: it must render cleanly, its stories included, and axe must find nothing in `#storybook-docs` (ADR 0034, addendum); docs pages have no baselines. The HTML report is written to `dist/tools/visual/report`.
  - **Showcase** (`pnpm nx run invariants:e2e`): every screen linked from `/`, in the same four projects: axe with every rule, no horizontal scroll at 320 px, every font preload a face the screen uses and fetched once, every animation on a duration and an easing token (`linear` only on a loop), nothing translated or scaled under reduced motion. Controls of one size (`button[aveButton]`, `a[aveButton]`, the icon buttons, `input[aveInput]`) must share height, radius, border width and font size, and those with a text label the inline padding (`controls.ts`, since Wave 1). The overlay invariants and `animate.leave` join with the overlays (Wave 3).
- **Size** (`pnpm nx run ui:size`, `pnpm nx run icons:size`): see "Build" and "Icons".
- `tools/test-check` proves the gates with fixtures. Its `test` target runs alone (`parallelism: false`): it starts `ui:test:coverage-gap`, which shares `coverage/ui` with `ui:test`.
  - `test`: a coverage gap and an orphan file (`ui:test:coverage-gap`); a fixture Storybook with an unnamed button and a failing `play` function; an entry point over its size budget and one without a budget; an API report that is stale and an export without a release tag (`api-report.mjs --package --build` on `fixtures/api-report`); both browser-suite configs refusing to start on the host.
  - `e2e` (Docker): the visual suite on a fixture Storybook with one broken story per check (and a tagged clean story in the `forced-colors` project), and the showcase suite on a static site with one violation per page. Clean controls must pass, and the control's motion must actually have been recorded.

## Fonts

The kit's typefaces are IBM Plex Sans, shipped as **"Avelune Sans"**, and IBM Plex Mono for code, shipped as **"Avelune Mono"** (ADR 0018 and its addendum): `tools/fonts` subsets the pinned sources (`tools/fonts/source`) into `packages/ui/styles/fonts/avelune-{sans,mono}-{latin,latin-ext,cyrillic}.woff2` (sans variable, weights 400–600; mono Regular), renames them as the OFL requires, maps ʻ ʼ to Plex Sans' ‘ ’ glyphs, and writes `fonts.css` with the `@font-face` rules and metric-matched fallback faces (Arial per weight, Courier New for mono). The outputs are committed; `pnpm nx run fonts:check` rebuilds them in memory and fails on any difference, on a character a locale needs but the files lack, and on a leftover Reserved Font Name. `styles.css` imports `fonts.css`, and the package exports the files as `@avelune/ui/fonts/*`.

## Enforcement map

What is checked, by which tool, at which stage, and what proves that the check fails on a violation (brief §5). The CI column waits for a GitLab remote: the pipeline of brief §5.6 is deferred until one exists (product owner, 2026-09-24), so every gate runs locally through its Nx target.

| Rule | Tool | Pre-commit | CI |
|---|---|---|---|
| Project layers, no relative cross-project imports | `@nx/enforce-module-boundaries` (ESLint), proven by `lint-rules:test` | staged files | deferred |
| Entry-point layers, public specifiers, harnesses out of runtime code; JSDoc on public API; no appearance inputs (`packages/ui`) | `avelune/*` rules (ESLint), proven by `lint-rules:test` | staged files | deferred |
| Every `<ave-icon>` has a label or is decorative, not both | `avelune/icon-label` (ESLint, every template), proven by `lint-rules:test`; `AveIcon` throws in development, proven by `ui:test` | staged files | deferred |
| The icon data is every icon `lucide-static` generates, within Lucide's shapes and fills | `icons:generate`, proven by `icons:test` | no | deferred |
| One Lucide icon costs one icon in a bundle; the whole set stays within its budget | `icons:size` (size-limit with `import`, ADR 0036) | no | deferred |
| An application's SVG holds no script, style sheet, handler, embedded content or outside reference | `defineAveIcon`'s parser, proven by `ui:test` (`svg.spec.ts`) | no | deferred |
| Type-aware TS rules (`strictTypeChecked`), angular-eslint TS, template and a11y rules, `ave` prefix, signal API, `host` object, emulated encapsulation, no inline styles, banned imports (`@angular/animations`, `@angular/material`, deep `@avelune/ui`), described disables; raw native elements in consumer templates | ESLint (ADR 0023), a fixture per rule group in `lint-rules:test`; every rule an error, `--max-warnings=0` | staged files | deferred |
| TS strictness, template types | `ngc --noEmit` (`typecheck` targets) | affected projects | deferred |
| No tsconfig weakens the required strictness (ADR 0022) | `compiler-check:check`, proven by `compiler-check:test` (a fixture per option and per extended diagnostic) | a staged tsconfig | deferred |
| Token-only CSS values, no unknown tokens, specificity cap, no `::ng-deep`/`!important`/ids, motion longhands, `@keyframes` only in `motion.css`, logical properties (exceptions derived from browser data), query widths equal tokens, `@layer components`, same-element nesting | Stylelint (ADR 0024), a fixture per rule in `lint-rules:test` | staged `.css` | deferred |
| One focus ring (`outline*` only in `focus.css`, never transitioned, no `:focus`); the global files in `reset`/`base`/`utilities`; `styles.css` starts with the layer order | Stylelint (ADR 0030), fixtures in `lint-rules:test` | staged `.css` | deferred |
| The global stylesheet renders: typography roles, canvas and text colours, theme islands, the figures utility, the ring outside, inset and in forced colours | the "Global styles" story's `play` function, in `storybook:test` and in the visual suite's four projects plus `forced-colors` | no | deferred |
| Every motion class runs its keyframes on its tokens, reaches its pose, and leaves the DOM after `animate.leave`, in full and reduced motion; loops and the route cross-fade on tokens | the "Motion catalog" story's `play` function (ADR 0031), in `storybook:test` and the visual suite | no | deferred |
| `linear` easing only in `motion.css` | Stylelint override (ADR 0031), fixtures in `lint-rules:test` | staged `.css` | deferred |
| Coverage ≥ 90% per file in `packages/ui`, tests in a real browser | `ui:test` (Vitest browser mode), proven by `test-check:test` | no | deferred |
| Every story renders, passes its `play` function and has no axe violation | `storybook:test` (addon-vitest, a11y `error`), proven by `test-check:test` | no | deferred |
| Every story × light/dark × 1280/390, and every story tagged `forced-colors` in forced colours, equals its committed baseline, in the kit's fonts, without errors; no baseline without a story; axe clean (independent sweep); every docs page in light and dark renders without errors and is axe clean | `visual:e2e` in the pinned container (ADR 0010, 0027, 0030), proven by `test-check:e2e` | no | deferred |
| Every showcase screen: axe clean, no horizontal scroll at 320 px, font preloads used and fetched once, motion on tokens only (`linear` only on loops), no movement under reduced motion, same-size controls share their box | `invariants:e2e` in the pinned container (ADR 0027, 0030), proven by `test-check:e2e` | no | deferred |
| Browser suites run only in the pinned image on amd64; the image's Playwright version equals the installed one | Playwright configs (`requireContainer`), proven by `test-check:test`; `visual:test` | no | deferred |
| Every entry point within the size budget its `entry.json` declares | `ui:size` (size-limit, ADR 0028), proven by `test-check:test` | no | deferred |
| Formatting | Prettier (`.md` excluded), proven by `repo-check:test` | staged files | deferred |
| Conventional commits, scope = Nx project or `repo`, `deps`, `docs`, `ci`, `release` | commitlint, proven by `repo-check:test` | commit message | n/a |
| Public API unchanged or report updated; release tags present | API Extractor (`ui:api-report`), proven by `test-check:test` | no | deferred |
| No dependency younger than 16 h (ADR 0042); install scripts only where listed | pnpm (`minimumReleaseAge`, `allowBuilds`), effective settings pinned by `repo-check:test` | `pnpm install` | `pnpm install` |
| Every Nx project has exactly one constrained layer or type tag; `.browserslistrc` is the higher of the CSS-feature floor and Angular's supported set (ADR 0014) | `repo-check:check`, proven by `repo-check:test` | no | deferred |
| `ng add` runs, `ng update` finds its migration collection, the package group lists every package | `ui:test-schematics` | no | deferred |
| Colour primitives are exactly what the config generates (no hand edits) | `tokens:colors` | no | deferred |
| Shipped fonts equal a fresh build; every character of uz-Latn, uz-Cyrl, ru and en (incl. Intl output) covered; no Reserved Font Name; axes and checksums | `fonts:check`, proven by `fonts:test` | no | deferred |
| DTCG schema, references, naming, tier direction and literals, line-height grid, theme parity, contrast pairs in both themes, no primitives in `dist/tokens.css` | `tokens-check:check`, proven by `tokens-check:test` (a fixture per rule) | no | deferred |
| Palette rules: ladder contracts, exact lightness and hue, brand lightness, neutral tint | `generatePalette` (`tokens:colors`), proven by `tokens:test` | no | deferred |

Hooks are a fast local gate and are never bypassed (`--no-verify` is not used). CI runs the same checks on the whole affected graph.
