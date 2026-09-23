# 0008. Storybook on `@storybook/angular-vite`

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0005, 0006

## Context

Storybook 10.6.0 offers two Angular frameworks:

- **`@storybook/angular`**: stable, **webpack 5 only**, built on `@angular-devkit/build-angular`. Supports Angular 18–22.
- **`@storybook/angular-vite`**: added in 10.5, **preview** in 10.x, planned stable in Storybook 11. Needs Angular ≥ 21 and Vite ≥ 8, and is built on the Analog Vite plugin. In 10.6 it declares `@angular/animations` as a required peer; 11.0.0-alpha.1 drops that.

`@storybook/addon-vitest`, which runs stories, `play` functions and a11y checks as Vitest tests, **requires a Vite-based framework**. The a11y addon can fail tests on violations (`parameters.a11y.test = 'error'`). Open issue #36124 reports heap OOM with a global `'error'` setting on large projects. `@analogjs/storybook-angular` 2.7.2 is a community Vite option, but the Storybook 10.6 CLI now migrates Analog setups to `angular-vite`.

## Decision

1. Use **`@storybook/angular-vite` 10.6.0** with `addon-vitest`, `addon-a11y` (`test: 'error'` globally) and `addon-docs`.
2. Install **`@angular/animations` as a devDependency of the workspace only**, to satisfy the peer. It is never a dependency of any published package, and ESLint `no-restricted-imports` bans importing it anywhere (ADR 0005).
3. Keep the **independent axe sweep** over every story in the Playwright job (ADR 0006), so a11y enforcement doesn't depend on a preview framework.
4. If #36124 bites, shard the Storybook Vitest project (Vitest `--shard`) before considering any relaxation. The global `'error'` setting is never lowered.
5. **Upgrade to Storybook 11** when its `angular-vite` is stable, and remove the `@angular/animations` devDependency then.

## Alternatives considered

- **`@storybook/angular` (webpack) + `@storybook/test-runner`:** stable, but it uses a second bundler with different CSS processing from the kit's esbuild/Vite build (what you see is not what ships), and a separate Jest-based test stack. This is the **fallback** if `angular-vite` blocks us.
- **`@analogjs/storybook-angular`:** being superseded by the official package. Rejected.
- **No Storybook, showcase only:** loses per-story docs, interaction tests and the `index.json` catalogue the visual suite iterates. Rejected.

## Consequences

- Stories, docs and visual tests all run on the same Vite + Angular compiler pipeline as the library.
- The preview status is a tracked risk in ROADMAP.md. The fallback is known and cheap because stories are framework-agnostic CSF.
