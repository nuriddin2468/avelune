# @avelune/eslint-config

ESLint rules for applications built on Avelune (ADR 0104). They cover templates and imports; TypeScript strictness and code style stay the application's.

- **Templates**, in `.html` files and in inline templates: angular-eslint's recommended and accessibility rules; no inline styles, typed buttons, no positive `tabindex`, no attribute set twice. Every `<ave-icon>` has a `label` or is `decorative` (`avelune/icon-label`). `<button>`, `<input>`, `<textarea>`, `<progress>`, `<dialog>` and `<a>` carry the kit's directive, and `<select>` is replaced by the kit's component (`avelune/no-raw-elements`).
- **Imports**: never `@angular/animations`, Angular Material, or a kit entry point's internals (`@avelune/ui/button/button`); `@avelune/ui/<name>` and `@avelune/ui/<name>/testing` only.

## Use

`ng add @avelune/ui` installs it and writes `eslint.config.mjs` when the workspace has none (ADR 0103). By hand:

```js
// eslint.config.mjs
import avelune from '@avelune/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  // the application's own configs first, then:
  avelune({ legacy: ['src/app/legacy/**'] }),
);
```

`legacy` lists code written before the kit. There the kit's rules warn instead of failing, until the code is migrated; new code stays under errors (ROADMAP, "Adoption plan").

An application with its own `no-restricted-imports` merges the kit's, because a later setting of a rule replaces an earlier one:

```js
import avelune, { restrictedImports } from '@avelune/eslint-config';

const own = { paths: [{ name: 'lodash', message: 'Use the platform.' }], patterns: [] };

export default defineConfig(avelune(), {
  rules: {
    'no-restricted-imports': [
      'error',
      { paths: [...restrictedImports.paths, ...own.paths], patterns: [...restrictedImports.patterns, ...own.patterns] },
    ],
  },
});
```

Peers: `eslint` 10, `angular-eslint` 22.5, `typescript-eslint` 8.70.

## In this repository

The source is `tools/lint-rules/src/consumers/eslint-config.ts`. `pnpm nx run eslint-config:build` bundles it with the rules it imports into `dist/`, and `pnpm nx run eslint-config:test` lints code through the built package. The kit's own `eslint.config.mjs` shares the restricted imports and template rules with it (`tools/lint-rules/src/application-rules.ts`). `private` is removed at the first publish.
