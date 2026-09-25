# 0027. Browser suites: visual, axe sweep and invariants in the pinned container

- Status: Accepted (2026-09-24, technical decision within Phase 3)
- Date: 2026-09-24
- Related: 0006, 0008, 0010, 0026; brief §5.4, §8.2

## Context

ADR 0006 chose the tools and ADR 0010 fixed the environment: the image by digest, amd64 only, and the visual matrix. Facts found while building the suites (Playwright 1.63.0, `@axe-core/playwright` 4.13.0, Storybook 10.6.0):

- **The host's `node_modules` works in the image.** Playwright, axe and the suites are plain JavaScript, and pnpm's symlinks are relative, so the mounted workspace runs as it is. The image has Node 24.20.0 with type stripping and Liberation Sans, a local face that the metric-matched fallback in `fonts.css` names. Under Docker's emulation on Apple Silicon, 49 story tests take about 1.2 minutes.
- **Storybook only logs a failing `play` function.** Its component-testing preview sets `throwPlayFunctionExceptions: false`, so the render phase ends `finished` and the error goes to `console.error`. `__STORYBOOK_PREVIEW__.currentRender.phase` reaches `finished` after the render, the play function, the settled animations and the `afterEach` hooks.
- **The a11y addon** runs axe's default rules on `body`. It excludes Storybook's own elements and disables `region`.
- **Easing serialisation differs.** A CSS animation's effect easing is always `linear`, and its timing function is on each keyframe. The browser rewrites `linear(0, 0.0496, …)` as `linear(0 0%, 0.0496 4.16667%, …)`.
- **Fake timers break Storybook.** `page.clock.install()` stops Storybook's timers; `setFixedTime()` fixes only the date.

## Decision

1. **One runner.** `tools/visual/src/container.ts` starts the pinned image on linux/amd64 with Docker, with the workspace mounted, `--network=none` and the developer's uid. Inside the image, as in CI, it runs Playwright directly. `isPinnedContainer` checks the runner's variable, the image's browsers path, linux and x64, and both Playwright configs throw otherwise. The host builds Storybook and the showcase (Nx `dependsOn`), and `serve.ts` serves them inside the container.
2. **The visual suite** (`tools/visual`) takes every story from `index.json` and runs it in four projects: light and dark at 1280 and 390 px.
   - A test fails if the story errored or anything logged an error while it rendered.
   - It fails if the text is not in the kit's fonts.
   - It fails if the full-page screenshot is not equal to `baselines/<story id>/<project>.png` (threshold 0.1, `maxDiffPixels: 0`).
   - A missing baseline fails and is not written. `--update` writes only the changed and missing ones. A baseline without a story fails.
3. **The axe sweep of every story** runs in the same suite, with the Storybook gate's rules, so a11y does not depend on the preview framework (ADR 0008).
4. **The showcase suite** (`tools/invariants`) finds screens by following same-origin links from `/`. On each screen it runs:
   - axe with every default rule, `region` included;
   - no horizontal overflow at 320 px;
   - motion checks. An init script records every animation on every frame. Durations must equal a `duration.*` or `timing.*` token in any mode. Easings must equal an `easing.*` token, and both sides go through the browser's serialiser (the carried-over `linear()` normalisation). Under reduced motion, no keyframe may change translation or scale; fades and rotation stay.

   The component invariants of brief §8.2 join as components land (Phase 5).
5. **Shared environment:** `tools/visual/src/environment.ts`, imported by `tools/invariants` as `@avelune/visual`. It holds the fixed context, the fixed clock, the font assertion and the static server.
6. **Proof** in `tools/test-check`:
   - `test` shows that both configs refuse to start on the host.
   - `e2e` runs the real suites against fixtures:
     - a fixture Storybook built from the real main config, preview and head, with a clean story, a changed screenshot, a missing baseline, an axe violation, a lost `fonts.css`, a failing `play` function and an orphan baseline;
     - a static site with one violation per page and a control page, whose recorded motion must include a spring `linear()` animation that passed.
   The proof asserts which tests fail and why.
7. **Nx:** `visual:e2e`, `invariants:e2e` and `test-check:e2e` are cached and never run in parallel (`parallelism: false`), with a 90-second test timeout for emulation. `pnpm visual` and `pnpm visual:update` wrap the first.
8. **The showcase bundles `tokens.css`, `fonts.css` and a body rule** until `@avelune/ui/styles.css` exists (Phase 4). The font assertion needs them.

## Alternatives considered

- **Installing Linux `node_modules` in the container:** slow, needs the network, and gives nothing the mount doesn't. CI installs inside the image anyway.
- **A fake Storybook for the fixtures:** fast, but it would prove the suite against our own imitation. The real build takes 5 seconds.
- **A declared list of showcase screens:** needs upkeep, and a new screen is unchecked until someone adds it. Rejected in favour of the crawl.
- **Sampling `getAnimations()` once after load:** misses animations that start on interaction or end before the sample.

## Consequences

- Docker is needed for the e2e targets. The Foundations baselines are 6.3 MB, and every baseline update adds to the git history.
- Any story that logs an error, or loads a file that is missing, fails the visual suite.
- The CI job must run in the same digest and set `AVELUNE_PLAYWRIGHT_IMAGE`. The next roadmap item checks `.gitlab-ci.yml` against `tools/visual/src/image.ts`.

## Addendum: one load per story, a quiet-network wait of our own, a caret that does not blink (2026-09-25)

The first full runs of the Wave 1 suites (Docker was down when Wave 1 was built) found four problems in the suites themselves. None of the fixes lets through anything that failed before.

- **Speed.** 47 stories took 6.9 to 7.6 minutes with 5 workers. Each story × project was two tests, the screenshot and the axe sweep, and each loaded the story. Measured on 2026-09-25, the container's 11 CPUs are the limit under amd64 emulation (Rosetta): 10 workers keep about 9 cores busy and are only 13% faster than 5 (Button's 83 tests: 1.3 against 1.5 minutes).
  - Decision: one test per story × project, `matches its baseline and has no axe violations`. It loads the story once and makes both checks as soft assertions, so a failing one never hides the other. The same run takes 4.3 minutes: 208 tests instead of 396.
  - The proof checks that each failure is reported by its own assertion and not the other's, by the first line of each error. Its counts change from 16 tests with 8 failing to 10 with 7.
  - Workers stay at Playwright's default, half the CPUs. `pnpm visual --workers=10` is there when nothing else runs on the machine.
- **The showcase suite hung.** In each of two runs, 2 of 24 tests (a different pair each time) waited on `waitForLoadState('networkidle')` until the 90-second timeout, while the trace showed every request finished within 0.6 seconds of navigation. A likely cause is [microsoft/playwright#42598](https://github.com/microsoft/playwright/issues/42598) (the idle state is lost when requests finish before DOMContentLoaded); that is not confirmed.
  - `openScreen` now counts the page's own `request`, `requestfinished` and `requestfailed` events and waits for 500 ms with no request in flight, which is what `networkidle` means.
  - Two runs after the change: 24 of 24 each, 31 seconds instead of 1.6 to 1.9 minutes.
- **A blinking caret in forced colours.** Forced colours force `caret-color`, so the screenshot option `caret: 'hide'` (a transparent caret) does nothing there. A focused text field's caret then blinks into some screenshots and not others: the Input States forced-colors baseline differed by one 1 × 18 px column between two runs.
  - The forced-colors spec sets `caret-animation: manual` (Chromium 153) before its screenshot. The caret stops blinking and is drawn in every run; checked with the style applied at six points of the blink cycle.
- **The same-size proof had never run.** Its fixture row was wider than 320 px, so the page broke the overflow invariant as well. Its pattern expected plain quotes where Playwright's diff prints `\"`. Both are fixed, and the proof fails and passes where it should.
