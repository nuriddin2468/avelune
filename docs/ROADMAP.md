# Avelune roadmap

This file is both the plan and the progress tracker. A fresh session resumes from here: read [AGENTS.md](../AGENTS.md), find the first unchecked item below that is not marked **Deferred**, then read the matching sections of the original brief ([BRIEF.md](BRIEF.md)) and the ADRs that touch that area.

**Current position:** Phase 5, Wave 2: every component is built and experimental (2026-09-25). Still to run before the wave's STOP: the Slider's baselines, the changed Global styles baseline, the full visual suite and the invariants, which wait for Docker (Docker Desktop failed to start on 2026-09-25, with 5.7 GB free on the disk). Then the Wave 2 additions below (product owner, 2026-09-25), and only after them the wave's visual review of brief §8.1. Wave 1 is closed: the product owner approved it on 2026-09-25 without the showcase review of its STOP. The release age is 16 hours since 2026-09-25 (ADR 0042). Phase 3 is done except the CI, changesets and CODEOWNERS item, which is deferred until a GitLab remote exists (product owner, 2026-09-24). Vitest 5 stays blocked by `@storybook/addon-vitest` 10.6 (peers `^3 || ^4`), re-checked 2026-09-25.

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

Wave 1 summary (2026-09-25):
- Built on 2026-09-24 (ADR 0037–0041); verified on 2026-09-25 with the first full runs of `visual:e2e`, `invariants:e2e` and `test-check:e2e` (Docker had been down). 124 baselines and 5 forced-colors baselines for the 31 new stories, every image inspected.
- The suites themselves had four problems, fixed in ADR 0027, addendum: two page loads per story (now one, 7.6 → 4.3 min), a `networkidle` wait that hung, a blinking caret in forced colours, and a same-size proof that had never run.
- The visual review of brief §8.1 ran as a script with a real pointer in both themes, both densities, 1280 and 390 px and forced colours: hover and press, focus rings (contrast, clipping), layout shift between states and while loading, the 4px grid, computed contrast of text and boundaries, and centring on the cap height. Fixed:
  - FormField: a long label left the asterisk alone on a line;
  - Checkbox, forced colours: invalid kept the danger red, a checked box turned the accent on hover, and a disabled box drew its mark in `fg.disabled`;
  - FormField and Checkbox, forced colours: the label of a disabled control did not dim (now GrayText, like the control);
  - Button: a wrapped label made a 50px button (now 20n + 8px);
  - Button States story: the focus ring was cut off by the table's scroller at 390 px;
  - the showcase's and the Checkbox story's confirmation error was not named by the checkbox; now it is, and the docs page says how.
- Reviewed and kept: the checkbox's 2px margins and its label's 2px padding centre a 16px box on a 20px line in a 24px target; the button's 3px block padding plus its 1px border make 4px.
- Icon, Button, IconButton, Input, FormField, Checkbox and `@avelune/ui/forms` moved to beta (`@beta` in 35 declarations; the API reports differ in those tags only). `@avelune/ui/theme` stays alpha. Changesets are deferred with the CI item.
- **STOP passed** (2026-09-25): the product owner closed Wave 1 and started Wave 2 without reviewing the showcase form.

Wave 2 decisions (product owner, 2026-09-25): Slider is needed and is built last in the wave, for one value and a range; Switch is a 40×24 track with a 16px thumb 4px from its edge; the visual review of brief §8.1 runs once, at the end of the wave, for all its components. Until that review a Wave 2 component is experimental (`@alpha`): baselines, tests and the showcase come with the component, beta after the review.

Wave 2 additions (product owner, 2026-09-25), built before the wave's review, in this order:
1. **Clearing:** every selection field (DatePicker, DateRangePicker, Select, Combobox, Multiselect) shows a clear button at its inline end while it has a value, is editable and is not required. It is not a Tab stop (the keyboard clears by deleting), is named in the four locales, and returns focus to the field. **Done** (2026-09-25, ADR 0052): `AveClearButton` in `@avelune/ui/forms`, Lucide's `x` (product owner); Delete or Backspace on a select's or multiselect's trigger; a range that may be cleared has a wider end input (product owner), so both dates fit down to 320px. Baselines wait for Docker.
2. **DatePicker, quick month and year:** the calendar's heading opens a grid of months, then of years, for dates far away; within the bounds; the keyboard as in the day grid. **Done** (2026-09-25, ADR 0053): three views of one calendar, shared by both date fields; the heading a button with a fill under the pointer only (product owner); twelve years a page; Escape back to the days; the calendar keeps one size in every view and month. Found on the way: choosing the day already chosen did nothing (Aria's single selection toggles it off), and a view drawn anew removed the focused cell, which closed the calendar. Baselines wait for Docker.
3. **DateRangePicker presets:** a built-in, typed, translated set (today, yesterday, this and last week, this and last month, this quarter, this year, the last 7 and 30 days), weeks from the locale's first day; the application picks which to show and may add its own; a list beside the calendar on wide containers, above it on narrow ones; a preset sets the range and closes. Two months side by side: not now. **Done** (2026-09-25, ADR 0054): `presets` takes `AveDateRangePreset`s, the kit's by name and the application's `{ label, start, end }`, none by default; built-in periods whole (product owner); an Aria listbox beside the calendar from a 600px window, above it in one column that scrolls below (product owner); cut to the bounds or disabled; the checked preset scrolled into view; in the showcase's contract term. Baselines wait for Docker.
4. **Rich options** in the select family: structured fields first (a second line, an icon or image at the start, meta text at the end), one row layout everywhere; `ng-template` for an option and for the chosen value as the escape hatch, inside the kit's row (height, padding, check mark); `label` stays required. **Done** (2026-09-25, ADR 0055): `description`, `icon` or `image` (a union), `meta`; the image a 20px square drawn whole, level with the first line (product owner); `aveOption` and `aveSelectValue` templates, typed by `[aveOptionOf]`; stories with flags drawn as SVG data URLs; the showcase's counterparties with their city and tax number. Found on the way: a combobox's search that hid the chosen option unchose it (Aria's listbox prunes its selection), and two-line rows overflowed a long list. Baselines wait for Docker.
5. **Large and remote lists:** asynchronous search (a debounced query, loading, an error with retry, no results), the options already chosen given apart from the current list (a new ADR over ADR 0046's "the value is always an option"), and "load more" at the end of the list. No virtual scrolling: Aria's `aria-activedescendant` needs the options in the DOM. **Done** (2026-09-25, ADR 0056): the combobox's `search="server"` with `query` after the new `timing.search-delay` (300ms), `loading`, `error` with Try again and Enter, `hasMore` with `loadMore` at the list's end, on Down from its last option and when the options do not fill the list; `chosenOptions` on all three and the choices remembered; announcements through `LiveAnnouncer`; the spinner's timing moved to `@avelune/ui/theme`; the showcase's counterparties from a pretend server, by name or tax number, twenty a page. Found on the way: the API report's cache ignored the built types (fixed, ADR 0007 addendum). Baselines wait for Docker; the Foundations motion page shows the new token.
6. **Multiselect with search:** an input as the trigger over a multi-select listbox, for long lists.
Not taken: a Today button, "select all", option groups, chips in the multiselect (after Tag, Wave 5), creating a value from the search.

Wave 2 build (2026-09-25), before the product owner's corrections and the wave's review:
- DatePicker and DateRangePicker (ADR 0048), FileUpload (ADR 0050) and Slider with RangeSlider (ADR 0051) joined Textarea, RadioGroup, Switch and the select family. The product owner chose the FileUpload's drop zone with its button inside and the Slider's value in the label row (2026-09-25).
- New shared parts: `@avelune/ui/overlay` (the connected overlay and its presence); `aveDateFormat`, `aveNumberFormat` and `aveFileSize` in `@avelune/ui/i18n`, which write Uzbek in Latin script right where Chromium cannot; messages that are functions; the field's value slot (`showValue`); `controlDescriptions` and `controlDisabled` on `AveControlOwner`; the thumb ring in `focus.css`.
- Found and fixed on the way: a multiselect with `required` was valid with nothing chosen (ADR 0049: `minLength(path, 1)`); the field's label did not dim for a composite control disabled by its own input; `aria-required` went on a plain button; CDK's `LiveAnnouncer` showed its words on the page; forced colours drew a border round every calendar day; a range's end date was clipped at 320px.
- Found after the build (2026-09-25): choosing a select's or a combobox's chosen option again cleared the value, because Aria's single selection toggles; fixed, the value stays and the list is given it back.
- Not fixed, upstream: Angular Aria's combobox logs NG0953 when destroyed with focus inside (tracked risk).

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
| 1 Calibration | Icon, Button, IconButton, Input, FormField, Checkbox | **STOP:** passed 2026-09-25 (product owner) |
| 2 Forms | Textarea, RadioGroup, Switch, Select, Combobox/Autocomplete, Multiselect, DatePicker, DateRangePicker, FileUpload, Slider | STOP + summary |
| 3 Overlays & feedback | Dialog, ConfirmDialog, Drawer, Popover, Tooltip, Menu, Toast, Alert, Banner, Progress, Spinner, Skeleton, EmptyState | STOP + summary |
| 4 Navigation | Tabs, Breadcrumbs, Pagination, SidebarNav, Menubar, Toolbar, Stepper, Link | STOP + summary |
| 5 Data | Badge, Tag, Avatar, Card, Accordion, Tree, List, DataTable (ADR first: CDK Table + virtual scroll vs Aria Grid) | STOP + summary |
| 6 Patterns | ListPage, ListDetail, FormPage, Dashboard, FilterPanel, SearchHeader, SettingsPage | STOP + summary |

## Component status

| Component | Wave | Layer | Status | Owner | Notes |
|---|---|---|---|---|---|
| Icon | 1 | foundations | beta | | `@avelune/ui/icon` (ADR 0033, 0036): every Lucide icon through `provideAveIcons`, custom SVG through `defineAveIcon`, the "Check your icon" guide; in the showcase shell and form; 5.21 kB of 5.6 kB; beta 2026-09-25 |
| Button | 1 | components | beta | | `@avelune/ui/button` (ADR 0037): `button[aveButton]`, `a[aveButton]`; primary, secondary (bordered, product owner 2026-09-24), ghost, danger; `disabledInteractive`; a loading spinner after 300ms, kept 500ms; a wrapped label is 20n + 8px tall; 2.78 kB of 3.1 kB with IconButton; beta 2026-09-25. Before stable: forced colours show no hover or press on secondary and ghost (the state layer becomes Canvas) |
| IconButton | 1 | components | beta | | `@avelune/ui/button` (ADR 0038): `button[aveIconButton]`, `a[aveIconButton]`, extends Button; `icon` and `label` required; square of the control height; beta 2026-09-25 |
| Input | 1 | components | beta | | `@avelune/ui/input` (ADR 0039): `input[aveInput]` for text types; Signal Forms and Reactive Forms through their native accessors, state from `@avelune/ui/forms` (beta with it); `border.strong` (product owner, 2026-09-24); invalid, readonly (dashed), disabled (flat); 1.25 kB of 1.4 kB; beta 2026-09-25 |
| FormField | 1 | composites | beta | | `@avelune/ui/form-field` (ADR 0040): `<ave-form-field label>`, `[aveHint]`, `[aveError]`; the error once invalid and touched; asterisk for required (product owner, 2026-09-24), kept with the last word of a wrapped label; 1.86 kB of 2.1 kB; beta 2026-09-25 |
| Checkbox | 1 | components | beta | | `@avelune/ui/checkbox` (ADR 0041): `input[type=checkbox][aveCheckbox]` in `label[aveChoice]`; `indeterminate` model; `requiredTrue` recognised; only system colours in forced colours; its error message is the application's, named by `aria-describedby` (docs page); 1.46 kB of 1.6 kB; beta 2026-09-25; check Firefox and WebKit before stable |
| Textarea | 2 | components | experimental | | `@avelune/ui/textarea` (ADR 0043): `textarea[aveTextarea]`; Input's box per size, one row as tall as an input; `rows` 3 by default; drag taller, never wider; no growing with the text; in the showcase form; 1.25 kB of 1.4 kB; beta after the Wave 2 visual review |
| RadioGroup | 2 | components | experimental | | `@avelune/ui/radio` and `fieldset[aveChoiceGroup]` in `@avelune/ui/form-field` (ADR 0044): a drawn native radio in `label[aveChoice]`; the group holds radios or checkboxes with one legend, hint and error, describes the group, and is a `radiogroup` for radios; ≤ 5 options (GUIDELINES); in the showcase form; beta after the Wave 2 visual review |
| Switch | 2 | components | experimental | | `@avelune/ui/switch` (ADR 0045): `input[type=checkbox][aveSwitch]` with `role=switch`; a 40×24 track, a 16px thumb 4px from the edge (product owner, 2026-09-25); the thumb slides on the new `timing.slide` (0 under reduced motion), only after a toggle; on the showcase's new settings screen; 1.12 kB of 1.3 kB; beta after the Wave 2 visual review |
| Select | 2 | composites | experimental | | `@avelune/ui/select` (ADR 0046, 0052, 0055): `<ave-select>` on Aria's combobox and listbox in CDK's overlay; options as data; Input's box; both form APIs; rich options and templates (ADR 0055); in the showcase form; the entry point 7.93 kB of 8.8 kB with Combobox and Multiselect; beta after the Wave 2 visual review |
| Combobox / Autocomplete | 2 | composites | experimental | | `<ave-combobox>` (ADR 0046, 0052, 0055, 0056): filters by label, one Uzbek apostrophe for all, or searches a server a page at a time (ADR 0056); a chosen value the list no longer holds stays; "no results" from `@avelune/ui/i18n` (ADR 0047); in the showcase form; beta after the Wave 2 visual review |
| Multiselect | 2 | composites | experimental | | `<ave-multiselect>` (ADR 0046): a multi-select listbox that stays open; the chosen labels in the trigger; in the showcase form; beta after the Wave 2 visual review |
| DatePicker | 2 | composites | experimental | | `@avelune/ui/date-picker` (ADR 0048, 0052, 0053): `<ave-date-picker>`, typed in the locale's order, and a calendar dialog on Aria's grid in CDK's overlay; ISO dates, `minDate` and `maxDate`; month names, abbreviated weekdays and the first day of the week from `aveDateFormat` (`@avelune/ui/i18n`), Uzbek in Latin script from the kit's own data; the overlay helpers now in `@avelune/ui/overlay`, shared with the select family; the clear button (ADR 0052); the heading opens months, then years (ADR 0053); in the showcase form; the entry point 9.79 kB of 10.8 kB with DateRangePicker; beta after the Wave 2 visual review |
| DateRangePicker | 2 | composites | experimental | | `<ave-date-range-picker>` (ADR 0048, 0052, 0054): two inputs in equal columns and one calendar, the start chosen first, then the end; each input named by the field's label and its part; the end input under the start in a container narrower than `container.xs`; a wider end input with the clear button when it may be cleared (ADR 0052); presets (ADR 0054); in the showcase form, with presets for the term; beta after the Wave 2 visual review |
| FileUpload | 2 | composites | experimental | | `@avelune/ui/file-upload` (ADR 0050): `<ave-file-upload>`, a drop zone around a secondary button (product owner, 2026-09-25) and a boxed list of the files with their sizes; `accept`, `maxSize`, `multiple`, `maxFiles`; files not taken listed with the reason; `LiveAnnouncer` says what happened; value `File[]`, at least one with `minLength(path, 1)` (ADR 0049); sizes from `aveFileSize` (`@avelune/ui/i18n`); in the showcase form; 4.13 kB of 4.6 kB; beta after the Wave 2 visual review |
| Slider | 2 | composites | experimental | | `@avelune/ui/slider` (ADR 0051): `<ave-slider>` and `<ave-range-slider>` on native range inputs; the value at the end of the field's label row, the bounds under the track's ends (product owner, 2026-09-25); `minValue`, `maxValue`, `step`, `format` (`aveNumberFormat`); the ring on the thumb (`data-focus-ring="thumb"`); in the showcase form (advance) and settings (delivery hours); 3.34 kB of 3.7 kB; beta after the Wave 2 visual review |
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
| amd64 emulation slows local visual runs: CPU-bound, 10 workers only 13% faster than 5; 4.3 to 5 min for 47 stories with one load per story × project (2026-09-25) | per component `pnpm visual --grep=components-<name>--` (about 1 min), the full suite once per wave and before a merge; cached runs; Docker targets never run in parallel | 0010, 0027 |
| Baseline PNGs grow the git history (10 MB on disk after Wave 1, 2.5 MB of it the Wave 1 components, 2026-09-25) | every update reviewed; move `tools/visual/baselines` to Git LFS before the history passes 200 MB (ADR needed) | 0027 |
| Chromium's Intl formats `uz`/`uz-Latn` with root patterns (`UZS 1,234,567.80`, `2026 M09 23`, weekdays `Sun Mon`); `uz-Cyrl` dates are right but currency is `UZS`, not `сўм` (observed in Chromium 153, 2026-09-23; Firefox and WebKit have CLDR's data, 2026-09-25) | dates: resolved, `aveDateFormat` writes Uzbek in Latin script from the kit's own CLDR data (ADR 0048); numbers and percentages: resolved, `aveNumberFormat` takes Uzbek Cyrillic's symbols, identical to CLDR's Uzbek Latin (ADR 0050); currency (`сўм`, `so‘m`): open, until a component shows money | 0048, 0050 |
| Storybook's dev server exits when a story file fails to index, and can keep serving a stale index: a server started before a story was added showed "Invalid value passed to the 'of' prop" on the Icon docs page (2026-09-24) | restart the dev server after adding, renaming or removing a story, and after changing `.storybook/main.ts`; the visual suite and CI use the static build | 0008 |
| `@storybook/angular-vite` is patched (a docs-page bootstrap race) | pinned to 10.6.0; `pnpm install` fails if the patch stops applying; reported as [storybookjs/storybook#36423](https://github.com/storybookjs/storybook/issues/36423) with a public reproduction (2026-09-24); drop the patch once a release fixes it | 0035 |
| Docs pages were outside every automated check; the unreadable dark Icon page (2026-09-24) was found by eye | since 2026-09-24 the visual suite renders every docs page in both themes and runs axe on it, failing on errors too (ADR 0034, addendum); layout and overflow on docs pages are still checked by eye only | 0027, 0034 |
| `@angular-eslint/eslint-plugin` 22.5.0 crashes `reactive-context-must-read-signal` on a call named like an `Object.prototype` method (a destructured `valueOf` in a Signal Forms rule): it looks names up in a plain object (2026-09-24) | already reported upstream ([angular-eslint#3198](https://github.com/angular-eslint/angular-eslint/issues/3198)) and fixed ([#3201](https://github.com/angular-eslint/angular-eslint/pull/3201), merged 2026-09-17), in 22.5.1 alphas only; until a stable release has it, write `context.valueOf(…)` (the specs say why) | 0023 |
| The visual baselines show rest, focus, disabled and loading states; hover and press need a real pointer, which a story's `play` function does not have | hover and press checked by script in each wave's visual review (Wave 1: real pointer in both themes, both densities and forced colours, 2026-09-25); make that script a checked-in tool before the review at the end of Wave 2; a hover pass in the visual suite if a regression slips through | 0027 |
| iOS Safari 17–18.2 implements `popover` without light dismiss (browser-compat-data 8.1.2; WebKit bug 267688), and the floor is iOS 17.5 | Wave 3: Popover and Menu close on an outside tap on iOS too, through CDK or Angular Aria behaviour where they provide it; otherwise raise the iOS floor to 18.3 (product owner, ADR 0014) | 0014, 0029 |
| Angular 22.2's emulated shim scopes a nested `&` to the component's content, so `:host { &:hover {} }` never matches the host (2026-09-25); not reported upstream yet | `avelune/nesting-same-element` rejects nesting under `:host`, and `encapsulation.spec.ts` pins the output, so a change in either direction fails `lint-rules:test` | 0024 |
| ng-packagr 22.2's `.d.ts` bundles export every declaration of a file without an export list (2026-09-25); not reported upstream yet | ng-packagr held at 22.1.1; `ui:api-report` fails on a leaked declaration without a release tag | 0007 |
| An element with `animate.enter` or `animate.leave` inside a CDK connected overlay throws NG0205 when the application is destroyed with the overlay open (reproduced with a minimal case, 2026-09-25); not reported upstream yet | the select family applies the catalog's classes itself and keeps the overlay open through the exit (`listPresence`); Wave 3's overlays follow the same pattern | 0046 |
| Storybook's `angular-vite` instantiates a meta's `component` outside an injection context, where `model()` throws NG0203 (2026-09-25) | stories of components with a `model()` declare their arguments without `component` | 0046 |
| Angular Aria 22.2's combobox closes its popup from a `setTimeout` after `focusout` without checking whether it was destroyed, so removing a focused select, combobox or multiselect logs NG0953 ("Unexpected emit for destroyed `OutputRef`") in development (seen in `storybook:test` and `ui:test`, 2026-09-25); not reported upstream yet | a development warning only, no error and no leak; report it with a minimal case; the kit adds no workaround, since the timer is Aria's own | 0046 |
| CDK 22.2's `LiveAnnouncer` adds `cdk-visually-hidden` to its live element but loads that class's styles only through `cdkAriaLive` or the focus trap, so an announcement from the service alone shows on the page (2026-09-25); not reported upstream yet | FileUpload loads them itself with `_CdkPrivateStyleLoader` and `_VisuallyHiddenLoader` from `@angular/cdk/private`, and its spec and story check that the live element is 1px wide; drop that once CDK loads them in the service | 0050 |

## Tracked upgrades

| Upgrade | Trigger |
|---|---|
| `ng-packagr` 22.2.x | A release whose `.d.ts` bundle keeps non-exported declarations private (an `export {…}` in every file, or no stray declarations). Then run `ui:api-report`: the reports change in form only (named imports instead of `_angular_core`, one input per line in `ɵcmp`); review that diff, update compatibility.md |
| Vitest 5 | `@angular/build` 22.2 peers it; waits for `@storybook/addon-vitest` and `@nx/vitest`, which peer `^3 \|\| ^4` (re-checked 2026-09-25; ADR 0013) |
| angular-eslint 22.5.1 (the next stable after 22.5.0) | It contains the fix for [#3198](https://github.com/angular-eslint/angular-eslint/issues/3198). Upgrade with the release-age rule (16 hours, ADR 0042), run `lint-rules:test`, update compatibility.md; the `context.valueOf` comments in the specs may then go |
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
