# lint-rules

The `avelune` ESLint plugin (`src/index.ts`) and the tests that prove the workspace ESLint config (ADR 0023). The root `eslint.config.mjs` loads the plugin from source; `@avelune/eslint-config` will bundle it for consumers (Phase 6).

| Rule | Applies to | Rejects |
|---|---|---|
| `avelune/entry-point-layers` | `packages/ui` | imports up the layer order of `entry.json`; deep imports (`@avelune/ui/<name>/<file>`); relative imports that leave the entry point; a `testing` entry point in runtime code; a missing or unknown layer |
| `avelune/public-api-jsdoc` | `packages/ui`, not specs or stories | an exported declaration, or a public member of one, without a JSDoc block (lifecycle and forms-interface methods excepted) |
| `avelune/no-appearance-inputs` | `packages/ui` | inputs or models named `class`, `style`, `color`, `appearance`, `ngClass`, … (aliases too) |
| `avelune/no-raw-elements` | consumers (in this repo: the showcase) | `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>` without a kit attribute from `src/kit-elements.ts` |

When a component that enhances a native element lands, add its attribute to `kitElements` in `src/kit-elements.ts` in the same merge request.

## Tests

`pnpm nx run lint-rules:test`:

- `src/rules/*.spec.ts` are RuleTester cases for each rule. `entry-point-layers` lints virtual files inside `fixtures/library`, a miniature library that contains only the manifests.
- `src/config.spec.ts` lints every file in `fixtures/config` through the real `eslint.config.mjs`, as if it were the path on its `Lint as:` line. Each fixture must produce exactly the rules on its `Expect:` line (`none` for a fixture that must pass).
  - A path that exists is linted with full type information: the fixture's text replaces the file's.
  - A path that does not exist is linted without type information.

  The spec also checks that every plugin rule has a fixture and that the config enables no rule as a warning.
