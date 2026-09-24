# 0022. Compiler strictness: required options, checked in every tsconfig, proven by fixtures

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0006, 0015; brief §1 rule 5, §5.1

## Context

Brief §5.1 asks for `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `strictTemplates` and extended diagnostics as errors. `tsconfig.base.json` has set them since Phase 1, but nothing stopped a project's tsconfig from overriding one, and nothing showed that each flag actually rejects code.

Facts from the installed TypeScript 6.0.3 and Angular 22.1.7 compiler:

- `strict` turns on eight flags (`noImplicitAny` … `useUnknownInCatchVariables`); each can be switched off on its own. `strictTemplates` does the same for nine template flags (`strictInputTypes` … `strictLiteralTypes`).
- `typeCheckHostBindings` defaults to `true`; `strictStandalone` defaults to `false`, so `standalone: false` still compiles.
- `allowUnreachableCode` left unset only greys the code out in the editor, and typescript-eslint turns ESLint's `no-unreachable` off, relying on TypeScript (ts(7027)). So unreachable code is currently caught by nothing.
- `exactOptionalPropertyTypes`: the whole workspace already type-checks with it. A control fixture using signal inputs, `model`, host bindings, Signal Forms, a `ControlValueAccessor` and Angular Aria's listbox compiles with no errors.
- The compiler knows 18 extended template diagnostics. Its public API does not export their names, but it lists them all in the error for an unknown check name.

## Decision

1. **Required options** live in `tools/compiler-check/src/requirements.ts` and are set in `tsconfig.base.json`: the brief §5.1 flags, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and three additions: `exactOptionalPropertyTypes`, `allowUnreachableCode: false`, and `strictStandalone`. `typeCheckHostBindings: true` is also set explicitly, so it can't drift if a default changes. None of the flags under `strict` or `strictTemplates` may be `false`. `extendedDiagnostics.defaultCategory` must be `error`, and any entry in `checks` must be `error` too.
2. **`compiler-check:check`** resolves every `tsconfig*.json` in the workspace the same way ngc does (`readConfiguration`: the `extends` chain plus `angularCompilerOptions`) and fails on any weaker value. It runs in pre-commit when a tsconfig is staged, and in CI.
3. **`compiler-check:test`** proves the rule:
   - Each of the 46 fixtures in `fixtures/violations` breaks one option or one extended diagnostic, and must produce exactly its declared codes, all as errors.
   - One control fixture must produce no diagnostic at all.
   - Every required option and every extended diagnostic the installed compiler knows must have a fixture. An upgrade that adds a diagnostic or a new `strict` flag fails this test until a fixture is added.
   - Each fixture in `fixtures/configs` weakens one option, and `check` must report exactly that option.
4. The fixtures compile in a single Angular program that gathers every phase. ngc stops at the first phase with errors, which would hide one fixture's template errors behind another fixture's TypeScript error.
5. `tools/compiler-check` type-checks with `moduleResolution: bundler` instead of `nodenext`, because the `@angular/compiler-cli` declarations use extensionless relative imports. This is the one exception to ADR 0015's tsconfig. The tool still runs under Node type stripping, and its tests import every module, so a bad import still fails.

## Alternatives considered

- **Trust `tsconfig.base.json` alone:** a single override in any project silently weakens it. Rejected.
- **Compile the fixtures once per project tsconfig:** about ten times slower, and it proves nothing more once `check` shows every project resolves to the same values. Rejected.
- **`noUnusedLocals` / `noUnusedParameters`:** left to ESLint's `no-unused-vars`, which is configurable (for example, `_`-prefixed parameters) and reported in the same pass as the other lint rules.
- **Hard-code the extended diagnostic names:** a new diagnostic in an Angular upgrade would go unproven. Rejected in favour of the compiler's own list.

## Consequences

- Optional properties are left out, never set to `undefined`: write `...(x === undefined ? {} : { x })`.
- In host listeners, `$event` is `Event`, because the type checker does not know the host element's event map. Narrow it inside the handler.
- A new `strict` flag, `strictTemplates` flag or extended diagnostic from an upgrade fails `compiler-check:test` until it gets a fixture and a place in `requirements.ts`. The `strictTemplates` list is not read from the compiler, so review it on every Angular upgrade.
