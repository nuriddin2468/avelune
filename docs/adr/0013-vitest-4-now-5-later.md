# 0013. Vitest 4 now, Vitest 5 after Angular 22.2

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0006, 0008

## Context

npm `latest` for Vitest is 5.0.1. The peer ranges are:

| Package | Peer `vitest` |
|---|---|
| `@angular/build` 22.1.8 (stable) | `^4.0.8` |
| `@angular/build` 22.2.0-rc.0 | `^4.0.8 \|\| ^5.0.0` |
| `@storybook/addon-vitest` 10.6.0 | `^3 \|\| ^4` (Vitest 5 support only in 11.0.0-alpha.1) |
| `@nx/vitest` 23.2.1 | `^3 \|\| ^4` |

Angular 22.2 also fixes a Vitest 5 config double-merge bug. On Vitest 4, the builder's `splitting` option remains the workaround for JSDOM live-binding issues. That doesn't affect us, because we use browser mode (ADR 0006).

## Decision

- Pin **Vitest 4.1.11** (`vitest`, `@vitest/browser-playwright`, `@vitest/coverage-v8`) through the pnpm catalog.
- Move to Vitest 5 in one merge request once **all three** are stable: Angular 22.2, a Storybook release whose `addon-vitest` peers Vitest 5, and an `@nx/vitest` release that peers it.
- The same merge request upgrades Angular to 22.2 if it isn't already.

## Alternatives considered

- **Vitest 5 now with peer overrides:** violates rule 1 (resolve conflicts before installing) and runs Storybook's integration outside its tested range. Rejected.

## Consequences

- One upgrade to watch. It is listed in ROADMAP.md under "Tracked upgrades".
