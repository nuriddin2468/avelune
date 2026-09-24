# 0035. Patch `@storybook/angular-vite`: skip bootstrapping a detached story host

- Status: Accepted (2026-09-24, technical decision on the Storybook tooling)
- Date: 2026-09-24
- Related: 0008, 0012, 0034

## Context

- Switching a global (theme, density, motion) on a docs page logged NG05104 ("The selector "components-icon--sizes[components-icon-sizes-1]" did not match any elements") once per story. The page then rendered correctly. It happens with and without the themed docs container of ADR 0034.
- Traced in the browser on 2026-09-24, with the channel events and a mutation observer. `Preview.onUpdateGlobals` in `storybook` 10.6.0 re-renders every story (`storyRenders.map((r) => r.rerender())`). Without waiting for those, `PreviewWithSelection.onUpdateGlobals` re-renders the docs page, and addon-docs' `DocsRenderer` remounts the whole page (`key: Math.random()`).
- `@storybook/angular-vite` 10.6.0 renders a story in two steps: it writes the host element into the story's container, then queues `bootstrapApplication` (`queueBootstrapping`, one bootstrap at a time). The remount removes the containers while the re-renders from the first step wait in the queue. Their bootstrap then looks for a host that is no longer in the document. The remount's own renders bootstrap normally.
- React stories render synchronously, so the double render has no visible effect there. The fix belongs upstream. Until it lands, only the renderer can tell that a queued bootstrap is stale.
- pnpm applies patches from `patchedDependencies` and fails the install when a patch no longer applies, for example after a version bump.

## Decision

1. `patches/@storybook__angular-vite@10.6.0.patch` changes one step of `AbstractRenderer.render`. It keeps the host element it wrote, and when the queue reaches the bootstrap, it skips the bootstrap if that host is no longer connected. A newer render owns the new host. The stale render resolves without an application, and its torn-down story stops there.
2. The patch is listed in `pnpm-workspace.yaml` (`patchedDependencies`) and pinned to 10.6.0. It changes nothing else in the package.
3. Remove the patch when Storybook fixes the double render or the renderer; the Storybook 11 upgrade checks it (ROADMAP.md, "Tracked upgrades"). An upstream issue is to be filed with the trace above (needs the product owner's go-ahead: it is a public post).

## Alternatives considered

- **Leave the error:** it is noise in every theme switch on a docs page, and it would hide a real bootstrap failure in the same console.
- **A custom docs renderer without the random key:** it would re-implement addon-docs' `DocsRenderer` (MDX provider, error boundary, React root) and need `react-dom`, which is more code and more coupling than a one-condition patch.
- **Stop the docs page from re-rendering on globals:** the re-render is Storybook core behaviour, and the themed docs container (ADR 0034) relies on it.

## Consequences

- Theme, density and motion switches on docs pages render every story once, with a clean console. Checked on the Icon page: three switches, 67 icons each time, no errors.
- The patch targets a bundled chunk file (`dist/_browser-chunks/chunk-UJ3I56EP.js`). Any Storybook upgrade has to re-create or drop it; `pnpm install` fails loudly until then.
- Story mode is unaffected: its canvas renderer never finds a detached host, so the condition is always true there. The story tests and the visual baselines are unchanged by the patch.

## Addendum: reported upstream (2026-09-24)

With the product owner's go-ahead the bug is filed as [storybookjs/storybook#36423](https://github.com/storybookjs/storybook/issues/36423), with a public minimal reproduction ([nuriddin2468/storybook-angular-vite-docs-ng05104](https://github.com/nuriddin2468/storybook-angular-vite-docs-ng05104): Angular 22.1.7, Storybook 10.6.0, autodocs, one toolbar global). The reproduction logs NG05104 once per story on the first global switch; with this ADR's patch applied, three switches log none. `11.0.0-alpha.1` still has the unpatched code. When the issue is fixed in a release we can use, drop the patch (decision 3).
