# 0034. Storybook docs pages: the Theme toolbar, GFM tables, written snippets

- Status: Accepted (2026-09-24, technical decision on the Storybook tooling)
- Date: 2026-09-24
- Related: 0008, 0011, 0017, 0027, 0033, 0035

## Context

- The Theme toolbar writes `data-theme` on `<html>`, and the kit's tokens repaint it (ADR 0008 addendum). A docs page is drawn by addon-docs' React tree, and `.sbdocs-wrapper` paints Storybook's docs theme over `<html>` (`background.content`, white in the default light theme). Headings and prose take Storybook's text colour; stories inherit the kit's.
- In the dark theme the Icon docs page showed the kit's light text (`#e9e5e4`) on white: four canvases were unreadable and the primary one looked empty. Found by eye on 2026-09-24. The visual suite and the axe sweep cover stories, not docs entries (`tools/visual/src/story-index.ts`), so nothing failed.
- `parameters.docs.theme` is static. addon-docs 10.6 renders `parameters.docs.container` (by default `DocsContainer`, which takes a `theme` prop) on every docs render. The preview re-renders a docs page on every globals change (`onUpdateGlobals` calls `rerender`, in `storybook/dist/preview/runtime.js`).
- `create()` from `storybook/theming` builds a theme from colour strings. Storybook passes some of them through `polished` (`transparentize`, `darken`), which accepts hex and throws on `var(--…)`. So the theme needs resolved colours, which `@avelune/tokens` exports for each theme (`value`, `dark.value`).
- A container is a React component. `react` 19.3.0 was installed only as a dependency of addon-docs, and pnpm's strict layout kept it out of the preview's reach. `DocsContextProps.getStoryContext()` is typed as an `Omit` of `StoryContext`, whose index signature (`[key: string]: any`) hides the type of `globals`.
- Found during the same check:
  - MDX without GitHub-flavoured Markdown renders a Markdown table as a line of pipes (the Icon page's size table). addon-docs takes remark plugins through `mdxPluginOptions.mdxCompileOptions.remarkPlugins`.
  - Storybook 10.6 derives each story's "Show code" snippet statically. A story whose `render` is a call (`render: frame('sizes')`) gets the warning "Incomplete snippet … could not be resolved statically" and no useful code. `parameters.docs.source.code` replaces the derived snippet and its warning (`useSourceProps` in addon-docs).
  - Switching the theme on a docs page logged NG05104; ADR 0035 fixes it.

## Decision

1. `apps/storybook/.storybook/docs-theme.ts` builds one Storybook docs theme for each kit theme with `create()`. The values come only from semantic colour tokens (canvas, surfaces, text, borders, accent, link), read through `cssValue()` from the Foundations pages. Fonts and radii stay Storybook's.
2. `ThemedDocsContainer` reads the `theme` global of the page's first story, narrowed from `unknown`, and renders `DocsContainer` with the matching theme. `preview.ts` sets it as `parameters.docs.container`. A docs page without stories falls back to light; today every page is attached to its stories (`<Meta of>`).
3. `react` and `@types/react` 19.3.0, the versions addon-docs resolves, become workspace devDependencies, so there is exactly one React. They never become dependencies of a published package.
4. `remark-gfm` 4.0.1 (devDependency) is registered in `main.ts`, so docs pages can use Markdown tables.
5. A story that renders through a helper or a frame component sets `parameters.docs.source` to the markup an application writes for what it shows, with `language: 'html'`. Stories rendered from `args` keep Storybook's derived snippet.

## Alternatives considered

- **Keep Storybook's docs theme and paint a kit surface inside each canvas:** the prose, the argument table and the code blocks stay light around dark islands, so nobody ever sees the dark page as a whole.
- **Storybook's `themes.dark`:** its surfaces are not the kit's, so the declared contrast pairs (ADR 0011) do not hold for stories drawn on it.
- **CSS custom properties in the Storybook theme:** `polished` throws on them.
- **Override the `.sbdocs-*` styles from a stylesheet:** a specificity fight with emotion's generated classes across every docs block, which would break with Storybook upgrades.

## Consequences

- In both themes, docs pages sit on the kit's canvas with the kit's text and border colours. The light page changes from white to `color.bg.canvas`.
- Story rendering, the story tests and the visual baselines are unchanged: the container applies only in docs mode.
- Written snippets can drift from their stories; they stay short, and the docs page review reads them.
- Storybook's table stripe keeps its own palette (`theme.color.darker` / `lighter`, not part of the theme variables): a cool grey row in the dark theme, still readable (about 7:1).
- Docs pages still have no automated check. ROADMAP.md tracks this as a risk: add the docs entries, in both themes, to the axe sweep.
- The Storybook 11 upgrade must re-check the container's API (`DocsContainer`'s `theme` prop, `getStoryContext`).
