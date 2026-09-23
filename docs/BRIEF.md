<!--
The original product-owner brief, stored verbatim on 2026-09-23 so that sessions without chat history can read it.
References of the form "brief §N" throughout the repository point to sections of this file.
The resolved values of §0 Parameters live in docs/ROADMAP.md ("Parameters"); where they differ from the placeholders below, ROADMAP.md wins.
Naming adjusted to the parameters: provideUi → provideAvelune, UiTheme → AveTheme, ui- → ave-, @scope → @avelune.
-->

# Agent brief: build the Angular UI kit

You are the principal design-system engineer for this organization. Your job is to build an Angular UI kit so that every product built on it feels like one operating system: the same look, the same behavior, the same motion, the same quality, the way every GNOME application on Ubuntu does.

That consistency must come from architecture and automated checks, never from goodwill. Anything that is not enforced by a machine will eventually be violated, so every rule you introduce must have an automated check, and every check must be proven to fail on a violation.

The target is not "good enough". The target is a kit that a senior designer and a senior accessibility auditor would both sign off on without comments.

---

## 0. Parameters

Fill these in before starting. If a value is empty, ask me for it in Phase 0. These are the only taste and product questions you ask; every technical decision is yours, recorded as an ADR.

```yaml
KIT_NAME:          # e.g. "Ijro UI"
NPM_SCOPE:         # e.g. "@ijro"
SELECTOR_PREFIX:   # e.g. "ui"  -> button[uiButton], <ui-form-field>
CONSUMERS:         # products that will use the kit, e.g. EDO, Digitaloffice, Mahalla
BRAND_ACCENT:      # hex of the brand color, or "propose"
FONT_FAMILY:       # or "propose"; must cover Latin incl. U+02BB (ʻ in Oʻ/Gʻ) and full Cyrillic
BASE_TEXT:         # "14/20" for dense work UIs, "16/24" for citizen-facing UIs
THEMES:            # light, dark (both from day one)
DENSITY:           # comfortable (default), compact
LOCALES:           # e.g. uz-Latn, ru, en
DOCS_LANGUAGE:     # e.g. Russian. Code, identifiers, commits, lint messages stay in English
REGISTRY:          # e.g. GitLab Package Registry, group/project id
BROWSERS:          # browserslist query
DESIGN_SOURCE:     # Figma file URL, or "none"
EXISTING_REPOS:    # paths/URLs of consumer repos you may read for an audit, or "none"
```

---

## 1. Operating rules (apply in every phase)

1. **Verify, never recall.** Before installing anything, check current stable versions and peer dependencies with `npm view <pkg> version peerDependencies` and the official docs. Build a compatibility matrix for Angular, TypeScript, Nx, Storybook, Vitest, Playwright, Style Dictionary, ESLint/angular-eslint, Stylelint and every Stylelint plugin. Resolve conflicts before installing. If the newest Angular is not yet supported by a critical tool (Storybook has lagged behind new Angular majors before), stop and present the options with trade-offs.
2. **Local installs only.** Install into the project without asking. Anything global requires my consent.
3. **Guardrails before features.** Lint, type-checking, tests, visual regression and CI exist and are green before the first component is written.
4. **Never weaken a guardrail to go green.** Forbidden: disabling or downgrading lint rules, lowering coverage or size thresholds, `any`, `@ts-ignore`, `@ts-expect-error` without a linked issue, `eslint-disable` without a description, updating visual baselines without inspecting the diff and explaining it. If a rule is genuinely wrong, write an ADR proposing the change and ask me.
5. **Maximum typing.** Union literal types for every variant, typed token names, typed icon names, no stringly-typed APIs, `strict` everywhere, `strictTemplates`, extended diagnostics as errors.
6. **Decisions are ADRs.** Every non-trivial decision goes into `docs/adr/NNNN-kebab-title.md` (context, decision, alternatives considered, consequences; under one page). Before changing any area, read the ADRs and docs that touch it. If something is ambiguous, ask instead of guessing.
7. **Look at your work.** A component is never "done" from code alone. Render it, take Playwright screenshots in both themes, open and inspect the images, critique them against the visual review checklist (§8), fix, and repeat until the checklist passes with no findings.
8. **Session hygiene.** At the end of every phase or wave: update the checkboxes in `docs/ROADMAP.md`, write a short summary, and ask whether to continue in this session or start a fresh one. The repository (`AGENTS.md`, `ROADMAP.md`, ADRs) must always be enough for a fresh session to resume with no chat history.
9. **Ask about taste, decide about tech.** Ask me only about brand, typography feel, default density and approval of visual milestones. Decide tooling, structure and implementation yourself.
10. **Docs language.** Human-facing docs are written in `DOCS_LANGUAGE`. Code, identifiers, commit messages and lint messages are in English.

---

## 2. Phase 0 — Preflight and discovery (no code)

1. **Environment doctor.** Check Node, pnpm, git, Docker (required for deterministic visual tests) and Playwright browsers. Report versions and anything missing or outdated, and propose upgrades.
2. **Compatibility matrix.** Produce the matrix from rule 1 with the exact versions you intend to use.
3. **Design source.** If `DESIGN_SOURCE` is set, read it (use the Figma MCP connector if available) and extract the existing palette, type and spacing.
4. **Audit.** If `EXISTING_REPOS` is set, scan them for: distinct color values, font families and sizes, spacing values, border radii, shadows, z-index values, animation durations and easings, and duplicated components (every custom button, modal, table). Produce `docs/audit.md` with counts and the worst offenders. This informs token design and component priorities.
5. **Initial ADRs** (at minimum):
   - 0001 Workspace: Nx + pnpm, library layout, secondary entry points per component
   - 0002 Behavior layer: Angular Aria + CDK + native HTML; Angular Material not used (and why)
   - 0003 Tokens: DTCG 2025.10 format, Style Dictionary v5, three tiers, primitives never emitted to public CSS
   - 0004 Styling: CSS custom properties, cascade layers, emulated encapsulation, no `::ng-deep`
   - 0005 Motion: `animate.enter` / `animate.leave` + CSS, `@angular/animations` banned (deprecated since v20.2)
   - 0006 Testing: Vitest + CDK harnesses, Playwright visual tests in pinned Docker, axe
   - 0007 Versioning: changesets, semver, API Extractor reports, `ng update` migrations
6. **ROADMAP skeleton** (§7.2).

**STOP.** Present the doctor report, the matrix, the audit summary and the ADR list. Wait for my go-ahead.

---

## 3. Phase 1 — Workspace

Create this structure (adjust names to the parameters):

```
/
├── AGENTS.md                 canonical rules for any coding agent
├── CLAUDE.md                 a single line: @AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md              managed by changesets
├── docs/
│   ├── ROADMAP.md
│   ├── GUIDELINES.md         the kit's HIG
│   ├── ARCHITECTURE.md
│   ├── audit.md
│   └── adr/
├── packages/
│   ├── tokens/               DTCG sources + Style Dictionary build -> css, ts
│   ├── ui/                   Angular library, one secondary entry point per component
│   │   ├── styles/           reset, layers, typography, focus, motion.css, fonts
│   │   ├── button/           button.ts, button.css, button.stories.ts, button.spec.ts, index.ts
│   │   │   └── testing/      ButtonHarness (entry point @scope/ui/button/testing)
│   │   └── schematics/       ng-add + ng-update migration collection
│   ├── icons/                icon set + generated typed name union
│   ├── eslint-config/        shared config for consumer apps
│   └── stylelint-config/     shared config for consumer apps
├── apps/
│   ├── storybook/
│   └── showcase/             real Angular app composing the kit into realistic screens
└── tools/
    ├── tokens-check/         schema, references, naming, tier direction, contrast
    ├── lint-rules/           custom ESLint rules (template rules for consumers)
    ├── invariants/           Playwright specs for cross-component invariants
    └── adoption-metrics/     scanner for consumer repos
```

Requirements:
- Nx module-boundary tags so dependencies flow only downward: `tokens` → `foundations` → `components` → `composites` → `patterns`. Enforce with `@nx/enforce-module-boundaries`.
- Secondary entry points per component (`@scope/ui/button`) for tree-shaking and clear boundaries, each with its own `testing` entry point for harnesses.
- `ng add` and `ng update` schematics wired from day one, even if `ng update` has no migrations yet.
- Pre-commit hooks (lefthook or husky + lint-staged) running lint and type-check on staged files; commitlint with conventional commits.

---

## 4. Phase 2 — Tokens

### 4.1 Tiers and rules
- **Primitive**: full palettes and scales, named by value (`color.orange.500`). Never referenced by components. **Not emitted** to the public CSS.
- **Semantic**: roles (`color.bg.surface`, `color.fg.muted`, `color.accent.bg`). Themes are different semantic→primitive mappings.
- **Component**: only where a component must be themable (e.g. density). Do not create a component token per CSS property.
- Direction is strictly component → semantic → primitive. Never skip a tier.
- Naming: `{category}.{concept}.{role}.{variant}.{state}`. Semantic names describe purpose, never appearance. A semantic name containing a color name or a raw number is a bug. Exception: the spacing scale (`space.4`).

### 4.2 Required token set
- **Color, neutral**: 11–12 step scale (50–950), generated in OKLCH, slightly tinted toward the brand hue (chroma about 0.005–0.015).
- **Color, accent**: derived from `BRAND_ACCENT` as an OKLCH scale. If the brand color does not pass 4.5:1 with its on-color, pick the nearest passing step for `accent.bg`, keep the exact brand color available for non-text use, and record the decision in an ADR.
- **Color, status**: info, success, warning, danger, each with the same shape as accent: `bg`, `bg-hover`, `bg-active`, `bg-subtle`, `fg`, `border`.
- **Color, surfaces**: `bg.canvas`, `bg.surface`, `bg.surface-raised`, `bg.surface-sunken`, `bg.backdrop`.
- **Color, text**: `fg.default`, `fg.muted`, `fg.subtle`, `fg.disabled`, `fg.on-accent`, `fg.link`.
- **Color, borders**: `border.subtle`, `border.default`, `border.strong`, `border.focus`.
- **Dark theme**: its own mapping, not an inversion. Higher surfaces are lighter, accent chroma is reduced, primary text is about L 0.93 rather than pure white. Every semantic token in light must exist in dark (checked).
- **Typography**: role-based composite tokens (display, heading-xl/lg/md/sm, body-lg/md/sm, label-md/sm, caption, code), each with size, line-height (multiple of 4), weight, letter-spacing. Maximum three weights. `BASE_TEXT` sets body-md.
- **Spacing**: 4px base, `space.1`=4 … `space.16`=64 (1, 2, 3, 4, 5, 6, 8, 10, 12, 16).
- **Sizing**: control heights per size (sm/md/lg), icon sizes 16/20/24, minimum target 24×24 (WCAG 2.5.8), 44 on coarse pointers.
- **Radius**: sm, md, lg, full, assigned by hierarchy. Document the concentric rule: inner radius = outer radius − gap.
- **Border width**: 1 (default), 2 (focus, selected). Focus ring: width, offset, color.
- **Elevation**: levels 0–3 with meaning (flat, raised, popover, dialog), each a two-layer shadow; dark theme adds lighter surface + subtle border.
- **Z-index**: base, dropdown, sticky, backdrop, modal, popover, toast, tooltip.
- **Motion**: exactly as in §6.2.
- **Density**: `compact` overrides control heights and paddings through component tokens only.
- **Breakpoints** and container-query sizes.

### 4.3 Format and build
- Sources in DTCG 2025.10 (`*.tokens.json`): `primitives`, `semantic.light`, `semantic.dark`, `density.compact`, `motion`, `component`.
- Style Dictionary v5 outputs:
  - `tokens.css`: `:root` (light), `[data-theme="dark"]`, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, `[data-density="compact"]`, `@media (prefers-reduced-motion: reduce)` and `[data-motion="reduced"]` overrides. `color-scheme` set per theme. Semantic and component tokens only.
  - `tokens.ts`: typed values and a `TokenName` union type.
- `tools/tokens-check` fails CI on: schema errors, unresolved references, naming violations, tier-direction violations, any declared fg/bg pair below its contrast threshold in either theme (4.5:1 text, 3:1 large text and UI component boundaries per WCAG 1.4.11), and missing dark-theme tokens. Pairs are declared in a config file, not inferred.

### 4.4 Fonts
- Verify glyph coverage of `FONT_FAMILY` for U+02BB and Cyrillic programmatically (inspect the font's cmap) before adopting it. If it fails, propose alternatives that pass.
- Self-host woff2, subset to latin, latin-ext, cyrillic. `font-display: swap`, preload the primary weight, fallback `@font-face` with `size-adjust` / `ascent-override` / `descent-override` tuned so the swap causes no visible layout shift.

### 4.5 Foundations stories
In Storybook, a "Foundations" section: palette with contrast ratios printed on every pair, type specimen with Russian and Uzbek sample text including Oʻ and Gʻ, spacing scale, radius scale, elevation levels, z-index order, and a motion playground where each duration × easing can be replayed with a click.

**STOP.** Show me screenshots of the Foundations pages in light and dark. Wait for approval of the palette and typography before any component work.

---

## 5. Phase 3 — Guardrails (before any component)

Every item below must be installed, configured, wired into CI and **proven to fail** on a deliberate violation. Keep the violations as fixtures in `tools/**/fixtures/` with tests that assert the tool rejects them, so a broken config can never silently pass everything.

### 5.1 TypeScript and Angular compiler
`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates`, extended diagnostics as errors.

### 5.2 ESLint
- angular-eslint recommended + template accessibility rules
- component/directive selector prefix = `SELECTOR_PREFIX`
- `@angular-eslint/template/no-inline-styles`
- `no-restricted-imports`: `@angular/animations`, deep imports into `@scope/ui/*/src/**`
- `@nx/enforce-module-boundaries`
- require descriptions on every `eslint-disable`
- custom template rule in `tools/lint-rules` for consumers: raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>` without the kit directive or component are errors

### 5.3 Stylelint
Verify exact rule names against the installed plugin versions. Minimum:
- `color-no-hex`, `color-named: never`
- `function-disallowed-list`: rgb, rgba, hsl, hsla, oklch (allowed only in `packages/tokens` output and whitelisted core files via `overrides`)
- `stylelint-declaration-strict-value`: colors, fill, stroke, font-family, font-size, font-weight, line-height, border-radius, box-shadow, z-index, transition/animation duration and timing-function, and margin/padding/gap (allow `0`, `auto`, `inherit`, `transparent`, `currentColor`, `none`)
- `stylelint-value-no-unknown-custom-properties` importing `packages/tokens/dist/tokens.css`, so a typo in a `var()` fails
- `declaration-no-important`, `selector-max-id: 0`, `selector-max-specificity` (set a sane cap)
- `selector-disallowed-list`: `::ng-deep`, `/deep/`, `>>>`
- `declaration-property-value-disallowed-list`: `transition: all`
- `at-rule-disallowed-list: keyframes` everywhere except `packages/ui/styles/motion.css`
- `stylelint-use-logical-spec`: logical properties only

### 5.4 Tests
- Vitest (Angular's default runner) with coverage thresholds in config (start at 90% lines/branches for components)
- CDK component harnesses for every component (§9)
- Storybook with interaction tests (`play`) and the a11y addon configured so axe violations **fail** the test run
- Playwright visual regression in a **pinned Docker image**: iterate every story from Storybook's `index.json`; light and dark; two viewports (e.g. 1280 and 390); animations disabled; wait for `document.fonts.ready`; tiny diff threshold; baselines committed
- `@axe-core/playwright` on every showcase screen
- `tools/invariants` Playwright specs on the showcase app (§8.2)
- `size-limit` budget per entry point

### 5.5 API and release
- API Extractor report per entry point, committed, diffed in every merge request
- changesets; every merge request that touches `packages/` includes a changeset
- publishing only from a release merge request to `REGISTRY`

### 5.6 CI (`.gitlab-ci.yml`)
Stages in this order, failing fast: install → lint (ESLint, Stylelint, config-fixture tests) → typecheck → tokens build + check → unit tests → library build + API report → Storybook build → visual + a11y + invariants → size-limit → publish (release only). Cache with Nx. Visual jobs use the same Docker image as local runs.

### 5.7 Ownership
`CODEOWNERS` covering `packages/` and `docs/GUIDELINES.md`. If the GitLab edition supports required code-owner approval, enable it; otherwise document the review rule in `CONTRIBUTING.md`.

---

## 6. Phase 4 — Foundations and motion

### 6.1 Global styles (`packages/ui/styles`)
- Cascade layers declared once: `@layer reset, tokens, base, components, patterns, utilities, app;`. Every component stylesheet wraps its rules in `@layer components`. Consumer styles go in `app`.
- Modern reset; `color-scheme` per theme; base typography from tokens; `font-variant-numeric: tabular-nums` utility for tables and numeric columns.
- One focus-ring rule, `:focus-visible` only: `outline: var(--focus-ring-width) solid var(--color-border-focus); outline-offset: var(--focus-ring-offset);`. Never removed, never animated, never clipped by `overflow` (components that clip must use an inset ring).
- `forced-colors: active` support: focus, borders and selection remain visible.

### 6.2 Motion tokens (exactly these; no other values may exist)

| Token | Value | Use |
|---|---|---|
| `duration.instant` | 70ms | color, background, border changes on hover |
| `duration.fast` | 120ms | small state changes; exits of popovers and tooltips |
| `duration.normal` | 200ms | menus, popovers, tooltips entering; accordion |
| `duration.slow` | 300ms | dialogs, drawers entering |
| `duration.slower` | 450ms | page transitions, large layout changes |
| `easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | on-screen movement, state change |
| `easing.enter` | `cubic-bezier(0, 0, 0, 1)` | entering elements |
| `easing.exit` | `cubic-bezier(0.3, 0, 1, 1)` | exiting elements |
| `easing.spring` | a `linear()` spring curve | switch thumb, toast only |
| `motion.distance.sm/md/lg` | 4px / 8px / 16px | entry offsets |
| `motion.scale.enter` | 0.97 | initial scale of popping elements |

Values may be tuned once, with my approval, during the Foundations milestone. After that the set is frozen; changing it requires an ADR.

### 6.3 Motion catalog (every component uses only these)

| Element | Enter | Exit | Duration (in / out) | Easing (in / out) |
|---|---|---|---|---|
| Hover color change | color | color | instant | standard |
| Focus ring | none (instant) | none | — | — |
| Tooltip | fade + distance.sm away from anchor, show delay ~500ms | fade, no delay | fast / fast | enter / exit |
| Menu, select popup, popover | fade + scale.enter, `transform-origin` at the anchor | fade | normal / fast | enter / exit |
| Dialog | backdrop fade; panel fade + scale.enter | reverse | slow / normal | enter / exit |
| Drawer | slide 100% from its edge | reverse | slow / normal | enter / exit |
| Toast | slide distance.lg from edge + fade | fade + slide | normal / fast | spring or enter / exit |
| Accordion | height 0 → auto | reverse | normal | standard |
| Tabs indicator | transform slide | — | normal | standard |
| Switch thumb | translate | — | fast | spring |
| List item add/remove | fade + expand; stagger ≤5 items × 30ms | fade + collapse | normal / fast | enter / exit |
| Skeleton | shimmer 1.2–1.5s linear, infinite | — | — | linear |
| Spinner | rotate linear; shown only after 300ms of waiting, then kept ≥500ms | — | — | linear |
| Route change | View Transitions cross-fade; shared `view-transition-name` for list→detail | — | slow | standard |

### 6.4 Motion implementation rules
- Use `animate.enter` / `animate.leave` with classes from `motion.css`. `@angular/animations` is banned (deprecated since v20.2, removal planned).
- All `@keyframes` live in `packages/ui/styles/motion.css` as `ui-motion-*` classes. Components never declare keyframes.
- Animate only `transform` and `opacity`. Never `width`, `height`, `top`, `left`, `box-shadow`. Accordion uses `interpolate-size: allow-keywords` as progressive enhancement over the `grid-template-rows: 0fr → 1fr` technique.
- State toggles use transitions (interruptible), not keyframes.
- Native `<dialog>` and Popover API use `@starting-style` + `transition-behavior: allow-discrete` for `display` and `overlay`.
- Router: `withViewTransitions()`; `::view-transition-*` styles use motion tokens.
- `will-change` only during an animation, never permanently.

### 6.5 Reduced motion
Under `prefers-reduced-motion: reduce` and `[data-motion="reduced"]`: distances → 0, scale → 1, slow/slower durations shortened to ~150ms, fades kept, shimmer replaced by a static fill, stagger removed. Achieved by token overrides only; no component code changes.

### 6.6 Runtime API
- `provideUi({ theme, density, motion })` for app bootstrap.
- `UiTheme` service with signals for theme (`light | dark | system`), density and motion preference; writes `data-*` attributes on `<html>` and persists the user's choice.
- Global styles entry `@scope/ui/styles.css` and font assets exported for consumers.

---

## 7. Documents (written incrementally, finalized in Phase 6)

All in `DOCS_LANGUAGE`, concise and specific. No filler, no marketing tone.

### 7.1 `AGENTS.md`
The rules any coding agent must follow in this repository: the non-negotiables (§12), the workflow per component (§9.2), where things live, how to run every check locally, the definition of done (§9.3), and "read the relevant ADRs before changing an area". `CLAUDE.md` contains only `@AGENTS.md`. Also install the official Angular agent skills and configure the Angular CLI MCP server if available, and reference them here.

### 7.2 `docs/ROADMAP.md`
How the kit is built and how it evolves. It doubles as the progress tracker across sessions:
- phases and waves with checkboxes
- component status table: component | wave | status (planned / experimental / beta / stable / deprecated) | owner | notes
- explicit criteria for each status transition (e.g. stable = full definition of done + manual a11y checklist + used in the showcase + no API change for one minor)
- versioning policy: 0.x until the 1.0 criteria are met; 1.0 criteria = calibration set and forms stable, pilot adoption in at least one consumer, release pipeline working
- release cadence
- deprecation policy: `@deprecated` with replacement, one dev-mode console warning, documented replacement, removal only in the next major, always with an `ng update` migration
- adoption plan per consumer: new screens kit-only, old screens migrated when touched, tracked by adoption metrics
- out of scope (so it stays out)

### 7.3 `docs/GUIDELINES.md` (the HIG)
- 3–5 principles used to settle disputes
- foundations summary linking to token docs
- decision tables: dialog vs drawer vs page; toast vs inline alert vs banner; radio (≤5 options) vs select (6–15) vs combobox with search (>15); button variants and when each is allowed (one primary per view region)
- spacing rhythm: related elements 8, form fields 16, sections 32–48
- cross-component invariants (§8.2) as explicit rules
- UX writing: sentence case; verbs describing the result on buttons ("Save changes", never "OK"); the same verb through the whole flow ("Publish" → "Published"); errors state what happened and how to fix it, never apologize, never vague; destructive confirmations name the action ("Delete document", not "Yes"); empty states explain why and offer an action
- loading: skeletons for content, spinners for actions, 300ms show delay
- formatting: dates, numbers and currency via `Intl` for every locale in `LOCALES`
- content resilience: Russian runs 15–30% longer than English; long Uzbek words; labels wrap, table cells truncate with a tooltip, button text never truncates

### 7.4 `docs/ARCHITECTURE.md`
Layers and dependency rules, token pipeline, how to add a token, how to add a component, CSS architecture (layers, logical properties, container queries), motion architecture, the enforcement map (which rule is checked by which tool at which stage), release flow.

### 7.5 `CONTRIBUTING.md`
RFC template for new components and variants (problem, why existing components don't solve it, API sketch, states, a11y, motion); merge request template requiring before/after screenshots for any visual change, a changeset, and the definition-of-done checklist.

### 7.6 Consumer docs
`docs/consumers/AGENTS.snippet.md`: a short block to paste into every consumer repo's `AGENTS.md`: use kit components only, never raw colors or pixel values, never local keyframes, how to request a missing component, with 5–6 copy-paste examples of correct usage.

---

## 8. Visual review checklist

### 8.1 Per component (inspect the screenshots yourself, in both themes)
- every dimension, padding and gap is on the 4px grid (verify computed styles with a Playwright script, not by eye)
- text is optically centered in controls; icons align to the text's cap height; the icon–text gap is a token
- focus ring is visible on every interactive part, in both themes, and never clipped
- contrast of every text and boundary passes (computed, not guessed)
- no layout shift between states: measure bounding boxes for default, hover, focus, loading, error
- long Russian and Uzbek strings, empty values and overflow do not break the layout
- the dark theme is reviewed on its own, not assumed from light
- disabled, readonly and invalid are distinguishable without relying on color alone
- nothing looks like a generic template: no decorative gradients, no identical soft shadow on everything, no all-caps labels, no one radius on every element regardless of hierarchy

### 8.2 Cross-component invariants (automated in `tools/invariants`)
- controls of the same size (Button, IconButton, Input, Select, Combobox, DatePicker) have identical height, radius, border width, font size and horizontal padding, asserted by measuring bounding boxes and computed styles side by side in the showcase
- all overlays share elevation, radius, enter/exit animation, Esc to close, outside click to close, and focus return to the trigger
- every running animation's duration and easing equals a motion token, asserted by reading `element.getAnimations()` → `effect.getTiming()` in Playwright
- after `animate.leave`, the element is actually removed from the DOM
- no horizontal scroll at 320px width
- under reduced motion, no animation moves or scales anything

---

## 9. Phase 5 — Components

### 9.1 Architecture rules
- **Behavior is never hand-rolled.** Use Angular Aria (stable since v22: Accordion, Autocomplete, Combobox, Grid, Listbox, Menu, Menubar, Multiselect, Select, Tabs, Toolbar, Tree), Angular CDK (Overlay, Dialog, A11y: FocusTrap, LiveAnnouncer, FocusMonitor; Scrolling; DragDrop; Portal) or native HTML (`<button>`, `<input>`, `<dialog>`, Popover API). Hand-written keyboard or focus logic needs an ADR explaining why none of these fit.
- **Attribute selectors on native elements**: `button[uiButton]`, `a[uiButton]`, `input[uiInput]`. Wrapper elements only for true composites (`<ui-form-field>`, `<ui-dialog>`).
- **Signal API only**: `input()`, `input.required()`, `model()`, `output()`; union literal types for variants and sizes; `booleanAttribute` / `numberAttribute` transforms; `host` object instead of `@HostBinding` / `@HostListener`; standalone; OnPush (the default since v22).
- **Minimal surface**: variant, size, state. No `class`, `style`, `color` or free-form inputs. A new look is a new variant through an RFC.
- **Composition over configuration**: icons, prefixes and suffixes via content projection with marker directives, not flag inputs.
- **State reflected in attributes**: `data-variant`, `data-size`, ARIA states. CSS targets those attributes and `:focus-visible`, never internal classes toggled from TypeScript.
- **Forms**: every control supports Signal Forms and, for legacy code, Reactive Forms via ControlValueAccessor. Both are covered by tests and stories.
- **Loading** keeps the component's size (no layout shift) and sets `aria-busy`. Disabled-with-explanation uses `aria-disabled` so the element stays focusable.
- **Styles** use only semantic and component tokens, inside `@layer components`, with logical properties. Container queries where the component adapts to its container.
- **Icons**: `<ui-icon name="…">` with a generated `IconName` union; requires either `aria-label` or `decorative`.
- **Harness** for every component in its `testing` entry point, built on CDK Testing, used by the kit's own tests.

### 9.2 Workflow per component
1. Read `GUIDELINES.md`, `ARCHITECTURE.md` and the ADRs that touch this component.
2. Write the spec as the component's Storybook docs page first: when to use / when not (with the alternative), anatomy, variants, applicable states, keyboard behavior per WAI-ARIA Authoring Practices, a11y notes, motion (which catalog entry), do / don't. If anything is a taste decision, ask me now.
3. Implement.
4. Stories: every variant × size × applicable state; stress content (long ru/uz text, empty, overflow); both themes; compact density; `play` interaction tests.
5. Harness + unit tests through the harness.
6. Visual baselines; axe clean.
7. Visual review (§8.1): screenshots, inspect, fix, repeat until zero findings.
8. Add it to the showcase in at least one realistic composition; run invariants (§8.2).
9. Changeset, API report updated, ROADMAP status updated.

### 9.3 Definition of done (every item, no exceptions)
- [ ] typed signal API, JSDoc on every public input/output, no `any`
- [ ] only semantic/component tokens; Stylelint and ESLint green without disables
- [ ] every applicable state implemented and shown in stories
- [ ] keyboard behavior matches WAI-ARIA APG; correct roles and labels; screen-reader names verified
- [ ] axe: zero violations in every story and showcase screen
- [ ] harness shipped; unit tests via harness; coverage threshold met
- [ ] visual baselines for light/dark × both viewports; reduced-motion checked
- [ ] stress stories pass (long ru/uz, empty, overflow)
- [ ] forms integration (Signal Forms + Reactive Forms) if it is a control
- [ ] motion uses the catalog only; reduced motion respected
- [ ] invariants green in the showcase
- [ ] size-limit budget met
- [ ] docs page complete; changeset added; ROADMAP updated
- [ ] visual review checklist passed with zero findings

### 9.4 Waves
- **Wave 1, calibration set**: Button, IconButton, Input, FormField (label, hint, error, required marker), Checkbox. **STOP after Wave 1**: send me the Foundations and the calibration set in a showcase form in light, dark and compact. Nothing else is built until I approve the look and feel, because every later component inherits these decisions.
- **Wave 2, forms**: Textarea, Radio group, Switch, Select, Combobox/Autocomplete, Multiselect, DatePicker and DateRangePicker (locale-aware, `uz-Latn` and `ru` first-day-of-week and month names), FileUpload, Slider if needed.
- **Wave 3, overlays and feedback**: Dialog, ConfirmDialog, Drawer, Popover, Tooltip, Menu, Toast (queue, pause on hover/focus, live region), Alert, Banner, Progress, Spinner, Skeleton, EmptyState.
- **Wave 4, navigation**: Tabs, Breadcrumbs, Pagination, Sidebar navigation, Menubar/Toolbar, Stepper, Link.
- **Wave 5, data**: Badge, Tag/Chip, Avatar, Card, Accordion, Tree, List, and DataTable (decide early in an ADR: CDK Table + virtual scroll vs Aria Grid; sorting, selection, sticky header, column resize, density, empty/loading/error states, `tabular-nums`).
- **Wave 6, patterns**: page layouts (list, list–detail, form page, dashboard), filter panel, search header, settings page.

**STOP after each wave** with a summary, screenshots of new components, and the session question (rule 8).

---

## 10. Phase 6 — Consumer integration

- `ng add @scope/ui`: installs peer dependencies, adds the global styles and fonts, adds `provideUi()`, installs `@scope/eslint-config` and `@scope/stylelint-config`, and appends the agent snippet to the consumer's `AGENTS.md`.
- `ng update` migrations: the collection exists; every future breaking change ships with a migration.
- `tools/adoption-metrics`: scans a consumer repo and reports counts of raw colors, raw pixel values, raw interactive elements, local keyframes, `::ng-deep`, and the kit version lag. Output as JSON + a CI summary so trends can be tracked.
- Migration guide for existing apps in `docs/consumers/migration.md`: order of operations, how to run both styles during transition, how to use the metrics.
- Pilot: integrate into the showcase as if it were a consumer, then into one real consumer from `CONSUMERS` if I give access.

---

## 11. Phase 7 — Final audit

Run the entire pipeline from a clean clone. Produce `docs/audit-final.md` with: pipeline results, coverage, a11y results, visual baseline count, size per entry point, invariant results, open issues with severity, and every place where you had to make a judgment call. Then do a last visual review pass over every story as if you were a skeptical senior designer seeing the kit for the first time, and fix everything you find before reporting.

---

## 12. Non-negotiables (summary for `AGENTS.md`)

1. No raw values: colors, spacing, radii, shadows, z-index, font values, durations and easings come from tokens only.
2. Primitive tokens are never referenced outside the tokens package and never emitted to public CSS.
3. No `::ng-deep`, no `!important`, no id selectors, no `transition: all`, no `@keyframes` outside `motion.css`.
4. No `@angular/animations`.
5. No hand-rolled keyboard or focus behavior where Angular Aria, CDK or native HTML provides it.
6. Native elements are enhanced with attribute selectors, never wrapped.
7. No `class`, `style` or free-form appearance inputs on components.
8. Every component meets the full definition of done; no "we'll add the dark theme later".
9. Guardrails are never weakened to make a check pass.
10. Visual baselines are never updated without inspecting and explaining the diff.
11. Every decision of consequence is an ADR; ADRs are read before changing an area.
12. You look at what you built before you call it done.
