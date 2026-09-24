# visual

Visual regression and the axe sweep of every story and docs page (brief §5.4, ADR 0006, 0010, 0027), and the container that every browser suite runs in.

- `pnpm visual` (`pnpm nx run visual:e2e`) builds Storybook on the host, then runs `playwright.config.ts` in the pinned image. Each story in `index.json` is checked in light and dark at 1280 and 390 px:
  - its full-page screenshot must equal `baselines/<story id>/<project>.png` to the pixel;
  - its text must be in the kit's fonts;
  - it must render without an error, including a logged one;
  - axe must find no violation.
  A baseline without a story fails too.
- Each docs page in `index.json` is opened in light and dark at 1280 px (`docs.e2e.ts`): it must render without an error, its stories included, and axe must find no violation on the whole page. Docs pages have no baselines.
- A story tagged `forced-colors` (`tags: ['forced-colors']`) is checked once more in the `forced-colors` project: light, 1280 px, forced colours active, against `baselines/<story id>/forced-colors.png`, with its play function; axe is skipped there, since forced colours replace the colours it measures (ADR 0030).
- `pnpm visual:update` writes the baselines that changed or are missing. Open every changed image before committing it, and explain the change in the merge request. Playwright's HTML report, with diffs, is in `dist/tools/visual/report`.
- Any other argument goes to Playwright: `pnpm visual --grep=typography`, `pnpm visual --project=dark-390`.
- `pnpm nx run visual:test` checks the image pin against the installed Playwright, the container detection and the index parser.

Files in `src/`:

| File | Role |
|---|---|
| `image.ts` | The pinned image: tag plus the linux/amd64 digest. Change it only with a full, explained baseline regeneration |
| `container.ts` | Runs a Playwright config in the image through Docker, or directly when already inside it (CI) |
| `environment.ts` | The fixed environment, the font assertion and the static server, shared with `tools/invariants` as `@avelune/visual` |
| `serve.ts` | Static file server for built sites inside the container |
| `story-index.ts` | Which Storybook build and baselines to use, and the `index.json` parser |
| `story-page.ts` | Opens a story or a docs page and fails on anything that went wrong while it rendered |
| `axe.ts` | The Storybook gate's axe rules, shared by the story and docs sweeps |
| `stories.e2e.ts`, `docs.e2e.ts`, `forced-colors.e2e.ts`, `baselines.e2e.ts` | The suite |

`tools/test-check` proves that the suite fails on each violation (`pnpm nx run test-check:e2e`).
