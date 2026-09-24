# 0036. Every Lucide icon, registered with `provideAveIcons`, and an application's own SVG

- Status: Accepted (2026-09-24, product owner: the whole Lucide set, `provideAveIcons`, custom SVG icons, a way to load every icon at once; custom icons may be any SVG, fitted to the kit by default, with a checking page)
- Date: 2026-09-24
- Related: 0012, 0020, 0028, 0033 (supersedes its decisions 1, 3 and 6), 0034

## Context

- ADR 0033 shipped 52 curated Lucide icons as one object in `@avelune/ui/icon`. `<ave-icon name="…">` looked a string up at run time, so every application bundled every icon of the set: 3.33 kB brotli for 52, and, measured on 2026-09-24 with esbuild and brotli, about 75 kB (566 kB minified) for all 1848 icons of `lucide-static` 1.47.0.
- Lucide 1.47.0 draws with seven shapes (path, circle, rect, line, ellipse, polyline, polygon); 20 circles are dots filled with `currentColor`. Its design guide ([lucide.dev/contribute/icon-design-guide](https://lucide.dev/contribute/icon-design-guide)) sets a 24 × 24 canvas, 1px padding, 2px round strokes, radii and spacing.
- Applications need their own icons too, in any SVG their designers export. Inline SVG through `innerHTML` needs a sanitizer bypass. Arbitrary element trees cannot be drawn by attribute bindings in a template: Angular has no dynamic element names or attribute spreading. `Renderer2` creates elements and attributes one by one, with the component's encapsulation attribute, and runs on the server; `afterRenderEffect` does not.
- `@typescript-eslint/no-empty-object-type` rejects an empty interface; an interface that applications augment must carry members. A 1848-element array literal of distinct `IconDefinition<'…'>` types fails with TS2590.

## Decision

1. **`@avelune/icons` holds every Lucide icon.** `scripts/generate.ts` reads all of `icon-nodes.json` and writes, formatted and committed:
   - `src/index.ts`: the types (`IconTag`, `IconAttribute`, `IconNode`, `IconDefinition`) and `IconNames`, an interface with every Lucide name, which applications extend by declaration merging; `IconName = keyof IconNames`.
   - `src/lucide.ts`: one export per icon, `lucideArrowDown: IconDefinition<'arrow-down'>`, on a shared viewBox and paint, so a bundle keeps only the icons it imports (`sideEffects: false`).
   - `src/lucide-all.ts`: `lucideIcons`, every icon by named import (a namespace object would keep the 1848 export names, 83 kB instead of 75 kB).
   The generator fails on any shape, attribute or fill outside Lucide's rules. The entry points are `@avelune/icons`, `/lucide` and `/lucide/all`. The config list of ADR 0033 is gone: a Lucide upgrade regenerates the set, and its diff is reviewed.
2. **`provideAveIcons(icons)`** (`@avelune/ui/icon`) returns a provider usable in the application's, a route's or a component's providers. Each registry extends its nearest ancestor's (`skipSelf`), so an `<ave-icon>` sees its own injector's icons and every ancestor's. In development, a name no provider registered throws with the export to add, and one name registered with two drawings throws. Kit components register the icons they draw.
3. **`defineAveIcon(name, svg, options)`** reads any static SVG with a strict parser of its own (no DTD, XML's five entities only): shapes, groups, gradients, clip paths, masks, `use` of ids inside the icon, presentation attributes or `style`. Editor metadata, `<title>`, `<desc>` and hidden layers are dropped. Scripts, `<style>`, `class`, event handlers, embedded content, text, filters, animation and references outside the icon are refused, with every problem listed. By default the icon is fitted to the kit: every colour becomes `currentColor` (`colors: 'original'` keeps them) and every stroke takes the kit's width (`strokes: 'original'` keeps them).
4. **Drawing:** `<ave-icon>` has an empty template; an `effect` draws the `<svg>` through `Renderer2`, from any icon definition. Ids get a prefix unique to the icon, so gradients of two icons never meet. The kit's stroke widths of ADR 0033 (2.25, 1.8 and 1.75 units on a 24-unit drawing) scale with the largest side of other viewBoxes.
5. **Budgets:** `@avelune/ui/icon` 5.6 kB (5.21 kB: 2.11 kB for `AveIcon` and `provideAveIcons`, the rest for `defineAveIcon`, which tree-shaking drops from applications that never call it). `icons:size` holds one icon to 250 B (194 B, which proves the tree-shaking) and the whole set to 78 kB (75.01 kB).
6. **Documentation:** the Icon page covers registration, the whole set and custom icons, with Lucide's rules in short; "Guides / Custom icons / Check your icon" draws a pasted SVG next to Lucide's in every size and both themes, and checks the rules that can be read from the markup (canvas, stroke width, caps and joins, fills, colours) and, from the drawn geometry, the padding.

## Alternatives considered

- **Keep the curated set:** the product owner wants every Lucide icon.
- **Load icons lazily one by one (dynamic import or HTTP sprite):** a request and a visible pop-in per icon, extra work for SSR and CSP, for about 0.2 kB an icon. Registration keeps the bundle to what is used without any of that.
- **`innerHTML` with `bypassSecurityTrustHtml` for custom SVG:** a trust bypass per icon and no validation; the parser plus `Renderer2` needs neither.
- **Custom icons restricted to Lucide's style:** the product owner chose any SVG, with Lucide's style recommended and checked by the guide page.
- **Flatter data (`{ tag, ...attrs }` or tuples):** 0.8 kB brotli less for the whole set, less readable and less typed.

## Consequences

- Every application registers what it draws; a forgotten registration fails loudly in development, and Storybook's snippets show the provider.
- Adding a Lucide icon needs no change in the kit; a Lucide upgrade changes `src/*.ts`, the Gallery baselines and the sizes.
- Custom icons can carry their own colours (`colors: 'original'`), which do not follow the theme: the docs say so, and they must be checked in both themes.
- Found on the way: Storybook's build hashed neither its own stories nor the kit's (the `production` input excludes `*.stories.ts`), so the visual suite could run on a stale build. `storybook:build` now hashes `default` and `packages/ui/**/*.stories.ts`, and `storybook:test` the kit's stories.
