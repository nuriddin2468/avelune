# lint-rules

The `avelune` ESLint plugin (`src/index.ts`), the `avelune` Stylelint rules (`src/stylelint/`), and the tests that prove the workspace ESLint and Stylelint configs (ADR 0023, 0024). The root configs load them from source; `@avelune/eslint-config` and `@avelune/stylelint-config` will bundle them for consumers (Phase 6).

| Rule | Applies to | Rejects |
|---|---|---|
| `avelune/entry-point-layers` | `packages/ui` | imports up the layer order of `entry.json`; deep imports (`@avelune/ui/<name>/<file>`); relative imports that leave the entry point; a `testing` entry point in runtime code; a missing or unknown layer |
| `avelune/public-api-jsdoc` | `packages/ui`, not specs or stories | an exported declaration, or a public member of one, without a JSDoc block (lifecycle and forms-interface methods excepted) |
| `avelune/no-appearance-inputs` | `packages/ui` | inputs or models named `class`, `style`, `color`, `appearance`, `ngClass`, … (aliases too) |
| `avelune/no-raw-elements` | consumers (in this repo: the showcase) | `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>` without a kit attribute from `src/kit-elements.ts` |

When a component that enhances a native element lands, add its attribute to `kitElements` in `src/kit-elements.ts` in the same merge request.

| Stylelint rule | Applies to | Rejects |
|---|---|---|
| `avelune/nesting-same-element` | all CSS | a nested rule, also under an at-rule, that selects anything but the parent element (`&` + pseudo-classes, pseudo-elements, attributes) |
| `avelune/media-query-tokens` | all CSS | a width in `@media` that is not a breakpoint token, or in `@container` that is not a container token (read from `tokens.css`) |
| `avelune/component-layer` | `packages/ui/<entry>/**/*.css`; `packages/ui/styles/*.css` | a rule outside `@layer components`; in the global stylesheets, outside `@layer reset`, `base` or `utilities` |
| `avelune/layer-order` | `packages/ui/styles/styles.css` | a first statement other than the kit's layer order, a second layer statement (ADR 0030) |

## Tests

`pnpm nx run lint-rules:test`:

- `src/rules/*.spec.ts` are RuleTester cases for each rule. `entry-point-layers` lints virtual files inside `fixtures/library`, a miniature library that contains only the manifests.
- `src/config.spec.ts` lints every file in `fixtures/config` through the real `eslint.config.mjs`, as if it were the path on its `Lint as:` line. Each fixture must produce exactly the rules on its `Expect:` line (`none` for a fixture that must pass).
  - A path that exists is linted with full type information: the fixture's text replaces the file's.
  - A path that does not exist is linted without type information.

  The spec also checks that every plugin rule has a fixture and that the config enables no rule as a warning.
- `src/stylelint/*.spec.ts` covers the Stylelint side:
  - unit tests for each `avelune` Stylelint rule;
  - `config.spec.ts`, which lints every file in `fixtures/stylelint` through the real `stylelint.config.mjs` in the same `Lint as:` / `Expect:` form;
  - `logical.spec.ts`, which derives the allowed physical properties and keywords from the plugin, MDN browser-compat-data and `.browserslistrc`, and compares them with the config;
  - `encapsulation.spec.ts`, which pins how Angular's emulated shim treats nested CSS.
