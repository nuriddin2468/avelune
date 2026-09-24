# 0033. Icon set and `<ave-icon>`: typed Lucide data, frozen strokes, a label or decorative

- Status: Accepted (2026-09-24, technical decision within Phase 4, delegated to the agent by ADR 0020); decisions 1, 3 and 6 superseded by 0036
- Date: 2026-09-24
- Related: 0001, 0012, 0020, 0026, 0028; brief §4.2, §9.1

## Context

ADR 0020 chose Lucide from `lucide-static` and left three things to Phase 4: how the icons reach the kit, the stroke width, and how `IconName` is generated. Brief §9.1 asks for `<ave-icon name="…">` with a generated `IconName` union that requires either a label or `decorative`. Facts, verified on 2026-09-24:

- `lucide-static` 1.47.0 has 2112 SVG files and `icon-nodes.json`: 1848 icons as `[tag, attributes]` lists, without aliases. The shapes used are path, circle, ellipse, line, polyline, polygon and rect. 1.48.0 was 3 hours old, so the 24-hour rule applies (ADR 0012).
- Inline SVG through `innerHTML` goes through Angular's sanitizer, which drops SVG elements unless trust is bypassed. Template bindings (`<svg:path [attr.d]>`) need neither.
- ng-packagr compiles an entry point with its folder as `rootDir`, so the icon data cannot be a path-mapped source file from another package (TS6059). Resolved through `node_modules`, a package's built `.d.ts` and `.js` work in ng-packagr, in Angular's builders and in Vite. Angular's unit-test builder resolves from the workspace root.
- `@switch … @default never` fails to type-check on a discriminated union of objects in Angular 22.1 (TS2339 on `never`). An `@if` / `@else if` / `@else` chain narrows correctly.
- A comparison with Plex, at 1x and 2x, of strokes from 1.33 to 1.75px at 16, 20 and 24px (scratch page, not committed): at 16px, Lucide's 2-unit stroke (1.33px) is lighter than regular text, and 1.67px clogs the gear. At 24px next to a semibold heading, 1.5px is too light.

## Decision

1. **`@avelune/icons`** (layer foundations) holds the set:
   - `scripts/icons.config.ts` lists the kit's icons by Lucide name, sorted; 52 to start, for Waves 1–4.
   - `scripts/generate.ts` writes `src/icons.ts` (committed) and `LICENSE-lucide.txt`. `src/icons.ts` holds `IconElement`, `icons`, `IconName = keyof typeof icons` and `iconNames`.
   - The generator fails on an unknown name, an alias, an unsorted or repeated name, any fill, a missing or unknown attribute, and a shape `<ave-icon>` does not draw. The shapes are path, circle, line and rect, the ones the set uses.
   - `icons:generate` checks by default and rewrites with `--update`. `icons:build` compiles the data to `dist/`.
2. **Resolution:** `@avelune/ui` depends on `@avelune/icons` (and `@avelune/tokens`) through `workspace:*`, as a consumer would. The root lists it too, for the unit-test runner. Every target that compiles, lints or bundles the kit builds the icons first (Nx `dependsOn`; lint and the lint hook build tokens and icons). There is no tsconfig path for `@avelune/icons`.
3. **`<ave-icon>`** (`@avelune/ui/icon`, layer foundations, `testing` entry point with `AveIconHarness`):
   - The inputs are `name` (required, `AveIconName`), `size` (`sm` 16px, the default; `md` 20px; `lg` 24px; the `size.icon.*` tokens), `label` and `decorative`.
   - The template draws each element with attribute bindings, `currentColor` strokes and round caps. The last `@else` narrows to rect, so a shape the generator starts to accept fails to compile until the template draws it.
   - With a label, the host is `role="img"` with `aria-label`; when decorative, it is `aria-hidden="true"`. The `<svg>` is always hidden and not focusable.
4. **Strokes, frozen:** 1.5px at 16 and 20px, 1.75px at 24px (2.25, 1.8 and 1.75 grid units), so an icon weighs what its text weighs. The unit tests and the baselines pin them.
5. **A label or decorative, checked twice:** `avelune/icon-label` (ESLint, every template) rejects an `<ave-icon>` with neither, or with both as plain attributes. In development the component throws on either case, which also covers bindings.
6. **Budget:** the entry point's size includes the icon data (3.33 kB for 52 icons, budget 3.7 kB). Adding icons raises the budget, with the reason in the merge request (ADR 0028).
7. **Stories and docs** live next to the component: `icon.mdx` (the spec page) and `icon.stories.ts`. The Storybook config picks up `packages/ui/**/*.mdx` and `*.stories.ts`.

## Alternatives considered

- **Inline SVG strings with `bypassSecurityTrustHtml`:** a trust bypass in every icon, and no type for the shapes.
- **A CSS mask per icon:** needs a data URI per name and an inline style, which the lint rules ban.
- **A tsconfig path to the icon sources:** breaks ng-packagr's `rootDir`, as measured.
- **Lucide's stroke of 2 units at every size:** 1.33px at 16px, lighter than the text next to it.
- **Tree-shaking icons by name** (one export per icon): `name` is dynamic, and the set is curated and small.

## Consequences

- Adding an icon means a line in the config, `icons:generate --update`, a reviewed diff and the Gallery baselines.
- A fresh clone builds the tokens and icons before lint, type-checking and tests; Nx and the lint hook do it (cached).
- Upgrading `lucide-static` can change paths; the generated diff and the Gallery baselines show it.
