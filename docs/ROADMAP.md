# Avelune roadmap

This file is both the plan and the progress tracker. A fresh session resumes from here: read [AGENTS.md](../AGENTS.md), find the first unchecked item below, then read the matching sections of the original brief ([BRIEF.md](BRIEF.md)) and the ADRs that touch that area.

**Current position:** Phase 2 in progress (2026-09-23). Colour generation done; next: semantic tokens (second item).

## Parameters

Resolved in Phase 0 (2026-09-23). Change them only through the product owner; record the change here with a date.

| Parameter | Value |
|---|---|
| Kit name | Avelune |
| npm scope | `@avelune` |
| Selector prefix | `ave` (`button[aveButton]`, `<ave-form-field>`) |
| CSS variable prefix | `--ave-` (ADR 0003) |
| Consumers | internal work systems (product names not given yet) |
| Brand accent | propose: Ubuntu-inspired, approved at the Foundations milestone |
| Font | IBM Plex Sans (coverage verified, [compatibility.md](compatibility.md) §4) |
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
- [ ] Semantic light + dark, density compact, motion, component sources (DTCG 2025.10)
- [ ] Style Dictionary 5 build → `tokens.css`, `tokens.ts` (`TokenName` union)
- [ ] `tools/tokens-check`: schema, references, naming, tier direction, contrast pairs, dark parity, no primitives in output; with failing fixtures
- [ ] Fonts: cmap check on the shipped woff2 subsets; self-hosted IBM Plex Sans; metric-tuned fallback `@font-face`
- [ ] Foundations stories: palette + contrast, type specimen (ru, uz-Latn with Oʻ/Gʻ, uz-Cyrl), spacing, radius, elevation, z-index, motion playground
- [ ] **STOP:** Foundations screenshots (light, dark) → approve palette, accent, typography and motion values

### Phase 3: Guardrails (before any component)

Carried over from Phase 1: permanent fixtures for the three module-boundary violations (tokens → ui, icons → ui, relative cross-project import); a SchematicTestRunner test for `ng-add` and the empty migration collection; failing fixtures for `ui:api-report` (untagged export, stale report); an ESLint rule for JSDoc on public API (API Extractor's `ae-undocumented` is off, ADR 0007); a check that every Nx project carries a layer or type tag; a check of `.browserslistrc` against Angular's supported set (ADR 0014).

- [ ] TS + Angular compiler strictness (brief §5.1)
- [ ] ESLint config + custom rules (`avelune/entry-point-layers`, raw-element template rule), with failing fixtures
- [ ] Stylelint config (brief §5.3, ADR 0009), with failing fixtures; CSS nesting × emulated encapsulation fixture (ADR 0005)
- [ ] Vitest browser mode + coverage thresholds; Storybook angular-vite + addon-vitest + a11y `error`
- [ ] Playwright visual in pinned amd64 Docker; axe sweep; invariants skeleton; size-limit
- [ ] API reports; changesets; `.gitlab-ci.yml` stages (brief §5.6); CODEOWNERS + review rule in CONTRIBUTING
- [ ] Every guardrail proven to fail on a violation

### Phase 4: Foundations and motion
- [ ] `@avelune/ui/styles.css`: layers, reset, base typography, focus ring, forced-colors, `tabular-nums` utility
- [ ] `motion.css` with `ave-motion-*` classes; reduced-motion overrides via tokens
- [ ] `provideAvelune()` (brief's `provideUi`), `AveTheme` service (theme, density, motion signals; persisted)
- [ ] Icons package with a generated `IconName` union; `<ave-icon>`
- [ ] Delete the `packages/ui/sample` scaffolding entry point and its API reports once the first real entry point exists

### Phase 5: Components
Waves and status: see the tables below.

### Phase 6: Consumer integration
- [ ] `ng add @avelune/ui` (peers, styles, fonts, provider, lint configs, AGENTS snippet)
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
| Icon | 1 | foundations | planned | | `IconName` union; label or `decorative` required |
| Button | 1 | components | planned | | `button[aveButton]`, `a[aveButton]` |
| IconButton | 1 | components | planned | | label required |
| Input | 1 | components | planned | | `input[aveInput]`; Signal Forms + CVA |
| FormField | 1 | composites | planned | | label, hint, error, required marker |
| Checkbox | 1 | components | planned | | incl. indeterminate |
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
| Dialog | 3 | composites | planned | | native `<dialog>` or CDK Dialog (ADR in wave) |
| ConfirmDialog | 3 | composites | planned | | names the action |
| Drawer | 3 | composites | planned | | |
| Popover | 3 | composites | planned | | |
| Tooltip | 3 | components | planned | | 500ms show delay |
| Menu | 3 | composites | planned | | Aria Menu |
| Toast | 3 | composites | planned | | queue, pause on hover/focus, live region |
| Alert | 3 | components | planned | | |
| Banner | 3 | components | planned | | |
| Progress | 3 | components | planned | | |
| Spinner | 3 | components | planned | | 300ms show delay, ≥ 500ms visible |
| Skeleton | 3 | components | planned | | static under reduced motion |
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
| List | 5 | composites | planned | | |
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
| `stylelint-plugin-logical-css` has one maintainer | fixtures make a swap to `stylelint-use-logical` safe | 0009 |
| amd64 emulation slows local visual runs | filtered and affected runs | 0010 |

## Tracked upgrades

| Upgrade | Trigger |
|---|---|
| `@angular/cdk` + `@angular/aria` 22.2.0, `ng-packagr` 22.2.0, `prettier` 3.9.9, `@microsoft/api-extractor` 7.59.2 | held back by the 24-hour maturity rule on 2026-09-23 (ADR 0012 addendum); upgrade from 2026-09-24, one merge request, compatibility.md updated |
| Angular 22.2 | stable release (currently rc.0) |
| Vitest 5 | Angular 22.2 + Storybook addon-vitest + `@nx/vitest` all peer it (ADR 0013) |
| Storybook 11 | `angular-vite` stable; drop the `@angular/animations` devDependency (ADR 0008) |
| pnpm 12 | Nx lists support (ADR 0012) |
| TypeScript 7 | Angular supports it |
| API Extractor with TS 6 | rushstack PR #5841 released |

## Open questions (for the product owner)

- Consumer product names (for the adoption plan).
- Registry and GitLab edition (Phase 3 CI, CODEOWNERS enforcement).
- Icon set style: asked at the Foundations milestone (taste).
- Accent-only primary action vs a Yaru-style separate "suggested" colour: asked at the Foundations milestone.

## Out of scope

- Angular Material, and wrappers for React, Vue or Web Components.
- RTL scripts. All locales are LTR; logical properties keep the door open.
- Wide-gamut (P3) colours in 0.x.
- Charts and data visualisation, rich-text editing, page builders.
- A native mobile kit.
- An SSR test matrix. The kit must not break SSR (no DOM access outside browser-only hooks), but SSR is not tested until a consumer needs it.
- A high-contrast theme beyond `forced-colors` support.
- A Figma library (no design source).
