# repo-check

Repository-level rules that no linter covers, and the proof of the rules that live in configuration (ADR 0029).

- `pnpm nx run repo-check:check` fails when:
  - an Nx project lacks exactly one of the layer or type tags that `@nx/enforce-module-boundaries` constrains (ADR 0001);
  - `.browserslistrc` breaks the floor rule of ADR 0014. Per browser, the floor must be the higher of the first version with every required CSS feature (MDN browser-compat-data) and Angular's supported set (the Baseline date in `@angular/build`).
- `pnpm nx run repo-check:test` proves both checks with the fixtures in `fixtures/browserslist` and with invalid tag sets. It also proves:
  - commitlint rejects each message in `fixtures/commits` except `good.txt`;
  - Prettier rejects `fixtures/prettier/unformatted.ts`, which `.prettierignore` keeps out of the repository check;
  - pnpm's effective dependency policy (ADR 0012) is what the test pins.

When an Angular upgrade moves the Baseline date, `check` names each browser that falls outside the rule. Raise the floor only through ADR 0014's process.
