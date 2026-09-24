# 0030. Global stylesheet: one entry, layered files, loaded through the consumer's bundler; one focus ring

- Status: Accepted (2026-09-24, technical decision within Phase 4)
- Date: 2026-09-24
- Related: 0004, 0010, 0017, 0018, 0024, 0027; brief §6.1, §6.6

## Context

Brief §6.1 asks for one global stylesheet: the layer order, a modern reset, base typography, one focus ring on `:focus-visible` that is never removed, animated or clipped, `forced-colors` support and a `tabular-nums` utility. Brief §4.4 asks the showcase to preload the primary font. Facts, verified on 2026-09-24:

- **Layer order.** A layer takes its place the first time it is named. `tokens.css` is one `@layer tokens` block (ADR 0017), so the order statement must come before it. CSS allows `@layer` statements before `@import`. Vite's minifier rewrites the statement into first-appearance order; the cascade is the same.
- **Bundlers.** Angular's application builder (22.1.8) and Vite (Storybook) resolve `@import url('@avelune/tokens/tokens.css')` through the package `exports` and rebase the font URLs. Angular names media `media/<name>-<hash>` unless `outputHashing` is `none` or `bundles`, and it adds preload hints for scripts and stylesheets only.
- **Critical CSS.** The production default `optimization.styles.inlineCritical` inlined the light tokens, dropped the dark block (`:root:not([data-theme='light'])`) and loaded the full stylesheet asynchronously, so a dark-theme user saw a light first paint.
- **Box sizing.** Under `content-box` a bordered control with `block-size: var(--ave-control-height-md)` is 38px tall, not 36.
- TypeScript 6 checks side-effect imports; `vite/client` declares `*.css` modules.

## Decision

1. **Files** in `packages/ui/styles`, each in one layer:
   - `styles.css` is the entry: the layer statement of ADR 0004, then imports of the tokens, the fonts and the files below;
   - `reset.css` (`reset`): border-box sizing; the margins of body, headings, paragraphs and lists; `text-size-adjust: none`; `overflow-wrap: break-word` on body, for long Uzbek and Russian words; `text-wrap: balance` on headings and `pretty` on paragraphs; block media capped at their container; form controls inherit the font. Not `* { margin: 0 }`, which also removes a dialog's centring;
   - `base.css` (`base`): canvas, text and accent colour on `html` and every `[data-theme]` island; body-md on `html`; h1 heading-xl, h2 heading-lg, h3 heading-md, h4–h6 heading-sm; bold is semibold; `small` is body-sm size on the surrounding line height; inline `code`, `kbd`, `samp` take the mono family at the surrounding size; `pre` is the code role; links are `fg.link`;
   - `focus.css` (`base`): the ring, `data-focus-ring="inset"` for elements inside a clipping container, and `Highlight` under forced colours;
   - `utilities.css` (`utilities`): `.ave-tabular-nums`. `motion.css` joins this layer (next roadmap item), so an entering class beats a component's own styles.
2. **One focus ring.** Stylelint rejects every `outline*` property outside `focus.css`, `outline` in `transition-property`, and the `:focus` pseudo-class.
3. **Delivery.** The source files are the published files: `@avelune/ui/styles.css` and `@avelune/ui/fonts/*` in the package `exports`, `sideEffects: ["*.css"]`, and a dependency on `@avelune/tokens`. An application loads the entry once through its bundler. The showcase lists it in `styles` and, as a consumer should:
   - sets `outputHashing: bundles`, so the Latin face stays at `media/avelune-sans-latin.woff2`, which `index.html` preloads;
   - sets `inlineCritical: false`, so the first paint has the right theme.
   Storybook imports `@avelune/ui/styles.css` in its preview through a path mapping, with `vite/client` types. Its static token and font folders and the preview head are gone.
4. **Checks:**
   - Stylelint: `avelune/layer-order` requires the order as the first statement of `styles.css`. `avelune/component-layer` accepts a list of layers: `reset`, `base` or `utilities` for the other global files.
   - The Foundations page "Global styles": its `play` function asserts the computed typography, colours, the utility and the ring, keyboard-driven.
   - The visual suite: a `forced-colors` project (light, 1280 px, forced colours active) compares every story tagged `forced-colors` with `<id>/forced-colors.png`. Its play function runs there too, and checks the ring's system colour.
   - The invariants suite: every font preload on a screen names a face in its stylesheets and is fetched exactly once.
   Fixtures in `tools/lint-rules` and `tools/test-check` prove each one.

## Alternatives considered

- **A pre-bundled `styles.css`** with the tokens and fonts inlined at build time would work with a plain `<link>`. But it is a second artefact, and the showcase and Storybook would test the source. Revisit if a consumer cannot bundle CSS.
- **Root-relative font URLs** survive hashing but break under a sub-path `<base href>`.
- **Hashed media and a preload injected after the build:** every consumer would need that step.
- **Letting components set `outline-offset`** for inset rings puts ring geometry in two places.

## Consequences

- The Foundations baselines changed. Bordered boxes now equal their tokens (controls 32/36/40, swatches 64), and `text-wrap: pretty` moved some line breaks. The docs page adds its inline padding to the 1200 px content width.
- A consumer must bundle the stylesheet, turn critical-CSS inlining off, and keep media unhashed to preload. `ng add` configures this in Phase 6.
- `@avelune/tokens` is still private, and `workspace:*` must become the fixed version on release. The deferred release item covers both.
