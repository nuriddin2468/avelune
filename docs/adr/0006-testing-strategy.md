# 0006. Testing: Vitest browser mode, harnesses, Playwright in Docker, axe

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0008, 0010, 0013

## Context

A UI kit fails on behaviour a DOM emulator cannot reproduce: `:focus-visible`, real keyboard events, layout, computed styles and animations. Angular 22's default unit-test runner is Vitest through `@angular/build:unit-test`, which supports a real-browser mode via `@vitest/browser-playwright`.

## Decision

| Layer | Tool | Runs where | Gate |
|---|---|---|---|
| Unit / component | Vitest 4.1.11 via `@angular/build:unit-test`, **browser mode** (Chromium, headless) | local + CI | coverage ≥ 90% lines and branches per component entry point, set in config |
| Harnesses | `@angular/cdk/testing` harness per component in `@avelune/ui/<name>/testing` | used by unit tests | every component ships one; the kit's own tests use it |
| Stories | Storybook `play` functions via `@storybook/addon-vitest` | local + CI | failing `play` fails the run |
| Story a11y | `@storybook/addon-a11y` with `parameters.a11y.test = 'error'` | local + CI | any axe violation fails |
| Visual | Playwright 1.63.0 in pinned Docker (ADR 0010); every story from `index.json` × light/dark × 1280/390 | Docker only | diff over threshold fails |
| Page a11y | `@axe-core/playwright` on every showcase screen, plus an axe sweep of every story | Docker | any violation fails |
| Invariants | `tools/invariants` Playwright specs on the showcase (brief §8.2) | Docker | any failure fails |
| Budgets | `size-limit` per entry point | CI | over budget fails |
| Guardrail fixtures | tests that assert each lint and check tool **rejects** its violation fixtures | CI lint stage | a broken config fails |

- Browser mode is chosen over jsdom so that focus, keyboard and computed-style assertions are real. It costs speed, which Nx caching and `affected` offset.
- The axe sweep in Playwright duplicates the Storybook a11y gate on purpose: if the Storybook integration regresses (it is in preview, ADR 0008), a11y enforcement still holds.

## Alternatives considered

- **jsdom / happy-dom:** faster, but `:focus-visible`, layout and `getAnimations()` are fake or missing. Rejected for component tests.
- **Karma / Jasmine:** Angular's legacy runner. Rejected.
- **Chromatic or another hosted visual service:** external data egress and cost, and it doesn't work while CI is local-only. Rejected.

## Consequences

- Running unit tests needs a Playwright Chromium. `pnpm exec playwright install chromium` is part of setup.
- Visual tests never run on the host OS. Only the container produces or compares baselines.
