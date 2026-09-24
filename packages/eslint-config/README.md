# @avelune/eslint-config

Shared ESLint configuration for applications that consume Avelune. It will contain angular-eslint's recommended and accessibility template rules, `no-restricted-imports` for `@angular/animations`, `@angular/material` and deep `@avelune/ui` imports, and `avelune/no-raw-elements` with the kit's current `kitElements` (ADR 0023).

Not built yet. The rules live in `tools/lint-rules`, and this repository's showcase is already linted with them as a consumer. The package bundles them when it is first published (Phase 6, `ng add`). `private` is removed then.
