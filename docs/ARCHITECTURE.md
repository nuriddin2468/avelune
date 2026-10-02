# Architecture

How Avelune is built. Decisions and their reasons live in the [ADRs](adr/README.md); this file describes the resulting structure and how to work within it. Sections on the token pipeline, CSS, motion and releases are added in the phases that build them ([ROADMAP.md](ROADMAP.md)).

## Repository map

| Path | Nx project | Tags | What it is |
|---|---|---|---|
| `packages/tokens` | `tokens` | `layer:tokens` | DTCG sources and the Style Dictionary build |
| `packages/icons` | `icons` | `layer:foundations` | Every Lucide icon as typed, tree-shakable data, the icon types and the `IconNames` interface (ADR 0033, 0036) |
| `packages/ui` | `ui` | `layer:patterns` | The Angular library, one secondary entry point per component |
| `packages/eslint-config` | `eslint-config` | `type:config` | `@avelune/eslint-config`, an application's ESLint config: `tools/lint-rules/src/consumers/eslint-config.ts` bundled with its rules into `dist/` (ADR 0104) |
| `packages/stylelint-config` | `stylelint-config` | `type:config` | `@avelune/stylelint-config`, an application's Stylelint config: `tools/lint-rules/src/consumers/stylelint-config.ts` bundled with its rules into `dist/` (ADR 0104) |
| `apps/showcase` | `showcase` | `type:app` | Real Angular app composing the kit into screens |
| `apps/storybook` | `storybook` | `type:app` | Foundations pages (Phase 2); component docs, stories, interaction and a11y tests (Phase 3) |
| `tools/tokens-check` | `tokens-check` | `type:tool` | Token validation |
| `tools/fonts` | `fonts` | `type:tool` | Builds and checks the web font in `packages/ui/styles/fonts` |
| `tools/compiler-check` | `compiler-check` | `type:tool` | Checks every tsconfig for the required compiler strictness; fixtures prove each option |
| `tools/test-check` | `test-check` | `type:tool` | Proves that the coverage gate, the story gates (`play`, axe), the size budgets, the API reports and the browser suites fail on violations |
| `tools/repo-check` | `repo-check` | `type:tool` | Project tags and the browser floor; proves the commit, formatting and dependency rules (ADR 0029) |
| `tools/lint-rules` | `lint-rules` | `type:tool` | The `avelune` ESLint and Stylelint rules, the settings the workspace configs share with the consumer packages, the consumer configs' sources, and the fixtures that prove both workspace configs (ADR 0023, 0024, 0104) |
| `tools/visual` | `visual` | `type:tool` | Visual regression and the axe sweep of every story, in the pinned container; the container runner and fixed environment every browser suite shares (ADR 0010, 0027) |
| `tools/manifest-check` | `manifest-check` | `type:tool` | The built Storybook's manifests hold every component, input, output, export and interface field of `@avelune/ui`, every public token and class, and a snippet an application can paste for every story, as the Storybook MCP docs toolset reads them (ADR 0090, 0101); it also generates the Foundations pages' token tables (ADR 0102) |
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

A service without a component, such as `theme` or `forms`, has no harness and no `testing` entry point; the one part `forms` draws, the selection fields' clear button (`AveClearButton`, ADR 0052), is tested through the harnesses of those fields. Closely related components may share one entry point: `button` holds Button and IconButton (ADR 0038), `form-field` FormField and ChoiceGroup with their hint and error, `checkbox` Checkbox with its `label[aveChoice]`, which Radio and Switch use too, `select` Select, Combobox and Multiselect with their shared list, its option rows, the `aveOption` and `aveSelectValue` templates (ADR 0046, 0055) the server's side of a list, which the combobox and the searchable multiselect share (ADR 0056, 0057), and the multiselect's chosen values as tags over its trigger (ADR 0081), `date-picker` DatePicker and DateRangePicker with their calendar of days, months and years (ADR 0048, 0053) and the range's presets (ADR 0054), `file-upload` FileUpload (ADR 0050), `slider` Slider and RangeSlider (ADR 0051), `spinner` Spinner (ADR 0058), which draws the delayed spinner of `aveDelayedSpinner` on its own, `progress` Progress on a native `<progress>` (ADR 0059), `skeleton` Skeleton (ADR 0060), `alert` Alert and Banner with their icons and roles per variant (ADR 0061), `empty-state` EmptyState with its row of actions (ADR 0062), `tooltip` the tooltip directive with its panel (ADR 0063), `menu` the menu button (ADR 0064) and the menubar, whose menus exist before they open and move into their overlays (ADR 0076), with the popup they share (`panel.css`), `popover` the popover (ADR 0065), whose trigger is drawn as the menu's, `dialog` Dialog, ConfirmDialog and Drawer (ADR 0067) on the native modal `<dialog>`, with `aveModal()`, their shared behaviour, and an announcer of their own (ADR 0066), `toast` the `AveToaster` service with the region it draws at the end of `<body>`, which moves into an open modal dialog (ADR 0068), `breadcrumbs` the trail of a page, drawn from data with Angular's `RouterLink` (ADR 0070), `tabs` Tabs and Tab, Angular Aria's tabs with the list drawn from the declared tabs and one indicator that slides (ADR 0071), `sidebar-nav` the product's navigation from data, its current pages from the router's `containsTree` and groups that disclose (ADR 0072), `link` the kit's `a[aveLink]`, which says when it opens a new tab (ADR 0073), `pagination` the pages of a list in seven places, which keeps focus where the person pressed, with an optional page-size select (ADR 0074, 0087), `toolbar` Angular Aria's toolbar on the application's element, its items marked with `aveToolbarItem`, which the Menu joins by itself (ADR 0075), `stepper` where a person or a document is in a sequence of steps, from data, the done steps optionally a way back (ADR 0077), and `badge` Badge, a record's status in words on its tinted fill, and Count, how many items wait in a place, which the sidebar navigation draws at a page's row (ADR 0079), and `tag` Tag, a value with a button that takes it away, which moves focus to the next tag once it has gone (ADR 0080), `avatar` Avatar, a person's or an organisation's initials or photo (ADR 0082), `card` Card, a bordered surface with its title, the end of its heading's row and its footer on the application's elements (ADR 0083), `accordion` Accordion and its items, Angular Aria's accordion with each item's panel opening on `timing.expand` (ADR 0084), `tree` Tree, Angular Aria's tree from data in flat rows that say their level, one node chosen (ADR 0085), `list` List and its items, records on one surface whose rows fade and open as they come and go (ADR 0086), and `data-table` DataTable, a native table drawn from columns as data and the application's cell templates (`aveCell`), which sorts, chooses and pages its rows under the kit's Pagination (ADR 0078, 0087). `i18n` holds the words components say themselves, per locale, some of them functions of a name or a number (ADR 0047, 0050); `aveDateFormat`, which writes and reads dates in the four locales, Uzbek in Latin script from the kit's own data (ADR 0048); and `aveNumberFormat` and `aveFileSize`, which write numbers with Uzbek Cyrillic's symbols for Uzbek in Latin script (ADR 0050). `theme` also holds the spinner's timing, `aveDelayedSpinner`, which Button and the select family's lists share (ADR 0056). `overlay` (foundations) holds what the kit's overlays share: `aveHostAnnouncer`, a `LiveAnnouncer` whose live element is inside the component, for the dialogs and the toast region, which a modal dialog would otherwise silence (ADR 0066, 0068); `aveConnectedOverlay()`, the position of CDK's connected overlay (under or over the control, from its start, or ending at its end and pushed inside the viewport for a menu or a popover, ADR 0064, 0065), `aveConnectedStrategy()`, the same place as a position strategy for an overlay a component creates itself (the menubar's, ADR 0076), and `aveOverlayPresence()`, which keeps it open through the exit (ADR 0046, 0048).

**Patterns** (ADR 0091) are entry points whose `entry.json` says `patterns`: layouts the application fills, element components with regions marked by directives on the application's elements (`[aveAppShellActions]`), and data where a pattern draws a part twice or from items. A pattern holds no records, makes no requests and declares no routes; it keeps its layout's state (a drawer open) as a model. Its stylesheets are in `@layer patterns`, where it places the kit's components (layout properties only) and styles its own elements. A page pattern's host is an inline-size container, and its layout changes at the `container.*` tokens; it draws the page's `h1` and never `main`. `app-shell` holds the application shell (ADR 0092): a skip link to `main`, the application bar with the logo (`AveAppLogo`, its dark source chosen by `aveColorScheme()`) and the product's name as the link home, the application's actions and banners, and the navigation drawn by SidebarNav as a column from `breakpoint.md` and a start drawer below it, which closes on navigation and when the window reaches `breakpoint.md` (the token read from the page, matched with `matchMedia`). `search-header` holds the header of a list page (ADR 0093): the `h1`, the count in a status and the actions on one row, the application's search input in a `<search>` landmark under them, and the filters' button, which drives any `AveSearchFilters` (FilterPanel's contract) as a disclosure for a column or a dialog opener for a drawer. `filter-panel` holds FilterPanel (ADR 0094), which keeps that contract: the application's fields on an `ng-template aveFilterPanelContent`, stamped in a 256px column from `container.lg` of the element around it (measured, the token read from the page) or in a start drawer below it, and nothing before it has measured; and AppliedFilters, the applied filters as removable tags above the list. `list-page` holds ListPage (ADR 0095), a register's layout: the search header, `[aveListPageNotice]` notices, the applied filters 16px over the list, and the filter panel's column at the list's start while it is open, which the panel reports through `AVE_FILTER_PANEL_LAYOUT`; the page is as wide as its parent. `list-detail` holds ListDetail (ADR 0096): the page's `h1` over `[aveListDetailList]` and `[aveListDetailDetail]`, side by side 2 : 3 from `container.md`, one at a time below it by `detail` (a model) under a way back, with focus moved to the pane that shows. `form-page` holds FormPage (ADR 0097), a component on the application's `<form>` (`form[aveFormPage]`): the `h1`, which names the form, over the application's parts at most `container.lg` wide, and `[aveFormPageActions]`, a bar that sticks to the window's bottom while the form reaches past it, with `[aveFormPageActionsStart]` at its start. `dashboard` holds Dashboard (ADR 0098): the `h1` with `[aveDashboardActions]`, a list of key figures (`<ave-dashboard-metric label value note>`, on a card's surface), and the application's cards in one, two (from `container.md`) or three (from `container.lg`) columns, `[aveDashboardWide]` spanning two; no charts. `settings-page` holds SettingsPage (ADR 0099): the `h1`, the sections as data drawn by SidebarNav in a 256px column from `container.md`, and the section the address names (the application's `<router-outlet>`); at `home` it opens the first section when wide, and shows the list on a phone, where a section shows under a link back and focus follows.

**Forms** (ADR 0039, 0044). Every control calls `injectControlState()` and `connectToField()` from `@avelune/ui/forms`: the same state signals for Signal Forms, Reactive Forms and a bare element, and the link to the `<ave-form-field>` or `fieldset[aveChoiceGroup]` around it (its label's id, `aria-describedby`, `aria-invalid`, `aria-required`). In a choice group the controls keep their own ids and the fieldset carries the description; a group of radios is a `radiogroup`. A control never adds a value accessor of its own where a native one binds the element. A control without a native element of its own (the select family, the date fields) has a `value` model and a `touch` output for Signal Forms, sets itself as `NgControl.valueAccessor` for Reactive Forms (never an `NG_VALUE_ACCESSOR` provider, which would make a dependency cycle), provides `AVE_CONTROL_OWNER` (with `controlDisabled`, its own disabled state, which dims the field's label, ADR 0051, and `controlDescriptions` for ids of its own that describe that element, ADR 0050), and connects the element people focus through `aveControlTarget` from `@avelune/ui/forms` (ADR 0046, 0048). A control that shows its value (a slider) puts it at the end of the field's label row through `showValue` (ADR 0051). A selection field that may be empty (not required, editable) shows `AveClearButton` while it has a value: out of the Tab order, named "Clear" and the field's label, sized and placed by the field, which gives it Lucide's `x`; the keyboard clears by deleting (ADR 0052). A list value that must hold an item is `minLength(path, 1)` in Signal Forms, shown as required (ADR 0049); `aria-required` never goes on a plain button (ADR 0050).

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

`@avelune/ui` peers Angular (`core`, `common`, `forms`, `router` since Breadcrumbs, ADR 0070), `@angular/cdk` and `@angular/aria`, and depends on `@avelune/tokens` and `@avelune/icons` through `workspace:*`, and resolves both through `node_modules` to their built `dist/` files, as a consumer does (ADR 0033). Every target that compiles, lints or bundles the kit builds them first through Nx `dependsOn`; the lint hook does it too.

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
| `patterns` | `packages/ui/<pattern>/*.css` | the page patterns, which place the kit's components in their templates (ADR 0091) |
| `utilities` | `utilities.css`, `motion.css` | `.ave-tabular-nums`; the `ave-motion-*` classes and every `@keyframes` (see "Motion") |
| `app` | the application | its own styles; unlayered CSS beats every layer |

`fonts.css` (generated, ADR 0018) is imported unlayered: `@font-face` rules are not layered.

**The focus ring** is one rule in `focus.css`: `:focus-visible` gets a `focus-ring.width` outline in `color.border.focus`, `focus-ring.offset` outside the element, and `Highlight` under forced colours. An element inside a container that clips its overflow sets `data-focus-ring="inset"`, and the same rule draws the ring inside its edge. A range input whose thumb the kit draws sets `data-focus-ring="thumb"`, and the ring moves to the thumb, one rule per vendor pseudo-element (ADR 0051). Nothing else sets an outline, transitions one or styles `:focus`; Stylelint enforces all three.

**Loading it.** An application loads `@avelune/ui/styles.css` once, through its bundler, which resolves the tokens and rebases the font URLs. With Angular's application builder, as in the showcase:

- `styles: ["@avelune/ui/styles.css"]` (the showcase uses the source path);
- `optimization.styles.inlineCritical: false`: the critical-CSS inliner drops the dark theme and loads the stylesheet late, so the first paint would be light;
- `outputHashing: "bundles"` and `<link rel="preload" href="media/avelune-sans-latin.woff2" as="font" type="font/woff2" crossorigin>` in `index.html`: hashed media names cannot be preloaded. The invariants suite fails a preload that no face uses or that downloads twice.

Storybook imports the same file in `.storybook/preview.ts` (`@avelune/ui/styles.css`, mapped in `tsconfig.base.json`).

`base.css` also stops the page scrolling while a kit dialog is open (`data-ave-scroll-lock` on the dialog, ADR 0066), and gives the document a `scroll-padding-block-end` of the form page's bar while one is on the page (`data-ave-form-actions`, ADR 0097): one row until the bar has measured itself, then the bar's height, which it writes into `<html>`'s style (ADR 0097, addendum). The Form page stories check it.

**Adding global CSS** means adding it to one of these files, in its layer: `avelune/component-layer` accepts only `reset`, `base` and `utilities` there, and `avelune/layer-order` keeps the entry's first statement. Show it on the Foundations "Global styles" page and assert it in that page's `play` function.

## Motion

Motion is CSS only (ADR 0005). Two mechanisms, both on tokens:

- **State changes** (hover, pressed, expanded, the switch thumb, the tabs indicator) are transitions in the component's own CSS. They use the motion longhands with duration and easing tokens; a part that slides to show a state (the switch thumb, the tabs indicator) takes `timing.slide`, and a part that opens to its height (an accordion's panel, a list's row) `timing.expand`; each moves only after the person has used the control, never as the page opens (ADR 0045, 0071, 0084).
- **Entering and leaving** use the classes of `packages/ui/styles/motion.css` (ADR 0031), through `animate.enter` and `animate.leave`: `ave-motion-popover-*`, `-tooltip-*`, `-dialog-*`, `-backdrop-*`, `-drawer-*` and `-toast-*`, each with `-enter` and `-exit`; the drawer's slides a share of its own width, `motion.travel.edge`, 0 under reduced motion, where it fades (ADR 0067). `ave-motion-list-enter` and `-exit` run two animations each, a fade and the rows of a one-row grid from or to none on `timing.expand` (ADR 0086), and a list item's enter waits `--ave-motion-order` × `timing.stagger`. The loops are `ave-motion-shimmer` and `ave-motion-spin`. `motion.css` also times the route cross-fade (`::view-transition-*(root)`). Tooltips and toasts take their direction from `data-side`.

```html
@if (open()) {
  <div class="menu" animate.enter="ave-motion-popover-enter" animate.leave="ave-motion-popover-exit">…</div>
}
```

**Reduced motion** (`prefers-reduced-motion: reduce` or `data-motion="reduced"`) is the tokens' override only: distances 0, scale 1, slow and slower 150ms, no stagger, a shimmer period of 0 (a static skeleton), no slide (`timing.slide` 0, ADR 0045) and nothing that grows (`timing.expand` 0, ADR 0084). Fades stay, and so does rotation.

Every easing is a token, except `linear` on a loop (Stylelint allows it in `motion.css` only; the invariants accept it only on an animation that repeats forever). Shared-element transitions get their motion with their patterns (ADR 0031, point 5; the list item's came with the List, ADR 0086); top-layer dialogs take the catalog's classes, not `@starting-style` (ADR 0066). Content in a CDK overlay takes the catalog's classes itself and stays until its exit has played (`aveOverlayPresence` from `@avelune/ui/overlay`, ADR 0046): `animate.enter` and `animate.leave` there throw NG0205 when the application is destroyed with the overlay open. The Foundations page "Motion catalog" plays every class, and its `play` function checks them in both modes.

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

- `aveColorScheme()` gives the theme the page shows, `light` or `dark`: `<html>`'s `data-theme`, or `prefers-color-scheme` while it has none, followed and never written, so it agrees with Storybook's toolbar as with `AveTheme`. The application shell takes its logo's dark source by it (ADR 0092).

- `setBrand(input | null)` sets a product's or a tenant's brand (ADR 0089). It loads `@avelune/tokens/brand` lazily, adopts the generated stylesheet as one constructed `CSSStyleSheet` after the page's own (no inline style, so a strict CSP needs no nonce), and keeps it with its report under `avelune:brand`. The next visit applies it at bootstrap without the generator while `aveBrandFingerprint` matches. The signals `brand` and `brandReport` say what the page shows. `provideAvelune({ brand })` sets the brand for a first visit.

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
- Kit stylesheets wrap everything in `@layer components`, a pattern's in `@layer patterns` (its `entry.json` says which); the global stylesheets in `reset`, `base` or `utilities`, and `styles.css` starts with the layer order.
- A pattern's rule on a kit element (`ave-*`, `[ave…]`) sets layout properties only: `avelune/pattern-layout-only` (ADR 0091). A pattern selects a kit element by its element or attribute, never by a class of its own, so the rule sees it.

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
├── brand/                             the brand generator → @avelune/tokens/brand and /brand/presets (ADR 0089)
│   ├── color.ts                       OKLCH ↔ sRGB hex and WCAG contrast on colorjs.io, shared with palette.ts
│   ├── generate.ts                    generateAveBrand: scales, roles, pairs, adaptation, stylesheet, report
│   ├── presets.ts                     the named presets (with the fingerprint: the light entry)
│   ├── roles.ts, fingerprint.ts       generated by tokens:roles; never edited by hand
│   └── *.spec.ts                      node:test, the seeded property test among them
├── scripts/
│   ├── palette.config.ts              inputs: lightness ladder, chroma curve, hues, brand, contracts
│   ├── palette.ts                     colour generation and checks (pure functions)
│   ├── generate-colors.ts             CLI: check (default) or --update
│   ├── sources.ts                     reads sources.json, derives the build modes
│   ├── token-values.ts                DTCG value → CSS / TS value (pure functions)
│   ├── generate-roles.ts              CLI: brand/roles.ts and fingerprint.ts, check (default) or --update
│   ├── build.ts                       Style Dictionary per mode → dist/tokens.css, dist/tokens.ts; dist/brands/*.css
│   ├── size-limit.mts                 the generator's size budget (tokens:size)
│   └── *.spec.ts                      node:test
└── dist/                              build output, not committed: tokens.css, tokens.{ts,js,d.ts}, brand/, brands/
```

**Tiers.** Primitives hold values and are never emitted. Semantic tokens name a purpose (`color.bg.surface`, `space.4`, `font.body-md`) and reference primitives; component tokens (`control.height.md`) exist only where a component must be themable, today for density, and reference semantic tokens. Durations, easings and plain numbers are literals in the semantic tier (ADR 0016).

**Build** (`pnpm nx build tokens`, ADR 0017). Style Dictionary resolves the sources once per mode: the base mode (light theme, comfortable density, full motion) and one mode per override file (dark, compact, reduced motion). `dist/tokens.css` holds every semantic and component token as a `--ave-*` custom property inside `@layer tokens`, in px, with one block per mode: `:root`, `[data-theme='light']`, `prefers-color-scheme: dark` and `[data-theme='dark']`, `[data-density='compact']`, `prefers-reduced-motion` and `[data-motion='reduced']`. `dist/tokens.ts` exports `tokens` (typed values, CSS names, per-mode values), `TokenName` and `tokenVar()`; it is compiled to the package's JS and `.d.ts`. The build first runs `tokens:colors` and `tokens:roles`, so it never builds from stale colour primitives or brand data. It also writes each brand preset's stylesheet to `dist/brands/<name>.css` and compiles `brand/` to `dist/brand/` (`tsconfig.brand.json`).

**Adding a token.** Put it in the file of its tier (ADR 0016): a purpose name, a reference to the tier below, a `$description` saying when to use it. Themed colours go into both theme files. Run `pnpm nx build tokens` and `pnpm nx run tokens:test`, look at the new lines in `dist/tokens.css`, and declare contrast pairs in `contrast-pairs.json` for any new text or boundary colour; `pnpm nx run tokens-check:check` must pass. A new or changed colour role or pair changes every brand: run `pnpm nx run tokens:roles --update` and review the diff of `brand/roles.ts` (ADR 0089).

**Brands** (ADR 0089). `generateAveBrand(input)` from `@avelune/tokens/brand` takes a preset's name or a `#rrggbb` colour and returns the colour tokens of both themes, a stylesheet with the selectors of `tokens.css` inside `@layer tokens`, and a report of what it adapted. It builds the accent and the neutrals on the kit's ladder at the colour's hue, moves the accent fill to the nearest step its text can use, lowers the chroma of any step whose pair fails, and moves danger away from a brand closer than ΔE_OK 0.04. It needs no DOM. `@avelune/tokens/brand/presets` holds the presets and the fingerprint without the generator. Applications never write `--ave-*` values; a brand changes colour tokens only through this stylesheet.

**Colour primitives.** Every scale (`neutral`, `orange`, `red`, `amber`, `green`, `blue`) has twelve steps, 50–950 plus 850, at the same OKLCH lightness per step, so a step plays the same contrast role in every hue. The brand colour is kept exact at `orange.500`. The ladder's contracts (which step carries text or boundaries on which surface) are checked on every generation; see ADR 0011, addendum. To change the palette: edit `palette.config.ts`, run `pnpm nx run tokens:colors --update`, review the diff of the generated file (each token's `$description` shows its OKLCH), commit both.

## Storybook

`apps/storybook` runs `@storybook/angular-vite` with JIT compilation (ADR 0008, 0025); `storybook:typecheck` type-checks every story with ngc and the workspace strictness. `pnpm nx serve storybook` builds the tokens first and serves on `http://127.0.0.1:6006`; `pnpm nx build storybook` writes `dist/apps/storybook`. The preview imports `@avelune/ui/styles.css`, bundled by Vite as an application bundles it (ADR 0030). The toolbar switches theme, density and motion through the `data-*` attributes on `<html>`. Docs pages follow the theme too: `.storybook/docs-theme.ts` gives addon-docs a docs theme for each kit theme, built from the semantic colour tokens. The page sits on `color.bg.surface` and its story previews on the canvas. Its props table lists inputs only (`propsTable: 'inputs'`), so protected template members stay out, and a component page describes plain outputs in its prose; boolean arguments get a radio control, because Storybook's toggle fails contrast. MDX supports GitHub-flavoured Markdown (tables), and a story rendered through a helper sets `parameters.docs.source` to the markup an application writes, with the icons it must register (ADR 0034, 0036). `storybook:build` and `storybook:test` hash the stories of `apps/storybook` and `packages/ui`, so a change to a story alone rebuilds and retests (ADR 0036). `patches/` holds one pnpm patch of `@storybook/angular-vite`, for a bootstrap race on docs pages (ADR 0035). `viteFinal` pre-bundles `@angular/cdk/overlay` and `@angular/cdk/portal` together, so both share CDK's portal classes (ADR 0063).

**Storybook MCP** (ADR 0090). The build writes the components manifest (`features.componentsManifest`): per story file its component's docgen, a snippet per story and the docs page's MDX. The dev server serves `@storybook/addon-mcp` at `http://127.0.0.1:6006/mcp` with the docs toolset only (`docs-list`, `docs-show`, `docs-show-story`); `.mcp.json` names it `storybook`. So a kit story file's `meta.component` is a component of its entry point, never a frame (the frame still renders the stories, and the `Meta<>` type argument stays the frame's), and every story sets a literal `parameters.docs.source.code` that an application can paste: markup alone, or a whole TypeScript component (`typescript`) with its imports and typed fields, never both in one snippet, and no `…` for what is left out (ADR 0101). A helper call or a `${}` would leave the manifest to derive a snippet from the frame, and a snippet derived from args types its fields as strings. Whatever docgen misses (a part such as `<ave-accordion-item>`, a host directive's input, an exported type and its fields) is named on the docs page; a component's JSDoc example keeps control flow out, since TypeScript reads `@for` as a tag. An entry point without a story file (`theme`, `i18n`) has a standalone docs page under Guides, which the build writes to `manifests/docs.json`. Each Foundations story file has a docs page with the token reference of its groups, generated from `@avelune/tokens` by `manifest-check:foundations --update` (ADR 0102). `pnpm nx run manifest-check:check` holds the manifests to the API reports, the public tokens and the global stylesheet's classes.

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
  - **Showcase** (`pnpm nx run invariants:e2e`): every screen linked from `/`, in the same four projects; a screen is a route, so of the paths that differ only in a numeric segment (`/contracts/114`, `/contracts/113`) the first found is checked (`routes.ts`, ADR 0027, addendum): axe with every rule, no horizontal scroll at 320 px, every font preload a face the screen uses and fetched once, every animation on a duration and an easing token (`linear` only on a loop), nothing translated or scaled under reduced motion. Controls of one size (`button[aveButton]`, `a[aveButton]`, the icon buttons, `input[aveInput]`, `textarea[aveTextarea]`, the triggers of the select family and the inputs of the date fields) must share height, radius, border width and font size, and those with a text label the inline padding (`controls.ts`, since Wave 1); a textarea's height is left out, because its rows set it (ADR 0043). The overlay invariants and `animate.leave` join with the overlays (Wave 3).
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
| An application's lint configs: the kit's template rules, icon labels, kit elements and banned imports (ESLint); token-only values, no escape hatches, motion and focus ring left to the kit, logical properties, kit breakpoints, no `--ave-*` declaration and no unknown token (Stylelint); warnings on legacy paths; the bundles import only declared packages | `@avelune/eslint-config` and `@avelune/stylelint-config` (ADR 0104), proven by `eslint-config:test` and `stylelint-config:test` against the built `dist/` (a violation per rule group, a clean control); the shared settings by `lint-rules:test` | no | deferred |
| TS strictness, template types | `ngc --noEmit` (`typecheck` targets) | affected projects | deferred |
| No tsconfig weakens the required strictness (ADR 0022) | `compiler-check:check`, proven by `compiler-check:test` (a fixture per option and per extended diagnostic) | a staged tsconfig | deferred |
| Token-only CSS values, no unknown tokens, specificity cap, no `::ng-deep`/`!important`/ids, motion longhands, `@keyframes` only in `motion.css`, logical properties (exceptions derived from browser data), query widths equal tokens, `@layer components` (`@layer patterns` for a pattern), a pattern places kit elements without restyling them, same-element nesting | Stylelint (ADR 0024, 0091), a fixture per rule in `lint-rules:test` | staged `.css` | deferred |
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
| The manifests hold every component, directive, input, output, export and interface field of `@avelune/ui` (docgen, JSDoc or a docs page), an input's description with every member of its alias, a component JSDoc without stray tags, every public token and global class on a Foundations page, and for every story a literal snippet an application can paste | `manifest-check:check` after `storybook:build` (ADR 0090, 0101, 0102), proven by `manifest-check:test` | no | deferred |
| The Foundations pages' token tables match `@avelune/tokens`, and every token is in one | `manifest-check:foundations` (ADR 0102), proven by `manifest-check:test` | no | deferred |
| Public API unchanged or report updated; release tags present | API Extractor (`ui:api-report`), proven by `test-check:test` | no | deferred |
| No dependency younger than 16 h (ADR 0042); install scripts only where listed | pnpm (`minimumReleaseAge`, `allowBuilds`), effective settings pinned by `repo-check:test` | `pnpm install` | `pnpm install` |
| Every Nx project has exactly one constrained layer or type tag; `.browserslistrc` is the higher of the CSS-feature floor and Angular's supported set (ADR 0014) | `repo-check:check`, proven by `repo-check:test` | no | deferred |
| `ng add` runs, `ng update` finds its migration collection, the package group lists every package | `ui:test-schematics` | no | deferred |
| Colour primitives are exactly what the config generates (no hand edits) | `tokens:colors` | no | deferred |
| Shipped fonts equal a fresh build; every character of uz-Latn, uz-Cyrl, ru and en (incl. Intl output) covered; no Reserved Font Name; axes and checksums | `fonts:check`, proven by `fonts:test` | no | deferred |
| DTCG schema, references, naming, tier direction and literals, line-height grid, theme parity, contrast pairs in both themes and in every brand preset, no primitives in `dist/tokens.css` | `tokens-check:check`, proven by `tokens-check:test` (a fixture per rule) | no | deferred |
| Palette rules: ladder contracts, exact lightness and hue, brand lightness, neutral tint | `generatePalette` (`tokens:colors`), proven by `tokens:test` | no | deferred |
| The brand data is what the tokens compile to | `tokens:roles` | no | deferred |
| Every brand passes every declared pair in both themes; the kit's orange equals `tokens.css`; danger keeps its distance; only a preset or `#rrggbb` is accepted | the generator's checks, proven by `tokens:test` (every preset, 3000 seeded colours, independent contrast code); every preset's stylesheet again by `tokens-check:check` | no | deferred |
| The brand generator within its budget; it stays out of the kit's bundles but loaded lazily | `tokens:size`; `@nx/enforce-module-boundaries` (a static import of `@avelune/tokens/brand` in the kit), proven by `lint-rules:test` | staged files | deferred |

Hooks are a fast local gate and are never bypassed (`--no-verify` is not used). CI runs the same checks on the whole affected graph.
