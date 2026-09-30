# 0091. Patterns: page layouts the application fills, in their own layer, adapting to their container

- Status: Accepted (2026-09-30, technical decision within Wave 6, taken before its patterns; the looks of four patterns are the product owner's, "Wave 6 looks" in ROADMAP.md)
- Date: 2026-09-30
- Related: 0001, 0004, 0016, 0023, 0024, 0030, 0072, 0083, 0089; brief §3, §6.1, §9.1, §9.4

## Context

- Brief §3 orders the layers `tokens → foundations → components → composites → patterns`; `entry.schema.json` lists `patterns`, and no entry point uses it yet. Brief §6.1 declares a `patterns` cascade layer between `components` and `utilities`, and `styles.css` declares it (ADR 0030), empty.
- `avelune/component-layer` requires `@layer components` in every `packages/ui/*/**/*.css` (ADR 0024), so a pattern's stylesheet cannot use its own layer today.
- The showcase's screens lay out their pages themselves, in `@layer app`: a heading row with a count and the actions (`contracts.css`), a heading over cards as wide as a form (`settings.css`), a tree beside a card from a 640px container (`departments.css`). The shell (`app.css`) shows the navigation as a column from an 840px media query and hides the navigation's button; its drawer stays open when the window widens. These are the layouts brief §9.4 names, and every product would build them again.
- The kit's components adapt to their container, not the window: Pagination and Stepper from `container.sm`, the DateRangePicker under `container.xs`, each an inline-size container on its host. Container queries are below the floor: Chrome 105, Firefox 110, Safari 16 (MDN browser-compat-data 8.1.2).
- `<search>`, the search landmark element: Chrome 118, Firefox 118, Safari 17 (browser-compat-data 8.1.2); Angular 22.2's DOM schema knows it.
- ADR 0089 left the logo's place to Wave 6's patterns. The product owner put it in the application bar, which becomes a pattern too (2026-09-30).

## Decision

1. **A pattern is a layout the application fills.** It is an element component (`<ave-list-page>`) in an entry point whose `entry.json` says `"layer": "patterns"`, with a harness, a docs page, stories and a showcase screen, like any component (brief §9.3).
   - It places the application's content in regions marked by directives on the application's elements (`[aveListPageFilters]`), as Card does (ADR 0083).
   - It composes the kit's components where the layout needs behaviour: a drawer on a phone, the navigation's button.
   - It holds no records, makes no requests and declares no routes. It keeps only its layout's state, such as a panel open or closed, as a model the application may bind. It reads the router only where the address says which part a page shows, such as a settings section.
   - A part the pattern draws from items, or in two places, comes as data, as SidebarNav's pages do (ADR 0072): the navigation, the settings sections.
2. **A pattern's stylesheets are in `@layer patterns`,** above the components and below `app`.
   - A pattern places a component in its own template: its grid area, its size, its margins, or hiding it.
   - `avelune/component-layer` takes the layer from the entry point's `entry.json`: `patterns` for a pattern, `components` for every other entry point.
   - A pattern never restyles a component. `avelune/pattern-layout-only` allows a rule whose subject is a kit element (`ave-*` or `[ave…]`) to set only layout properties: display, position and inset, grid and flex placement, margins, sizes. A new look is a variant of the component, through an RFC (brief §9.1).
   - A pattern's stylesheet selects a kit element by its element or its attribute (`.bar > button[aveIconButton]`), never by a class of its own on it, so the rule sees what it selects. Stylelint cannot read the template, so this part is kept by review.
3. **Container queries, not the window.**
   - A page pattern's host is an inline-size container. Its layout changes where the container reaches a `container.*` token (`avelune/media-query-tokens`), so it works the same beside the navigation, in a drawer and on a docs page.
   - A pattern fills the inline size its parent gives it. Size containment means its content never widens it.
   - The application shell is the window's layout, so it alone uses media queries, on the `breakpoint.*` tokens. Where it needs a breakpoint in TypeScript, it reads the token's custom property from the document, never a number, and matches it with the native `matchMedia`. CDK's `MediaMatcher` would add a `<style>` element to the page for each query in Blink and WebKit, which a strict `style-src` blocks without a nonce (ADR 0089).
   - A new width is a new token (ADR 0016).
4. **One page, one structure.**
   - The shell draws the landmarks: the banner with the application bar, the navigation, and `main`. A page pattern never draws `main` again.
   - A page pattern draws the page's `h1` from its `heading` input. Its regions' headings are the application's, at level 2.
   - A pattern names the landmarks it draws, such as a search and its filters on `<search>`.
   - Rhythm follows GUIDELINES.md: a page's parts 24px apart (`space.6`), its sections 32px (`space.8`). The page's padding is the shell's.
5. **The application bar belongs to the shell** (ADR 0092). At its start, the product's logo and name are the link home. The navigation's button shows there on a phone, and the application's actions sit at its end. The logo is the application's image, with light and dark sources and no token (ADR 0089).
6. **Order and proof.**
   - The patterns are built in the order of the Wave 6 plan, each with its ADR. Each replaces its showcase screen's own layout, so the invariants (brief §8.2) run on it.
   - The Stylelint rules are proven by fixtures that lint as the first pattern's stylesheet.
   - Visual baselines come with the wave's visual suite (product owner, 2026-09-30).

## Alternatives considered

- **Patterns as documentation only,** a recipe per page in Storybook with the CSS in the application. Every product rebuilds the same layout in `@layer app` and nothing checks it, while the brief makes patterns a layer with a cascade layer of its own.
- **Layout classes or attributes** (`.ave-page-grid`). This is a free-form appearance API (brief §9.1), and nothing ties a region to its content and its role.
- **Media queries in patterns.** A list page beside a 256px navigation, in a drawer or in a docs frame would change at the wrong width.
- **Patterns in `@layer components`.** Specificity and load order would decide between a pattern's rule and a component's own `:host` rule, where the brief's layer order decides it plainly.

## Consequences

- The showcase's screens lose their layout CSS as each pattern arrives. What stays in `@layer app` belongs to the content.
- A pattern's harness finds its regions by their markers and its own parts, such as the filters' button, never the application's content.
- Each pattern has a size budget (ADR 0028). The components it composes are other entry points, left out of that budget.
- Patterns join the component status table; each is experimental until the wave's visual review.
