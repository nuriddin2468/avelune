# 0089. Brand themes: a product's accent at build time, a tenant's at runtime, one generator

- Status: Accepted (2026-09-30, product owner: what a tenant changes, presets and an own colour, adapt and show, built in Wave 6)
- Date: 2026-09-30
- Related: 0011, 0017 (its "consumers are not meant to override tokens" is replaced here for colour), 0021, 0028, 0032, 0061

## Context

- Product owner, 2026-09-30: the products built on the kit have different brand colours, and the end customers of those systems (tenants) set their own brand in the running system. Consumer teams have no designers in Figma.
- One accent (orange, ADR 0011, 0021) is compiled into `tokens.css` as resolved values (ADR 0017). Nine semantic roles per theme come from the accent scale (`accent.*`, `fg.link`, `border.focus`, `brand.mark`), and the neutrals are tinted toward its hue (ADR 0011). An application that redefines `--ave-*` on `:root` in `@layer app` overrides both themes at once and breaks dark, and nothing checks its contrast.
- `palette.ts` builds any hue on a lightness ladder anchored on the contrast contracts; `tools/tokens-check` checks every declared pair in both themes.
- At the browser floor CSS cannot derive safe shades (MDN browser-compat-data 8.1.3): `light-dark()` needs Chrome 123; relative colour arithmetic Chrome 122 and Safari 18; `contrast-color()` Chrome 147 and Safari 26, and promises only 3:1. `color-mix()` works but checks nothing.
- Systems that keep contrast with a brand input compute colours in code and emit concrete values (Atlassian's brand theming, Material Color Utilities, Adobe Leonardo). Those that derive without a check fail AA silently (PrimeNG `palette()`, Ant Design's seed tokens; Ant's default blue gives 4.10:1 with white text).

## Decision

1. **A tenant changes the brand colour and the logo, nothing else** (product owner). Radii, fonts and status colours stay the kit's; density stays a person's preference (ADR 0032).
2. **One generator, `@avelune/tokens/brand`:** pure TypeScript on `colorjs.io`, no DOM, the same in the browser and in Node. `generateAveBrand(input)` takes a preset name or a `#rrggbb` colour. It regenerates the accent and neutral scales for the brand's hue on the ADR 0011 ladder and maps them to the semantic roles. It checks every pair of `contrast-pairs.json` in both themes. The token build compiles the roles and pairs out of `semantic.*.tokens.json` and `contrast-pairs.json`, so there is one source. It returns the colour tokens of both themes, as CSS for the selectors of `tokens.css` inside `@layer tokens`, and a report.
3. **Adapt and show** (product owner):
   - The accent fill takes the nearest passing step (ADR 0021).
   - Its text is white or neutral 950, whichever passes. Hover and pressed go darker under white text and lighter under dark text (ADR 0019, 0021).
   - A step that still fails loses chroma until it passes; at no chroma it is the neutral ladder, which passes, so the generator never fails.
   - The exact colour stays `color.brand.mark` (marks only, `neverText`).
   - The report lists every adjustment, for the settings screen to show.
4. **Status colours keep their meaning:**
   - A brand too close to danger moves danger away from it within the red range, so a primary button never looks like a danger button.
   - A brand close to success, warning or info is only reported, since those states also say themselves with an icon and words (ADR 0061).
   - Tests set and pin the thresholds in Wave 6 (addendum).
5. **Presets and an own colour** (product owner):
   - 10–12 named presets, generated and checked at the kit's build. Each also ships as a static file (`@avelune/tokens/brands/<name>.css`) for a page that links it without the generator.
   - The kit's orange is one of them. The agent proposes the set in Wave 6 for the product owner's review.
   - An own colour goes through the generator.
6. **A product's brand is the same thing at build time:** a preset or a colour, generated into a stylesheet by the product's build (wired by `ng add`, Phase 6). A tenant's brand replaces it.
7. **Applying it:**
   - `AveTheme.setBrand(input | null)` and `brand` in `provideAvelune` (`@avelune/ui/theme`). The service loads the generator lazily, under its own size budget (ADR 0028).
   - It owns one stylesheet after `tokens.css`. How that stylesheet meets a consumer's CSP (a nonce, or a constructable stylesheet) is settled in Wave 6.
   - It caches the CSS under the input and the kit version, and the pre-paint script of ADR 0032 applies it.
   - A server with Node may generate the same CSS and link it, with the kit version in its URL.
8. **Safety and upgrades:**
   - Only `#rrggbb` or a preset name is accepted, and the CSS holds computed hex values only, never the input.
   - A tenant stores its input only, and the CSS is always the output of the running kit, so an upgrade re-derives every tenant's theme with no migration.
9. **Checks:**
   - `tokens-check` runs over every preset.
   - A seeded property test runs thousands of random colours, with every pair passing in both themes.
   - A Foundations "Brand" page shows the controls for each preset and for six stress colours (pale yellow, cyan, near black, near white, red, green) in both themes, in the visual suite.
   - The showcase's SettingsPage (Wave 6) gets a branding screen with the preview and the report.

## Alternatives considered

- **Applications override `--ave-*` themselves:** breaks dark and contrast silently. Rejected, and Phase 6's consumer Stylelint config flags `--ave-*` declarations.
- **Derive shades in CSS:** not at the floor, and nothing can assert contrast. Rejected.
- **Presets only:** leaves no exact corporate colour. Refuse a failing colour: the product owner chose adapt and show instead.
- **Component-level tokens:** a large public surface that SLDS 2 dropped. Not needed for a colour.
- **Generate on the server only:** not every backend runs Node. The same code serves both places.

## Consequences

- ADR 0017's "consumers are not meant to override tokens" becomes "applications never write token values". The generator's stylesheet is the only way colour tokens change at runtime.
- Every change to the semantic colour files or the contrast pairs changes every tenant's theme. The property test and the Brand page's baselines show it.
- `colorjs.io` becomes a runtime dependency of `@avelune/tokens/brand`, loaded lazily and only for an own colour.
- The logo is the application's image. Wave 6's patterns give it a place, with light and dark sources and no token.
- The baselines cover the presets and the stress colours, not every story × brand.
