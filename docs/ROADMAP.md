# Avelune roadmap

This file is both the plan and the progress tracker. A fresh session resumes from here: read [AGENTS.md](../AGENTS.md), find the first unchecked item below that is not marked **Deferred**, then read the matching sections of the original brief ([BRIEF.md](BRIEF.md)) and the ADRs that touch that area.

**Current position:** Phase 5, Wave 1 built on 2026-09-24 (ADR 0037–0041): Button, IconButton, Input, FormField, Checkbox and the forms foundation, all `experimental`, and the showcase contract form with the same-size invariant. Open before the Wave 1 STOP: the visual baselines of the new stories, a run of `visual:e2e` (with the new docs sweep), `invariants:e2e` and `test-check:e2e`, all blocked while Docker Desktop is down (2026-09-24); then each component to beta, Icon too, and the STOP with the showcase form in light, dark and compact. Phase 3 is done except the CI, changesets and CODEOWNERS item, which is deferred until a GitLab remote exists (product owner, 2026-09-24). The Angular 22.2 upgrade is allowed from 2026-09-24 21:37 UTC ("Tracked upgrades") and is independent of the Vitest item: Vitest 5 stays blocked by `@storybook/addon-vitest` 10.6 (peers `^3 || ^4`), re-checked 2026-09-24.

## Parameters

Resolved in Phase 0 (2026-09-23). Change them only through the product owner; record the change here with a date.

| Parameter | Value |
|---|---|
| Kit name | Avelune |
| npm scope | `@avelune` |
| Selector prefix | `ave` (`button[aveButton]`, `<ave-form-field>`) |
| CSS variable prefix | `--ave-` (ADR 0003) |
| Consumers | internal work systems (product names not given yet) |
| Brand accent | Ubuntu orange `#E95420`, kept exact as `color.brand.mark`; the accent fill is orange 600 `#b53700` with white text in light and orange 400 with dark text in dark (ADR 0011, 0021; product owner, 2026-09-23); one accent, no separate "suggested action" colour |
| Font | IBM Plex Sans (coverage verified, [compatibility.md](compatibility.md) §4); shipped as "Avelune Sans" for the OFL Reserved Font Name (ADR 0018). Code: IBM Plex Mono as "Avelune Mono" (product owner, 2026-09-23) |
| Icons | Lucide, outline (ADR 0020; choice delegated to the agent by the product owner, 2026-09-23) |
| Base text | 14/20 (dense work UI) |
| Themes | light, dark |
| Density | comfortable (default), compact |
| Locales | uz-Latn, uz-Cyrl, ru, en |
| Docs language | English |
| Registry | none yet (publish job disabled) |
| Licence | `UNLICENSED` (proprietary, internal), for now; revisit before the first publish (product owner, 2026-09-23) |
| Browsers | `Chrome >= 119, Edge >= 119, Firefox >= 129, Safari >= 17.5, iOS >= 17.5` (ADR 0014; changed 2026-09-23 from Chrome/Edge 117, product owner) |
| Design source | none; visual direction "inspired by Ubuntu" ([audit.md](audit.md)) |
| Existing repos | none |
| CI | local only for now; `.gitlab-ci.yml` prepared; GitLab edition unknown, so code-owner approval is a documented rule |
| CI runner architecture | amd64 (ADR 0010) |

## Phases

### Phase 0: Preflight and discovery
- [x] Environment doctor ([compatibility.md](compatibility.md) §1)
- [x] Compatibility matrix ([compatibility.md](compatibility.md) §2–3)
- [x] Design-source reference study: Yaru + libadwaita ([audit.md](audit.md) §2)
- [x] Consumer audit: n/a, no repos ([audit.md](audit.md) §1)
- [x] ADRs 0001–0013 written (status Proposed)
- [x] ROADMAP skeleton
- [x] Product-owner go-ahead; ADRs set to Accepted (2026-09-23)

### Phase 1: Workspace
- [x] `git init`; Nx 23.2.1 + pnpm 11.27.1 workspace; verify `nx graph`, `affected` and pruning (ADR 0012, addendum)
- [x] Layout per brief §3; Nx layer tags + `@nx/enforce-module-boundaries` (proven on three violations; permanent fixtures in Phase 3)
- [x] `@avelune/ui` library with a sample entry point + `testing` entry point; `entry.json` layer manifest
- [x] `ng add` / `ng update` schematics collections (empty migrations)
- [x] lefthook pre-commit (lint + type-check on staged files, plus Prettier); commitlint (conventional, Nx-project scopes)
- [x] API Extractor spike on TS 6 output; result appended to ADR 0007 (primary path holds; `ui:api-report` target)
- [x] Full `AGENTS.md`, `CLAUDE.md`, README, CONTRIBUTING skeleton, `docs/ARCHITECTURE.md` (Phase 1 sections)
- [x] Angular agent skill (`angular-developer`) vendored in `.claude/skills/` + Angular CLI MCP in `.mcp.json` (product owner approved the write, 2026-09-23)

### Phase 2: Tokens
- [x] Colour generation script (OKLCH, colorjs.io) and primitive scales (ADR 0011, addendum; scripts in TS per ADR 0015)
- [x] Semantic light + dark, density compact, motion, component sources (DTCG 2025.10; files and tier rules in ADR 0016)
- [x] Style Dictionary 5 build → `tokens.css`, `tokens.ts` (`TokenName` union) (ADR 0017)
- [x] `tools/tokens-check`: schema, references, naming, tier direction, contrast pairs, dark parity, no primitives in output; with failing fixtures (25 fixtures, one per violation)
- [x] Fonts: cmap check on the shipped woff2 subsets; self-hosted IBM Plex Sans; metric-tuned fallback `@font-face` (`tools/fonts`, ADR 0018: shipped as "Avelune Sans")
- [x] Foundations stories: palette + contrast, type specimen (ru, uz-Latn with Oʻ/Gʻ, uz-Cyrl), spacing, radius, elevation, z-index, motion playground (Storybook set up early, ADR 0008 addendum; axe-clean in both themes, both motion modes, at 320, 390 and 1280 px)
- [x] **STOP:** Foundations screenshots (light, dark) → approve palette, accent, typography and motion values. Approved 2026-09-23 ([review page](https://claude.ai/artifact/1LHWb4xFKZUsVCE3WwjJPN), private to the product owner): accent fill first set to the exact `#E95420` with dark text (ADR 0019), then returned by the product owner to orange 600 with white text (ADR 0021); one orange accent; typography approved; code font IBM Plex Mono; icons delegated → Lucide (ADR 0020). Presented without objection: dark fills lighter on hover and press, ʻ ʼ drawn with ‘ ’, motion values of brief §6.2 unchanged (now frozen, ADR 0005), the token additions of ADR 0016, radii 4/8/12/full and control heights 32/36/40 (compact 28/32/36).

### Phase 3: Guardrails (before any component)

The carry-overs from Phases 1 and 2 are done, except wiring the targets into CI, which moved into the deferred item below. (Phase 1: the `ng-add` and migration-collection test, the `ui:api-report` fixtures, the project-tag check and the browser-floor check, ADR 0029. Phase 2: the `linear()` normalisation, ADR 0027.)

- [x] TS + Angular compiler strictness (brief §5.1). ADR 0022 adds `exactOptionalPropertyTypes`, `allowUnreachableCode: false` and `strictStandalone`, and sets `typeCheckHostBindings` explicitly. `compiler-check:check` fails on any tsconfig that weakens an option. `compiler-check:test` proves every option and every one of the compiler's 18 extended diagnostics with a violation fixture (46 fixtures), plus a clean control fixture and 10 weakened-config fixtures.
- [x] ESLint config + custom rules (`avelune/entry-point-layers`, raw-element template rule), with failing fixtures (ADR 0023). typescript-eslint `strictTypeChecked` plus angular-eslint TS, template and a11y rules; every rule an error; `--max-warnings=0`. The `avelune` plugin has four rules: `entry-point-layers`, `public-api-jsdoc` (the JSDoc rule carried over from Phase 1), `no-appearance-inputs` and `no-raw-elements`, the last for consumers; the showcase is linted as one. `lint-rules:test` covers each rule with RuleTester and runs 24 workspace fixtures through the real config, among them the three carried-over module-boundary violations, the `@angular/animations` ban and the Foundations `[style.*]` exception.
- [x] Stylelint config (brief §5.3, ADR 0009), with failing fixtures; CSS nesting × emulated encapsulation fixture (ADR 0005). Done in ADR 0024:
  - Token-only values: no raw colours, easings, or length or time units, also inside `calc()`; strict values as the brief lists them; unknown `--ave-*` names are errors.
  - Motion longhands only; `@keyframes` only in `motion.css`.
  - Logical properties, with the few exceptions derived from MDN browser-compat-data at the floor.
  - Three `avelune` rules: query widths equal tokens (the Phase 2 carry-over), `@layer components` in kit CSS, and same-element nesting only. The shim fixture showed that the emulated shim leaves nested selectors unscoped.
  - Component styles live in `.css` files (ESLint bans `styles:`); the Foundations pages moved theirs.
  - `lint-rules:test` covers it: 34 Stylelint fixtures through the real config, rule unit tests, the derived exceptions and the shim characterisation.
- [x] Vitest browser mode + coverage thresholds; Storybook angular-vite (running since Phase 2) + addon-vitest + a11y `error`. Done in ADR 0025 and 0026:
  - The static-build defect is fixed: Analog's optimizer dropped `@angular/compiler` under `jit: false`, so Storybook now runs JIT and ngc type-checks the stories.
  - `ui:test` runs `@angular/build:unit-test` in headless Chromium with 90% per-file thresholds, and the first harness spec covers the sample 100%.
  - `storybook:test` runs every story with `play` and axe as errors.
  - `test-check:test` proves that a coverage gap, an orphan file, an axe violation and a failing `play` each fail.
  - Known limit: an exported function that no test calls is tree-shaken and not counted (ADR 0026).
- [x] Playwright visual in pinned amd64 Docker; axe sweep; invariants skeleton; size-limit. Done in ADR 0027 and 0028:
  - The pinned image was pulled on 2026-09-24 with the product owner's consent. `container.ts` runs every browser suite in it (linux/amd64, no network, the workspace mounted); the configs refuse to start anywhere else.
  - `visual:e2e` (`pnpm visual`): every story × light/dark × 1280/390 against committed baselines (24 Foundations images, inspected; a second run matched to the pixel), the kit-font assertion, no rendering or console errors, orphan baselines, and the axe sweep with the Storybook gate's rules.
  - `invariants:e2e`: axe on every showcase screen, no horizontal scroll at 320 px, motion on tokens only (with `linear()` normalised), nothing moves under reduced motion. The showcase now bundles the tokens and fonts.
  - `ui:size`: a budget in each `entry.json`; the sample is 758 B of 900 B.
  - `test-check` proves each failure mode: host refusal and size in `test`; a fixture Storybook (6 stories, an orphan baseline) and a fixture site (4 violation pages, a control) in `e2e`.
- [ ] **Deferred** until a GitLab remote exists (product owner, 2026-09-24): changesets and the per-merge-request changeset check; the `.gitlab-ci.yml` stages (brief §5.6); CODEOWNERS and the review rule in CONTRIBUTING. The API reports themselves run locally and are proven (next item). When this is picked up:
  - wire every gate into CI: `lint`, `typecheck`, `stylelint`, `test`, `tokens:colors`, `tokens-check:check`, `fonts:check`, `compiler-check:check`, `repo-check:check`, `ui:api-report`, `ui:size`, `ui:test-schematics`;
  - the visual job runs in the digest of `tools/visual/src/image.ts`, sets `AVELUNE_PLAYWRIGHT_IMAGE` to it, takes the Storybook and showcase builds from earlier stages, and runs `visual:e2e`, `invariants:e2e` and `test-check:e2e`;
  - add a check that fails when `.gitlab-ci.yml` names another image or leaves a gate target out;
  - before the first publish: make `@avelune/tokens` public and replace the `workspace:*` dependency of `@avelune/ui` with the fixed version (ADR 0030).
  Blocked on the open questions below: the registry and the GitLab edition.
- [x] Every guardrail proven to fail on a violation. Done in ADR 0029. The enforcement map in ARCHITECTURE.md names the proof of every row:
  - `repo-check:check` covers the Phase 1 carry-overs: every project has exactly one constrained tag, and `.browserslistrc` equals the higher of the CSS-feature floor (browser-compat-data) and Angular's supported set.
  - `repo-check:test` proves both with fixtures, and proves commitlint, the Prettier config and pnpm's effective dependency policy.
  - `test-check:test` proves `ui:api-report` on a stale report and an untagged export.
  - `ui:test-schematics` loads `ng add` and the empty migration collection from the built package.

### Phase 4: Foundations and motion
- [x] `@avelune/ui/styles.css`: layers, reset, base typography, focus ring, forced-colors, `tabular-nums` utility; imports `styles/fonts/fonts.css` and `@avelune/tokens/tokens.css`; the showcase preloads `avelune-sans-latin.woff2`. Done in ADR 0030:
  - Files: `styles.css` declares the layer order, then imports the tokens, the fonts, `reset.css`, `base.css`, `focus.css` and `utilities.css`, each in its own layer.
  - The package exports `@avelune/ui/styles.css` and `@avelune/ui/fonts/*` and depends on `@avelune/tokens`. The showcase and Storybook load the stylesheet through their bundlers, as a consumer does.
  - The showcase preloads the Latin face: media names are unhashed and critical-CSS inlining is off. The inliner had dropped the dark theme from the first paint.
  - Checks, each proven by fixtures:
    - Stylelint: `avelune/layer-order`; `avelune/component-layer` for the global files; the focus ring's properties only in `focus.css`, never transitioned, and no `:focus`.
    - The Foundations page "Global styles", whose `play` function asserts the computed styles.
    - A `forced-colors` project in the visual suite for stories tagged `forced-colors`.
    - An invariant that every font preload is used and fetched once.
  - The Foundations baselines changed (border-box sizing, `text-wrap: pretty`); every diff was inspected (ADR 0030, "Consequences").
- [x] `motion.css` with `ave-motion-*` classes; reduced-motion overrides via tokens. Done in ADR 0031:
  - Enter and exit classes for popovers, tooltips, dialogs, backdrops and toasts, for `animate.enter` and `animate.leave`; the shimmer and spin loops; the route cross-fade. All in the `utilities` layer, on tokens.
  - Reduced motion gains one override: the shimmer period is 0, so the skeleton is static.
  - `linear` is allowed only on loops: Stylelint allows it in `motion.css`, and the invariants accept it only on an animation that repeats forever.
  - The Foundations page "Motion catalog" checks every class in both modes with its `play` function, and mutations of the CSS fail it.
  - Deferred to their components: the drawer's slide under reduced motion, the list item's expand, shared-element view transitions, and top-layer overlays.
- [x] `provideAvelune()` (brief's `provideUi`), `AveTheme` service (theme, density, motion signals; persisted). Done in ADR 0032:
  - `@avelune/ui/theme` (foundations) holds both. Signals `theme`, `density` and `motion`; setters write the `data-*` attribute and `localStorage` at once, and another tab's choice is followed.
  - Every storage failure is caught; on the server the attributes are written and storage is left alone. Covered in Chromium, 1.33 kB of a 1.5 kB budget. The showcase calls `provideAvelune()`.
  - Open for Phase 6: the inline `index.html` script that applies a stored choice before the first paint (`ng add`).
- [x] Icons package with a generated `IconName` union; `<ave-icon>` (Lucide from `lucide-static`, stroke width tuned and frozen, ADR 0020). Done in ADR 0033:
  - `@avelune/icons`: 52 Lucide icons (`lucide-static` 1.47.0) generated into typed data with `IconName`; `icons:generate` checks, and rejects any shape `<ave-icon>` does not draw.
  - `<ave-icon>`: sizes 16/20/24 (`sm` by default); strokes frozen at 1.5/1.5/1.75px after a comparison with Plex. It needs `label` or `decorative`: the new ESLint rule `avelune/icon-label` checks templates, and the component throws in development.
  - Delivered with its harness, unit tests in Chromium, a docs page, six stories with `play` functions and baselines in both themes, both viewports and forced colours. 3.33 kB of a 3.7 kB budget.
  - The kit resolves `@avelune/icons` and `@avelune/tokens` through `node_modules`, and Nx builds both first.
- [x] Delete the `packages/ui/sample` scaffolding entry point and its API reports once the first real entry point exists. Done on 2026-09-24: the lint fixtures that linted as the sample now lint as `packages/ui/icon`, and the showcase shows an icon instead.

### Phase 5: Components
Waves and status: see the tables below.

### Phase 6: Consumer integration
- [ ] `ng add @avelune/ui` (peers, styles, fonts, provider, lint configs, AGENTS snippet); build and publish `@avelune/eslint-config` with `tools/lint-rules` bundled (ADR 0023). It also sets `inlineCritical: false`, `outputHashing: bundles` and the font preload (ADR 0030), and the inline script that applies a stored theme before the first paint (ADR 0032)
- [ ] `tools/adoption-metrics` (JSON + CI summary)
- [ ] `docs/consumers/migration.md`, `docs/consumers/AGENTS.snippet.md`
- [ ] Pilot in the showcase as a consumer; then one real consumer when access is given

### Phase 7: Final audit
- [ ] Clean-clone full pipeline; `docs/audit-final.md`; skeptical-designer review of every story

## Component waves

| Wave | Components | Gate |
|---|---|---|
| 1 Calibration | Icon, Button, IconButton, Input, FormField, Checkbox | **STOP:** showcase form in light, dark and compact for approval |
| 2 Forms | Textarea, RadioGroup, Switch, Select, Combobox/Autocomplete, Multiselect, DatePicker, DateRangePicker, FileUpload, Slider (if needed) | STOP + summary |
| 3 Overlays & feedback | Dialog, ConfirmDialog, Drawer, Popover, Tooltip, Menu, Toast, Alert, Banner, Progress, Spinner, Skeleton, EmptyState | STOP + summary |
| 4 Navigation | Tabs, Breadcrumbs, Pagination, SidebarNav, Menubar, Toolbar, Stepper, Link | STOP + summary |
| 5 Data | Badge, Tag, Avatar, Card, Accordion, Tree, List, DataTable (ADR first: CDK Table + virtual scroll vs Aria Grid) | STOP + summary |
| 6 Patterns | ListPage, ListDetail, FormPage, Dashboard, FilterPanel, SearchHeader, SettingsPage | STOP + summary |

## Component status

| Component | Wave | Layer | Status | Owner | Notes |
|---|---|---|---|---|---|
| Icon | 1 | foundations | experimental | | `@avelune/ui/icon` (ADR 0033, 0036): every Lucide icon through `provideAveIcons`, custom SVG through `defineAveIcon`, the "Check your icon" guide; in the showcase shell; beta at the Wave 1 gate, with a realistic composition |
| Button | 1 | components | experimental | | `@avelune/ui/button` (ADR 0037): `button[aveButton]`, `a[aveButton]`; primary, secondary (bordered, product owner 2026-09-24), ghost, danger; `disabledInteractive`; a loading spinner after 300ms, kept 500ms; 2.42 kB of 2.7 kB; beta after its baselines and the showcase form |
| IconButton | 1 | components | experimental | | `@avelune/ui/button` (ADR 0038): `button[aveIconButton]`, `a[aveIconButton]`, extends Button; `icon` and `label` required; square of the control height; beta with Button |
| Input | 1 | components | experimental | | `@avelune/ui/input` (ADR 0039): `input[aveInput]` for text types; Signal Forms and Reactive Forms through their native accessors, state from `@avelune/ui/forms`; `border.strong` (product owner, 2026-09-24); invalid, readonly (dashed), disabled (flat); 1.25 kB of 1.4 kB |
| FormField | 1 | composites | experimental | | `@avelune/ui/form-field` (ADR 0040): `<ave-form-field label>`, `[aveHint]`, `[aveError]`; the error once invalid and touched; asterisk for required (product owner, 2026-09-24) |
| Checkbox | 1 | components | experimental | | `@avelune/ui/checkbox` (ADR 0041): `input[type=checkbox][aveCheckbox]` in `label[aveChoice]`; `indeterminate` model; `requiredTrue` recognised; check Firefox and WebKit before stable |
| Textarea | 2 | components | planned | | |
| RadioGroup | 2 | components | planned | | ≤ 5 options rule (GUIDELINES) |
| Switch | 2 | components | planned | | spring easing |
| Select | 2 | composites | planned | | Aria Combobox + Listbox |
| Combobox / Autocomplete | 2 | composites | planned | | Aria Combobox + Listbox |
| Multiselect | 2 | composites | planned | | Aria Combobox + Listbox (multi) |
| DatePicker | 2 | composites | planned | | locale-aware; uz/ru first day of week |
| DateRangePicker | 2 | composites | planned | | |
| FileUpload | 2 | composites | planned | | |
| Slider | 2 | components | planned | | only if needed |
| Dialog | 3 | composites | planned | | native `<dialog>` or CDK Dialog (ADR in wave); `ave-motion-dialog-*` and `-backdrop-*` or `@starting-style` (ADR 0031) |
| ConfirmDialog | 3 | composites | planned | | names the action |
| Drawer | 3 | composites | planned | | slide 100% from its edge; decide how it stops moving under reduced motion, maybe a token (product owner, ADR 0005, 0031) |
| Popover | 3 | composites | planned | | |
| Tooltip | 3 | components | planned | | 500ms show delay |
| Menu | 3 | composites | planned | | Aria Menu |
| Toast | 3 | composites | planned | | queue, pause on hover/focus, live region |
| Alert | 3 | components | planned | | |
| Banner | 3 | components | planned | | |
| Progress | 3 | components | planned | | |
| Spinner | 3 | components | planned | | 300ms show delay, ≥ 500ms visible |
| Skeleton | 3 | components | planned | | `ave-motion-shimmer`, static under reduced motion (ADR 0031); in dark, `bg.surface-sunken` equals the canvas, so the fill needs another role |
| EmptyState | 3 | composites | planned | | |
| Tabs | 4 | composites | planned | | Aria Tabs |
| Breadcrumbs | 4 | components | planned | | |
| Pagination | 4 | composites | planned | | |
| SidebarNav | 4 | composites | planned | | |
| Menubar | 4 | composites | planned | | Aria MenuBar |
| Toolbar | 4 | composites | planned | | Aria Toolbar |
| Stepper | 4 | composites | planned | | |
| Link | 4 | components | planned | | `a[aveLink]` |
| Badge | 5 | components | planned | | |
| Tag | 5 | components | planned | | |
| Avatar | 5 | components | planned | | |
| Card | 5 | components | planned | | |
| Accordion | 5 | composites | planned | | Aria Accordion |
| Tree | 5 | composites | planned | | Aria Tree |
| List | 5 | composites | planned | | item add and remove: fade and expand, stagger ≤ 5 × 30ms; the expand is not a transform (ADR 0031) |
| DataTable | 5 | composites | planned | | ADR first |

## Status transitions

| Status | Entry criteria |
|---|---|
| planned | Listed here; for anything not in the waves, an accepted RFC (CONTRIBUTING.md) |
| experimental | Code merged; release tag `@alpha` (API Extractor has no `@experimental`, ADR 0007); stories exist; may change in any release; not for production screens |
| beta | Full definition of done (brief §9.3) met; release tag `@beta`; used in the showcase; API changes still allowed with changeset + migration |
| stable | Beta criteria + release tag `@public` + manual a11y checklist passed (keyboard-only; NVDA + Firefox and Chrome; VoiceOver + Safari; 200% and 400% zoom; forced colours) + **no API change for one minor release** |
| deprecated | `@deprecated` with named replacement; one dev-mode console warning; replacement documented; removed only in the next major, always with an `ng update` migration |

## Versioning and releases

- **0.x** until the 1.0 criteria are met. 1.0 criteria: Waves 1 and 2 stable; pilot adoption in at least one consumer; release pipeline publishing to the registry.
- **One fixed version** across `@avelune/*` packages (ADR 0007).
- **Cadence in 0.x:** a minor at the end of each wave, patches as needed.
- **Cadence after 1.0:** a minor every 4 weeks, patches as needed, and majors at most twice a year, aligned with Angular majors.
- **Deprecation:** see "deprecated" above. Nothing is removed without a migration.

## Adoption plan

Consumers: internal work systems (names pending). For each consumer, when it onboards:

1. Baseline scan with `tools/adoption-metrics`; results recorded in `docs/audit.md`.
2. `ng add @avelune/ui`; install the shared ESLint/Stylelint configs as warnings on legacy paths and errors on new paths.
3. New screens: kit only. Old screens: migrated when touched.
4. Metrics tracked per release; raw values and kit-version lag must trend down.

## Tracked risks

| Risk | Mitigation | ADR |
|---|---|---|
| `@storybook/angular-vite` is preview | independent Playwright axe sweep; known webpack fallback | 0008 |
| API Extractor bundles TS 5.9 | Phase 1 spike; d.ts-golden fallback | 0007 |
| Style Dictionary DTCG duration WIP | custom transform, pinned by test | 0003 |
| `stylelint-plugin-logical-css` has one maintainer | the fixtures in `tools/lint-rules/fixtures/stylelint` and `logical.spec.ts` make a swap to `stylelint-use-logical` safe | 0009, 0024 |
| amd64 emulation slows local visual runs (1.2 min for 49 story tests on 2026-09-24) | filtered (`pnpm visual --grep=…`) and cached runs; Docker targets never run in parallel | 0010, 0027 |
| Baseline PNGs grow the git history (6.9 MB for the Foundations pages alone, 2026-09-24) | every update reviewed; move `tools/visual/baselines` to Git LFS before the history passes 200 MB (ADR needed) | 0027 |
| Chromium's Intl formats `uz`/`uz-Latn` with root patterns (`UZS 1,234,567.80`, `2026 M09 23`); `uz-Cyrl` dates are right but currency is `UZS`, not `сўм` (observed in Chromium 153, 2026-09-23; Node's full ICU is right) | check Chrome, Edge, Firefox and Safari before Wave 2; if confirmed, the kit ships its own uz formatting data for dates and numbers (ADR in Wave 2, before DatePicker) | none yet |
| Storybook's dev server exits when a story file fails to index, and can keep serving a stale index: a server started before a story was added showed "Invalid value passed to the 'of' prop" on the Icon docs page (2026-09-24) | restart the dev server after adding, renaming or removing a story, and after changing `.storybook/main.ts`; the visual suite and CI use the static build | 0008 |
| `@storybook/angular-vite` is patched (a docs-page bootstrap race) | pinned to 10.6.0; `pnpm install` fails if the patch stops applying; upstream issue to file | 0035 |
| Docs pages were outside every automated check; the unreadable dark Icon page (2026-09-24) was found by eye | since 2026-09-24 the visual suite renders every docs page in both themes and runs axe on it, failing on errors too (ADR 0034, addendum); layout and overflow on docs pages are still checked by eye only | 0027, 0034 |
| `@angular-eslint/eslint-plugin` 22.5.0 crashes `reactive-context-must-read-signal` on a call named like an `Object.prototype` method (a destructured `valueOf` in a Signal Forms rule): it looks names up in a plain object (2026-09-24) | already reported upstream ([angular-eslint#3198](https://github.com/angular-eslint/angular-eslint/issues/3198)) and fixed ([#3201](https://github.com/angular-eslint/angular-eslint/pull/3201), merged 2026-09-17), in 22.5.1 alphas only; until a stable release has it, write `context.valueOf(…)` (the specs say why) | 0023 |
| The visual baselines show rest, focus, disabled and loading states; hover and press need a real pointer, which a story's `play` function does not have | hover and press checked by script in each component's visual review; a hover pass in the visual suite if a regression slips through | 0027 |
| iOS Safari 17–18.2 implements `popover` without light dismiss (browser-compat-data 8.1.2; WebKit bug 267688), and the floor is iOS 17.5 | Wave 3: Popover and Menu close on an outside tap on iOS too, through CDK or Angular Aria behaviour where they provide it; otherwise raise the iOS floor to 18.3 (product owner, ADR 0014) | 0014, 0029 |

## Tracked upgrades

| Upgrade | Trigger |
|---|---|
| Angular 22.2.0 (framework, `@angular/build`, `@angular/cli`, devkit), `@angular/cdk` + `@angular/aria` 22.2.0, `ng-packagr` 22.2.x, `prettier` 3.9.9, `@microsoft/api-extractor` 7.59.2 | Angular 22.2.0 is stable (published 2026-09-23; `@angular/build`/`cli` at 21:37 UTC). Under the 24-hour rule (ADR 0012) the last of these is allowed from **2026-09-24 21:37 UTC**. Do all of them in one merge request, check the peer ranges, update compatibility.md, re-run `compiler-check:test` (new extended diagnostics need fixtures) and `lint-rules:test`, then re-evaluate Vitest 5 (ADR 0013) |
| `lucide-static` 1.48.0 | Allowed from **2026-09-25 05:57 UTC** (ADR 0012). Run `pnpm nx run icons:generate --update`, review the diff of `src/*.ts`, the Gallery baselines and `icons:size`, update compatibility.md |
| Vitest 5 | Angular 22.2 + Storybook addon-vitest + `@nx/vitest` all peer it (ADR 0013) |
| angular-eslint 22.5.1 (the next stable after 22.5.0) | It contains the fix for [#3198](https://github.com/angular-eslint/angular-eslint/issues/3198). Upgrade with the 24-hour rule (ADR 0012), run `lint-rules:test`, update compatibility.md; the `context.valueOf` comments in the specs may then go |
| Storybook 11 | `angular-vite` stable; drop the `@angular/animations` devDependency (ADR 0008); check whether AOT builds keep `@angular/compiler`, and return to `jit: false` if so (ADR 0025); re-check the themed docs container and its `react` version (ADR 0034); drop or re-create the `angular-vite` patch (ADR 0035) |
| pnpm 12 | Nx lists support (ADR 0012) |
| TypeScript 7 | Angular supports it |
| API Extractor with TS 6 | rushstack PR #5841 released |

## Open questions (for the product owner)

- Consumer product names (for the adoption plan).
- Registry and GitLab edition (Phase 3 CI, CODEOWNERS enforcement).

## Out of scope

- Angular Material, and wrappers for React, Vue or Web Components.
- RTL scripts. All locales are LTR; logical properties keep the door open.
- Wide-gamut (P3) colours in 0.x.
- Charts and data visualisation, rich-text editing, page builders.
- A native mobile kit.
- An SSR test matrix. The kit must not break SSR (no DOM access outside browser-only hooks), but SSR is not tested until a consumer needs it.
- A high-contrast theme beyond `forced-colors` support.
- A Figma library (no design source).
