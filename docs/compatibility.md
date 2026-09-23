# Compatibility matrix

Verified on 2026-09-23 with `npm view <pkg> version peerDependencies engines` and the official docs. Re-verify before every upgrade; update this file in the same merge request as the version change.

## 1. Environment (development machine, Phase 0 doctor)

| Tool | Found | Requirement | Status |
|---|---|---|---|
| macOS | 15.7.7, arm64 | none | ok |
| Node | 24.21.0 (nvm) | Angular 22: `^22.22.3 \|\| ^24.15.0 \|\| >=26` | ok |
| pnpm | 10.26.1 (Homebrew) | repo pins 11.27.1 via `packageManager` (ADR 0012) | ok; pnpm switches per project |
| git | 2.50.1 | none | ok |
| Docker | Desktop 29.7.2, daemon running | needed for visual tests (ADR 0010) | ok |
| Playwright browsers | cached builds present | repo installs its own pinned build | ok |
| Python fontTools | missing | not needed (Node `fontkit` / `subset-font`) | n/a |

## 2. Pinned versions

| Area | Package | Version | Deciding constraint |
|---|---|---|---|
| Framework | `@angular/{core,common,compiler,forms,router,platform-browser}` | 22.1.7 | Latest stable; 22.2.0 is rc |
| | `@angular/cli`, `@angular/build` | 22.1.8 | |
| | `@angular/cdk`, `@angular/aria` | 22.2.0 | Peers `@angular/core ^22 \|\| ^23`; Aria stable since 22.0 |
| | `typescript` | ~6.0.3 | Angular `>=6.0 <6.1`; npm `latest` is 7.0.2, not supported |
| | `ng-packagr` | 22.2.0 | Peers `@angular/compiler-cli ^22` |
| Workspace | `nx`, `@nx/*` | 23.2.1 | Nx matrix: Angular ~22.1 needs Nx ≥ 23.2.0 |
| | `pnpm` | 11.27.1 | ADR 0012 |
| Unit tests | `vitest`, `@vitest/browser-playwright`, `@vitest/coverage-v8` | 4.1.11 | `@angular/build` 22.1 peers `^4.0.8`; `@storybook/addon-vitest` and `@nx/vitest` peer `^3 \|\| ^4` (ADR 0013) |
| | `vite` | 8.3.0 | Required by `@storybook/angular-vite` |
| Storybook | `storybook`, `@storybook/angular-vite`, `@storybook/addon-{vitest,a11y,docs}` | 10.6.0 | ADR 0008 |
| E2E / visual | `@playwright/test` | 1.63.0 | Docker `mcr.microsoft.com/playwright:v1.63.0-noble` (amd64 + arm64) |
| | `axe-core`, `@axe-core/playwright` | 4.13.0 | |
| Lint (TS/HTML) | `eslint` | 10.11.0 | |
| | `typescript-eslint` | 8.70.1 | Peers TS `<6.1.0` |
| | `angular-eslint` | 22.5.0 | Peers ESLint `^9 \|\| ^10` |
| | `@eslint-community/eslint-plugin-eslint-comments` | 4.8.1 | `require-description` for disables |
| Lint (CSS) | `stylelint` | 17.15.0 | |
| | `stylelint-config-standard` | 40.0.0 | Peers `^17` |
| | `stylelint-declaration-strict-value` | 1.12.1 | Peers `>=16 <=17` |
| | `stylelint-value-no-unknown-custom-properties` | 6.1.1 | Peers `>=16` |
| | `stylelint-plugin-logical-css` | 2.1.0 | Replaces `stylelint-use-logical-spec` (ADR 0009) |
| Tokens | `style-dictionary` | 5.5.5 | DTCG colour objects since 5.3, dimension objects since 5.4; duration/gradient still WIP (issue #1590) |
| | `colorjs.io` | 0.7.1 | ADR 0011 |
| API | `@microsoft/api-extractor` | 7.59.2 | Bundles TS 5.9.3; TS 6 not officially supported (ADR 0007) |
| Release | `@changesets/cli` | 3.0.3 | Node `^22.11 \|\| ^24`, pnpm `>=10` |
| Hooks | `lefthook` | 2.1.14 | |
| | `@commitlint/cli`, `@commitlint/config-conventional` | 21.2.3 | Node `>=22.12` |
| Budgets | `size-limit`, `@size-limit/*` | 14.0.0 | Node `^24.5` |
| Fonts | `fontkit` | 2.0.4 | cmap coverage check |
| | `subset-font` | 2.9.0 | woff2 subsetting (HarfBuzz wasm, no Python) |

## 3. Known gaps and how they are handled

| Gap | Handling |
|---|---|
| `@storybook/angular` (official) is webpack-only; the Vite framework is in preview | ADR 0008 |
| `@storybook/angular-vite` 10.6 requires `@angular/animations` as a peer | devDependency for Storybook only; import banned by ESLint (ADR 0005, 0008) |
| API Extractor bundles TS 5.9.3 | spike in Phase 1, fallback defined (ADR 0007) |
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

Other candidates checked: Inter, Noto Sans and Onest pass. Golos Text, Manrope, PT Sans, Rubik and Geologica fail (no U+02BB; Manrope and Rubik also miss Uzbek Cyrillic letters). Phase 2 repeats the check on the subsetted woff2 files the kit actually ships.
