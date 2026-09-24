# compiler-check

Enforces the compiler strictness of brief §5.1 and ADR 0022. The required options are listed in `src/requirements.ts` and set in `tsconfig.base.json`.

- `pnpm nx run compiler-check:check` resolves every `tsconfig*.json` in the workspace the way ngc does (the `extends` chain and `angularCompilerOptions`) and fails if any of them is weaker than the requirements. Folders named `fixtures` are skipped.
- `pnpm nx run compiler-check:test`:
  - compiles `fixtures/violations` with the workspace options. Each fixture must produce exactly the codes on its `// Expect:` line, all as errors, and `valid.ts` must produce nothing.
  - checks that every required option, and every extended diagnostic the installed compiler knows, has a fixture.
  - checks that `check` rejects each weakened config in `fixtures/configs` by naming that option.

## Adding a fixture

When a TypeScript or Angular upgrade adds a new `strict` flag or a new extended diagnostic, `test` fails and names what is missing. To fix it:

1. Add `fixtures/violations/<kebab-name>.ts`. Put `// Proves: <option or diagnostic name>` and `// Expect: <codes>` at the top (`TS2322`, `NG8101`; several codes separated by commas).
2. If the new item is a compiler flag, add it to `src/requirements.ts` and set it in `tsconfig.base.json`.
3. Run `pnpm nx run compiler-check:test`.
