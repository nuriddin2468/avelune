# 0010. Visual-test determinism: pinned image, amd64, fonts

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0006

## Context

Pixel baselines are only useful if the same commit renders the same pixels on every machine. Sources of drift are the browser build, OS font rasterisation, **CPU architecture** (Chromium's font rendering and anti-aliasing differ slightly between arm64 and amd64), system fonts, device scale factor, locale, time zone, animations and late-loading fonts. The development machine is Apple Silicon (arm64). The product owner specified amd64 CI runners.

## Decision

- **One image, pinned by digest, for amd64:**
  `mcr.microsoft.com/playwright:v1.63.0-noble@sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7`
  (the linux/amd64 manifest of the `v1.63.0-noble` index `sha256:eff16c30…a4a27`). The Playwright npm version and the image version must match; a check fails otherwise.
- **Always `--platform linux/amd64`**, locally and in CI. On Apple Silicon this runs under emulation: slower, but pixel-identical to CI. Baselines produced on arm64 are invalid.
- **Only the container** creates or compares baselines. `pnpm visual` and `pnpm visual:update` wrap `docker run`, and a host-side run refuses to start.
- **Environment fixed in the Playwright config:** `deviceScaleFactor: 1`, `locale: 'en-US'` (story content supplies ru/uz text), `timezoneId: 'Asia/Tashkent'`, `colorScheme` set per theme along with `data-theme`, `reducedMotion: 'reduce'` plus the CSS animations switch, and a fixed clock where dates render.
- **Fonts:** only the kit's self-hosted IBM Plex Sans woff2. Each capture waits for `document.fonts.ready` and asserts the font actually loaded (`document.fonts.check`), so a silent fallback fails the test instead of producing a baseline.
- **Matrix:** every story from Storybook `index.json` × {light, dark} × {1280, 390} viewport.
- **Threshold:** Playwright `threshold: 0.1` (per-pixel colour distance), `maxDiffPixels: 0` by default. Any story that needs a tolerance gets it explicitly, with a comment and an issue link.
- **Baselines are committed.** Updating them requires inspecting the diff and explaining it in the merge request (non-negotiable 10).

## Alternatives considered

- **Native arm64 locally and amd64 in CI:** faster locally, but two baseline sets or constant false diffs. Rejected.
- **arm64 CI runners:** would make local runs native. The product owner chose amd64. Revisit if the runners change; that requires a full, explained baseline regeneration.
- **A hosted visual-diff service:** see ADR 0006. Rejected.

## Consequences

- The local visual run is slower on this Mac. `affected`-only runs and per-story filtering (`pnpm visual -- --grep button`) keep iteration practical.
- The image digest changes only in a dedicated merge request that also regenerates and explains the baselines.
