# Migrating an existing application to Avelune

For an Angular 22.2+ application on the application builder that already has a UI of its own: another kit, Tailwind, hand-written CSS, or all three. New screens are built on the kit only; old screens move when they are touched (ROADMAP, "Adoption plan"). The agent rules that `ng add` puts into `AGENTS.md` (`docs/consumers/AGENTS.snippet.md`) and [GUIDELINES.md](../GUIDELINES.md) say how to build with the kit; this page says how to get there.

## 1. Measure

Scan the application before changing anything, from a checkout of the kit's repository (ADR 0105):

```bash
pnpm nx run adoption-metrics:scan -- <path to the application> --name <name> --json baseline.json
```

The summary counts what keeps the application off the kit: raw colours and pixel values, raw interactive elements, local keyframes, `::ng-deep`, `--ave-*` overrides, inline styles in templates and banned imports, file by file. Keep `baseline.json` in the application's repository, and record the counts in the kit's `docs/audit.md`, as for `e-archive` (§1.1). Vendored files in `public` or `vendor` folders are left out; leave out more with `--exclude <glob>`.

## 2. Set up

Run `ng add @avelune/ui` (ADR 0103; the steps are in `packages/ui/README.md`). Then review its diff with these in mind:

- **Caching of `media/`.** `ng add` sets `outputHashing: bundles`, so fonts keep their names (`media/avelune-sans-latin.woff2`) and `index.html` can preload them. A server that caches `media/` as immutable serves an old font for as long as it caches it. Serve `media/` with revalidation (`Cache-Control: no-cache`), and keep `immutable` for the hashed bundles only. `e-archive`'s `nginx.conf` matches `media/[^/]+` together with the hashed bundles under a year and `immutable`; take `media/` out of that location.
- **`data-theme` on `<html>`.** The kit reads `data-theme="light"` or `"dark"` and writes it through `AveTheme`. If the old UI writes the same attribute, let one of them own it: `AveTheme`, with the old UI following `AveTheme.theme()`. A `data-theme` written in `index.html` for the first visit stays; pass the same default to `provideAvelune({ theme })`.
- **Lint configs.** Where the workspace had none, `ng add` wrote `eslint.config.mjs` and `stylelint.config.mjs`. Where it had its own, add the kit's to them and list the old code as legacy, so that it warns while new code fails:

  ```js
  // eslint.config.mjs
  import avelune from '@avelune/eslint-config';
  import { defineConfig } from 'eslint/config';

  export default defineConfig(...ownConfigs, avelune({ legacy: ['src/app/features/**'] }));
  ```

  ```js
  // stylelint.config.mjs
  export default {
    extends: ['@avelune/stylelint-config'],
    overrides: [{ files: ['src/app/features/**', 'src/styles/**'], defaultSeverity: 'warning' }],
  };
  ```

  An application with its own `no-restricted-imports` merges the kit's `restrictedImports` into it (`packages/eslint-config/README.md`).

## 3. Run both styles side by side

The kit's stylesheet puts every rule in a cascade layer: `reset, tokens, base, components, patterns, utilities, app`, in that order (ADR 0004, 0030). Three things follow, each checked in a fresh application on 2026-10-02:

- **Keep `@avelune/ui/styles.css` first in `styles`.** It declares the order, and a layer's place is fixed where it is first named. When a stylesheet that names its own layers came first, the kit's `reset` landed above its `components`, and a kit button lost its weight (500 became 400). Nothing in `index.html` may declare layers before it either.
- **Put the old global CSS in a layer.** Unlayered CSS beats every layer: an old reset such as `button { background-color: transparent; border-radius: 0 }`, left unlayered, wiped the kit's primary button. Import such stylesheets into the kit's `base` layer, where the kit's components win and the old screens keep their look:

  ```css
  /* the application's global stylesheet, after the kit's */
  @import url('./legacy/global.css') layer(base);
  ```

  Imported this way, the same reset left the kit's button as it was and still reset the old screens' native buttons; the build wraps the file in `@layer base`.
- **Tailwind 4** names its layers `theme, base, components, utilities`. Loaded after the kit's stylesheet, `base`, `components` and `utilities` merge into the kit's layers of those names. Its preflight sits in `base`, under the kit's components; its utilities sit in `utilities`, above them, so a utility class on a kit element restyles it. Never put utilities on kit elements: style their surroundings. `theme` comes after `app` and holds Tailwind's own custom properties only. The scan does not read utility classes; review them by hand.

Component styles of the old UI are unlayered but scoped to their own components by Angular's emulated encapsulation, so they do not reach the kit's elements. Global typography on `html` or `body` from the old UI is inherited by the kit's components too: move it onto the old screens' containers as they are migrated.

## 4. Move a screen

Take one screen at a time, when its feature is touched. In each, in this order:

1. **Controls.** Replace every native or old-kit control with the kit's; the raw-element count goes down first.

   | Was | Becomes |
   |---|---|
   | `<button>` | `button[aveButton]` (`variant`, `size`); icon-only `button[aveIconButton]` with `icon` and `label` |
   | `<a>` | `a[aveLink]`, or `a[aveButton]` when it looks like a button |
   | `<input>` with its label and hint | `input[aveInput]` inside `<ave-form-field label>` with `[aveHint]` and `[aveError]` |
   | checkbox, switch, radio | `input[type=checkbox][aveCheckbox]`, `input[type=checkbox][aveSwitch]`, `input[type=radio][aveRadio]` in `fieldset[aveChoiceGroup]` |
   | `<textarea>` | `textarea[aveTextarea]` |
   | `<select>` | `<ave-select>` (6–15 options), `<ave-combobox>` (more, with search), `<ave-multiselect>`; up to five options are radios (GUIDELINES) |
   | a modal, a side panel, a confirmation | `dialog[aveDialog]`, `dialog[aveDrawer]`, `dialog[aveConfirmDialog]` |
   | a snackbar, a tooltip, a context menu | `AveToaster`, `[aveTooltip]`, `<ave-menu>` |
   | `<progress>` | `progress[aveProgress]` |
   | a table, its paging | `<ave-data-table>`, `<ave-pagination>` |
   | an icon from another set | `<ave-icon name label>` or `decorative`, registered with `provideAveIcons` |

   A whole page often fits a page pattern (`<ave-list-page>`, `<ave-list-detail>`, `form[aveFormPage]`, `<ave-settings-page>`, `<ave-dashboard>`, ADR 0091). Use it rather than placing the controls by hand.
2. **Values.** Colours, lengths, radii, shadows and durations become semantic tokens (`var(--ave-color-fg-muted)`, `var(--ave-space-4)`); query widths become breakpoint tokens. The Foundations pages list every token.
3. **Motion.** Local `@keyframes` give way to the motion catalog's classes with `animate.enter` and `animate.leave`.
4. **Clean up.** Remove the screen's folder from the `legacy` globs and the Stylelint override, delete the old components it no longer uses, and scan again.

## 5. Track

Scan again at every kit release, and on the application's main branch before a release of its own, against the last report:

```bash
pnpm nx run adoption-metrics:scan -- <path> --name <name> --previous baseline.json --ratchet --json report.json
```

`--ratchet` fails when any count rose, so a new screen cannot bring raw values back. Each count's change is in the summary, which CI shows when `$GITHUB_STEP_SUMMARY` is set. Keep the new report as the next baseline. The summary also shows how far the installed kit is behind; `ng update @avelune/ui` moves every `@avelune` package together and runs the kit's migrations (ADR 0007).

Until the tool is published, the kit's team runs it against a checkout of the application and appends the result to `docs/audit.md`.

## 6. Finish

The migration is done when every count is zero, or holds only what the team decided to keep and wrote down in `docs/audit.md`. At that point:

- empty the `legacy` globs and the Stylelint override, so every rule fails again;
- remove the old UI's packages and its global stylesheets;
- drop the layer imports of step 3 that nothing needs any more.
