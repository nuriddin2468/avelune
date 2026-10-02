# Compatibility matrix

Verified on 2026-09-23 with `npm view <pkg> version peerDependencies engines` and the official docs; re-verified and installed in Phase 1 the same day; the lint, browser-suite and size packages re-verified and installed in Phase 3 (2026-09-24); the Angular 22.2 set re-verified and installed on 2026-09-25. Re-verify before every upgrade; update this file in the same merge request as the version change.

**Maturity rule.** pnpm resolves no version younger than 16 hours (`minimumReleaseAge`, ADR 0042; 24 hours until 2026-09-25, ADR 0012 addendum). Rows marked *held back* pin the previous release until the newer one matures; the upgrade is listed in ROADMAP.md, "Tracked upgrades".

## 1. Environment (development machine, Phase 0 doctor)

| Tool | Found | Requirement | Status |
|---|---|---|---|
| macOS | 15.7.7, arm64 | none | ok |
| Node | 24.21.0 (nvm) | Angular 22: `^22.22.3 \|\| ^24.15.0 \|\| >=26`; size-limit `^24.5` → repo `engines.node` `^24.15.0`, `.nvmrc` 24.21.0 | ok |
| pnpm | 10.26.1 (Homebrew) | repo pins 11.27.1 via `packageManager` (ADR 0012) | ok; pnpm switches per project |
| git | 2.50.1 | none | ok |
| Docker | Desktop 29.7.2, daemon running; amd64 emulated through Rosetta | needed for the browser suites (ADR 0010, 0027) | ok; pinned image pulled 2026-09-24 with the product owner's consent: Ubuntu 24.04.4, Node 24.20.0 (type stripping), chromium 1243, Liberation Sans |
| Playwright browsers | cached builds present | repo installs its own pinned build | ok |
| Python fontTools | missing | not needed (Node `fontkit` / `subset-font`) | n/a |

## 2. Pinned versions

| Area | Package | Version | Deciding constraint |
|---|---|---|---|
| Framework | `@angular/{core,common,compiler,forms,router,platform-browser}` | 22.2.0 | Latest stable (released 2026-09-23); installed 2026-09-25. Its compiler scopes nested CSS rules (ADR 0024, addendum) and adds `strictUnclaimedEventNames` (ADR 0022, addendum). `@avelune/ui` peers `core`, `common` and `forms` `^22.2.0`, and `router` since Breadcrumbs (2026-09-29, ADR 0070) |
| | `@angular/cli`, `@angular/build`, `@angular-devkit/{core,schematics}`, `@schematics/angular` | 22.2.0 | Schematics toolchain for `ng add` / `ng update`. `@angular/build` peers TS `>=6.0 <6.1`, Vitest `^4.0.8 \|\| ^5.0.0` |
| | `@angular/cdk`, `@angular/aria` | 22.2.0 | Peers `@angular/core ^22 \|\| ^23`; Aria peers `@angular/cdk` 22.2.0 exactly; stable since 22.0. `@avelune/ui` peers both (`^22.2.0`) since the select family (ADR 0046) |
| | `typescript` | ~6.0.3 | Angular `>=6.0 <6.1`; npm `latest` is 7.0.2, not supported |
| | `ng-packagr` | 22.1.1 | Peers `@angular/compiler-cli ^22.0.0`, so it builds with 22.2; TS `>=6.0 <6.1`. *Held back*: 22.2.x bundles the `.d.ts` with `rolldown-plugin-dts`, which writes no `export {…}` when every export is inline; TypeScript then exports every declaration of such a file, and `@avelune/ui/form-field` exposed its internal `AVE_FIELD_PARTS` and `AveFieldParts` (found by `ui:api-report`, proven with `tsc`, 2026-09-25) |
| | `rxjs`, `tslib` | 7.8.2, 2.8.1 | Angular peers |
| Workspace | `nx`, `@nx/{js,eslint,eslint-plugin}` | 23.2.1 | `@nx/angular` is not used: Nx runs the Angular builders directly, so the Angular version does not constrain Nx |
| | `pnpm` | 11.27.1 | ADR 0012 |
| Unit tests | `vitest`, `@vitest/browser`, `@vitest/browser-playwright`, `@vitest/coverage-v8` | 4.1.11 | `@angular/build` 22.2 peers `^4.0.8 \|\| ^5.0.0`; `@storybook/addon-vitest` 10.6.0 and `@nx/vitest` 23.2.1 still peer `^3 \|\| ^4` (ADR 0013; re-checked 2026-09-25); installed in Phase 3 (2026-09-24) |
| | `playwright` | 1.63.0 | Peer of `@vitest/browser-playwright`; its chromium 1243 was already in the user's Playwright cache, and its install script stays blocked (`allowBuilds`) |
| | `vite` | 8.3.0 | Required by `@storybook/angular-vite` |
| Storybook | `storybook`, `@storybook/angular-vite`, `@storybook/addon-{vitest,a11y,docs}` | 10.6.0 | ADR 0008. Installed in Phase 2; `addon-vitest` added in Phase 3 (2026-09-24). JIT since ADR 0025. `angular-vite` carries a pnpm patch (ADR 0035): an upgrade must re-create or drop it |
| | `@storybook/addon-mcp` | 10.6.0 | Peers `storybook ^10.6.0` and `@storybook/addon-vitest ^10.6.0` (ours); depends on `tmcp` 1.20.0, `@tmcp/transport-http` 0.8.6, `@tmcp/adapter-valibot` 0.1.6, `valibot` 1.5.0. Checked on the registry and installed 2026-09-30 (released 2026-09-02); 10.6.1 (2026-09-29 17:14 UTC) waits with the other Storybook packages (ROADMAP.md, "Tracked upgrades"). The docs toolset only (ADR 0090) |
| | `@analogjs/vite-plugin-angular` | 2.7.4 | Required peer of `angular-vite` (≥ 2.0.0). 2.7.3 is the first that initialises `@angular/build` 22.2's hash utility; with 2.7.2 the Storybook build fails (`Hash utility must be initialized`). Installed 2026-09-25 (released 2026-09-24 13:18 UTC, allowed by ADR 0042) |
| | `@angular/animations` | 22.2.0 | Required peer of `angular-vite` 10.6; devDependency only, never imported (ADR 0005, 0008). npm marks it deprecated |
| | `@angular-devkit/architect` | 0.2202.0 | Required peer of `angular-vite`; matches CLI 22.2.0 |
| | `react`, `@types/react` | 19.3.0 | The React addon-docs 10.6 resolves (its dependency, peer range `^16.8 … ^19`), imported by the themed docs container; one copy in the lockfile. devDependencies only (ADR 0034). Installed 2026-09-24 (released 2026-09-09) |
| | `remark-gfm` | 4.0.1 | GitHub-flavoured Markdown (tables) in the MDX docs pages; ESM, unified 11 like addon-docs' MDX 3. devDependency (ADR 0034). Installed 2026-09-24 (released 2025-02-10) |
| E2E / visual | `@playwright/test` | 1.63.0 | Must equal the image tag `mcr.microsoft.com/playwright:v1.63.0-noble`, pinned by the amd64 digest in `tools/visual/src/image.ts` (`visual:test` checks it). Installed in Phase 3 (2026-09-24; released 2026-09-04) |
| | `@axe-core/playwright` (brings `axe-core` ~4.13.0) | 4.13.0 | Peers `playwright-core >= 1.0.0`; resolves to 1.63.0. Installed in Phase 3 (2026-09-24; released 2026-08-11). Import the named `AxeBuilder`: under `nodenext` the default import types as the module |
| Lint (TS/HTML) | `eslint` | 10.11.0 | |
| | `@eslint/js`, `globals` | 10.0.1, 17.12.0 | Recommended rules; Node globals for scripts |
| | `typescript-eslint` | 8.70.1 | Peers TS `<6.1.0`. `strictTypeChecked` through the project service (ADR 0023) |
| | `@typescript-eslint/utils`, `@typescript-eslint/rule-tester` | 8.70.1 | Authoring and testing the `avelune` rules (`tools/lint-rules`); peer ESLint `^10`, TS `<6.1.0`; installed in Phase 3 (2026-09-24) |
| | `angular-eslint` | 22.5.0 | Peers ESLint `^9 \|\| ^10`, typescript-eslint `^8`; depends on `@angular-devkit/*` `>=22 <23`. Installed in Phase 3 (2026-09-24; released 2026-09-07) |
| | `@eslint-community/eslint-plugin-eslint-comments` | 4.8.1 | `require-description` for disables; peers ESLint `^10`. Installed in Phase 3 (2026-09-24) |
| Lint (CSS) | `stylelint` | 17.15.0 | Installed in Phase 3 (2026-09-24; released 2026-09-04) |
| | `stylelint-config-standard` | 40.0.0 | Peers `^17` |
| | `stylelint-declaration-strict-value` | 1.12.1 | Peers `>=16 <=17` (17.x included) |
| | `stylelint-value-no-unknown-custom-properties` | 6.1.1 | Peers `>=16` |
| | `stylelint-plugin-logical-css` | 2.1.0 | Replaces `stylelint-use-logical-spec` (ADR 0009); rule names re-verified in Phase 3 |
| Browser data | `@mdn/browser-compat-data` | 8.1.2 | Derives the logical-property exceptions at the floor (ADR 0024) |
| | `browserslist` | 4.29.0 | Reads `.browserslistrc` for guardrail tests; the same version Angular's build resolves |
| Tokens | `style-dictionary` | 5.5.5 | DTCG colour objects since 5.3, dimension objects since 5.4; duration/gradient still WIP (issue #1590). Installed in Phase 2 (released 2026-09-20); used as the resolver, values converted by our own code (ADR 0017) |
| | `colorjs.io` | 0.7.1 | ADR 0011; installed in Phase 2 (released 2026-07-24). A runtime dependency of `@avelune/tokens` since the brand generator (ADR 0089, 2026-09-30), imported module by module (`colorjs.io/src/*.js`): the `colorjs.io/fn` barrel brings every colour space into a bundle, as the package declares no side-effect-free modules |
| Masks | `@maskito/core`, `@maskito/kit` | 5.6.0 | ADR 0100; released 2026-09-28, Apache-2.0, no dependencies; runtime dependencies of `@avelune/ui`, bundled only by `@avelune/ui/mask` (5.92 kB brotli with the directive, 2026-09-30) |
| API | `@microsoft/api-extractor` | 7.59.2 | Bundles TS 5.9.3; works on TS 6 output (ADR 0007, spike result). Installed 2026-09-25 |
| Release | `@changesets/cli` | 3.0.3 | Node `^22.11 \|\| ^24`, pnpm `>=10` |
| Hooks | `lefthook` | 2.1.14 | |
| | `@commitlint/cli`, `@commitlint/config-conventional`, `@commitlint/config-nx-scopes` | 21.2.3 | Node `>=22.12`; scopes = Nx project names |
| Format | `prettier` | 3.9.9 | Installed 2026-09-25 |
| Budgets | `size-limit`, `@size-limit/file`, `@size-limit/esbuild` | 14.0.0 | Node `^22.19 \|\| ^24.5 \|\| >=26`; plugins peer `size-limit` 14.0.0; `@size-limit/esbuild` uses esbuild `^0.28.2`, deduplicated with Angular's 0.28.2 (ADR 0028). Installed in Phase 3 (2026-09-24; released 2026-09-15) |
| Bundling | `esbuild` | 0.28.2 | Bundles `@avelune/eslint-config` and `@avelune/stylelint-config` with the rules of `tools/lint-rules` (ADR 0104). The latest release (2026-08-08), Node `>=18`, MIT; the copy `@angular/build` 22.2.0 and `@size-limit/esbuild` already resolve, so no new download. Direct devDependency since 2026-10-02 |
| Node types | `@types/node` | 24.13.6 | Follows `engines.node` (^24.15.0), not npm `latest` (26.x); ADR 0015 |
| Icons | `lucide-static` | 1.48.0 | ISC. `icon-nodes.json` (all 1854 icons) and the licence are read only by `packages/icons/scripts` at generation time, and `tags.json` by the Icon gallery story; nothing ships at run time (ADR 0020, 0033, 0036). Installed in Phase 4 (1.47.0, 2026-09-24); 1.48.0 on 2026-09-25: six new icons (`briefcase-plus`, `house-cog`, `line-dot-bottom-vertical`, `line-dot-left-horizontal`, `line-dot-top-vertical`, `square-sparkles`), three redrawn (`card-sim`, `mail-pen`, `map-pinned`; none used by the kit), the whole set 75.19 kB of 78 kB |
| Fonts | `fontkit` + `@types/fontkit` | 2.0.4, 2.0.9 | cmap coverage check, metrics (ADR 0018) |
| | `subset-font` | 2.9.0 | woff2 subsetting and axis limits (HarfBuzz wasm via `harfbuzzjs` 1.6.2, no Python) |
| | `fontverter` | 2.0.0 | TTF ↔ woff2 (a `subset-font` dependency, used directly) |

## 3. Known gaps and how they are handled

| Gap | Handling |
|---|---|
| `@storybook/angular` (official) is webpack-only; the Vite framework is in preview | ADR 0008 |
| `@storybook/angular-vite` 10.6 requires `@angular/animations` as a peer | devDependency for Storybook only; import banned by ESLint (ADR 0005, 0008) |
| API Extractor bundles TS 5.9.3 | spike passed in Phase 1; cross-entry-point imports need an analysis layout (ADR 0007, spike result) |
| Angular 22 supports "Baseline widely available" browsers: Chrome/Edge/Firefox ≥ 119, Safari/iOS ≥ 17; the original floor listed Chrome/Edge 117–118 | floor raised to Chrome/Edge 119 (ADR 0014, accepted 2026-09-23); re-checked on every Angular upgrade |
| `stylelint-use-logical-spec` peers `stylelint <17`, unmaintained since 2024-10 | ADR 0009 |
| Style Dictionary DTCG duration support unfinished | custom transform; `tools/tokens-check` validates the schema itself (ADR 0003) |
| Vitest 5 needs Angular 22.2 and Storybook 11 | stay on 4.1.x (ADR 0013) |
| Angular Aria has no separate Select / Autocomplete / Multiselect / Menubar entry points | built as documented patterns over Combobox + Listbox; MenuBar lives in `@angular/aria/menu` (ADR 0002) |

## 4. Font coverage (IBM Plex Sans)

Checked with `fontkit` against `google/fonts/ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf`:

| Requirement | Result |
|---|---|
| U+02BB `ʻ` (Oʻ, Gʻ), U+02BC `ʼ` | present |
| Cyrillic U+0400–045F | complete |
| Uzbek Cyrillic Ў ў Қ қ Ғ ғ Ҳ ҳ | present |
| Latin-1, Latin Extended-A | complete |
| «» – — ‘ ’ “ ” „ № | present |
| Figures | tabular by default |
| Axes | `wght` 100–700, `wdth` 75–100 |

Other candidates checked: Inter, Noto Sans and Onest pass. Golos Text, Manrope, PT Sans, Rubik and Geologica fail (no U+02BB; Manrope and Rubik also miss Uzbek Cyrillic letters).

IBM Plex Mono 2.3 (the code font, chosen at the Foundations milestone) covers the same Latin, Uzbek and Cyrillic characters; it lacks U+202F, which code does not need.

Phase 2 (2026-09-23): `fonts:check` repeats the check on the shipped woff2 subsets on every run. Findings: Google's `cyrillic` range lacks Ғ Қ Ҳ, so the kit's cyrillic subset adds them; Plex's U+02BB/U+02BC glyphs are 0.6 em wide and are mapped to ‘ ’; the subsets are renamed "Avelune Sans" for the OFL Reserved Font Name (ADR 0018).
