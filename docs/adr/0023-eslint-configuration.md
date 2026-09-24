# 0023. ESLint: strict type-aware presets, kit rules, fixtures that lint as real paths

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0001, 0002, 0004, 0005, 0007, 0015, 0022; brief §5.2, §9.1

## Context

Brief §5.2 lists what ESLint must enforce: angular-eslint recommended and template accessibility rules, the `ave` selector prefix, no inline styles, no `@angular/animations`, no deep imports, `@nx/enforce-module-boundaries`, a description on every disable comment, and a consumer rule against raw native elements. Brief §9.1 and ADRs 0001, 0002 and 0004 add rules that only a linter can see: the signal API, the `host` object, emulated encapsulation, entry-point layers, no Angular Material, and no appearance inputs. ADR 0007 moved the JSDoc check on public API from API Extractor to ESLint.

Versions (verified 2026-09-24): ESLint 10.11.0, typescript-eslint 8.70.1, angular-eslint 22.5.0, `@eslint-community/eslint-plugin-eslint-comments` 4.8.1.

## Decision

1. **Presets:** `@eslint/js` recommended, typescript-eslint **`strictTypeChecked`** through the project service, angular-eslint `tsRecommended`, `templateRecommended` and `templateAccessibility`, and eslint-comments `recommended` plus `require-description`. Inline templates are linted through `processInlineTemplates`.
2. **Every rule is an error**, and lint targets run with `--max-warnings=0`. Two strict rules take an option, each for a stated reason:
   - `restrict-template-expressions` allows numbers.
   - `no-extraneous-class` allows decorated classes, because Angular declarations are decorated.

   `no-floating-promises` exempts `describe` and `it` from `node:test`, whose runner awaits them.
3. **Additional angular-eslint rules**, listed in `eslint.config.mjs`:
   - the `ave` prefix: kebab-case for elements, camelCase for attributes;
   - the signal API: `prefer-signals`, `prefer-signal-model`, `prefer-output-emitter-ref`;
   - the `host` object instead of `@HostBinding` and `@HostListener`;
   - no `ViewEncapsulation.None` or `ShadowDom`, enforced by angular-eslint plus a `no-restricted-syntax` selector;
   - lifecycle and reactive-context correctness;
   - no developer-preview APIs;
   - template rules: `no-inline-styles`, `button-has-type`, `no-any`, no non-null assertion, and the built-in control-flow rules (`@default never` for exhaustive switches).
4. **`no-restricted-imports`** bans `@angular/animations`, including `platform-browser/animations`, and `@angular/material`. It also bans every `@avelune/ui/<name>/…` path except `/testing`.
5. **Custom rules** live in `tools/lint-rules` and are published as the `avelune` plugin:
   - `entry-point-layers` (packages/ui): imports follow the layer order in `entry.json`, go only through public specifiers, never cross an entry point with a relative path, and never pull a `testing` entry point into runtime code.
   - `public-api-jsdoc` (packages/ui, not specs or stories): a JSDoc block on every exported declaration and on every public member. Lifecycle and forms-interface methods are exempt.
   - `no-appearance-inputs` (packages/ui): no `class`, `style`, `color`, `appearance` or similar inputs, including aliases.
   - `no-raw-elements` (consumers; here the showcase): `<button>`, `<input>`, `<select>`, `<textarea>` and `<dialog>` must carry a kit attribute. The list is `kitElements` in `tools/lint-rules/src/kit-elements.ts`. It is empty today, so every one of these elements is an error. Each component that enhances a native element adds its attribute to the list when it lands.
6. **Documented exception:** the Foundations pages (`apps/storybook/src/foundations/**`) may bind `[style.*]`, because they draw swatches from token variables. Static `style` attributes and `[ngStyle]` stay banned there too.
7. **Proof** (`lint-rules:test`):
   - RuleTester cases for each custom rule, run under `node:test`.
   - Workspace fixtures in `tools/lint-rules/fixtures/config`. Each one is linted through the real `eslint.config.mjs` as if it were the file on its `Lint as:` line, and must produce exactly the rules on its `Expect:` line. A fixture linted as an existing file gets full type information, because the project service lints the fixture's text in place of the file's.
   - Two more assertions: every plugin rule has a workspace fixture, and no enabled rule is a warning.
8. Projects whose builds use `tsconfig.lib.json` or `tsconfig.app.json` also get a `tsconfig.json`, so the project service and editors see the same strict options. The `packages/ui/schematics` copy script skips it.

## Alternatives considered

- **`recommendedTypeChecked` instead of `strict`:** misses `no-unnecessary-condition`, `no-deprecated`, `no-confusing-void-expression` and similar rules. The whole repository passed `strict` after small fixes. Rejected.
- **No type-aware linting:** `any` leaking from `JSON.parse`, `Reflect` or libraries would reach code that the compiler already accepts. Rejected.
- **`eslint-plugin-jsdoc` for the JSDoc rule:** it doesn't know which Angular members are public API or which interface methods to skip, and it is a large dependency. Rejected in favour of a small custom rule.
- **Fixtures as RuleTester cases only:** they would prove the rules but not the configuration: file globs, overrides and exceptions. Rejected; both levels exist.

## Consequences

- Consumers get `no-raw-elements`, `no-restricted-imports` and the template rules through `@avelune/eslint-config`. That package bundles `tools/lint-rules` when it is first published (Phase 6).
- A new custom rule fails `lint-rules:test` until it has a workspace fixture.
- Type-aware lint is slower than syntax-only lint. Nx caches it (inputs include `^production`), and pre-commit lints only staged files.
