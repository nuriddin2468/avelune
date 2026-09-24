# @avelune/stylelint-config

Shared Stylelint configuration for applications that consume Avelune: token-only values, logical properties, query widths that equal the kit's breakpoints, and the other rules of the workspace `stylelint.config.mjs` (ADR 0024).

Not built yet. The config lives at the repository root and its `avelune` rules in `tools/lint-rules`. The package bundles them when it is first published (Phase 6, `ng add`). `private` is removed then.
