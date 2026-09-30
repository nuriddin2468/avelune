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

## Addendum: docs pages under axe, on the surface, with inputs only (2026-09-24)

Before Icon goes to beta, the risk in Consequences is closed, and two defects it would have found are fixed.

- **Docs pages are swept.** `tools/visual/src/docs.e2e.ts` opens every docs entry of `index.json` in the light and dark projects at 1280 px. It waits for `docsRendered` (an init script listens on the preview channel from its creation) and for one finished render per story block, since the blocks start their stories from effects after that event. A page fails when it or one of its stories errors, when anything logs an error, and on any axe violation inside `#storybook-docs`, with the Storybook gate's rules. Docs pages get no screenshot baselines; their stories have their own. `test-check:e2e` proves it: a clean fixture page passes, one with an unnamed button outside its stories fails.
- **The page sits on `color.bg.surface`, not the canvas** (`appContentBg`). Storybook's code blocks take the page's background, and its light syntax palette is fixed in `storybook/theming` (`lightSyntaxColors`, not part of the theme variables). On the canvas two of its colours fall below 4.5:1 (`#eb0000` 4.43, `#008380` 4.40); on the surface every colour of both palettes passes (lowest 4.61 light, 4.74 dark). The story previews keep the canvas (`appPreviewBg`), so stories look as they do in story mode. This changes the first consequence above: the light page is white again, with canvas-coloured previews.
- **The props table lists inputs only** (`propsTable: 'inputs'` in the framework options of `main.ts`). The default showed the protected members a template reads (`AveIcon`'s `icon` and `accessibleName`) under "Properties", with "Set object" controls. A model still shows as an input and its change event; a plain `output()` is left out, so a component page describes its outputs in its prose. `@ignore` on each member would work too, but has to be remembered on every member of every component.
- **Boolean arguments get a radio control** (`booleanAsRadio` in `preview.ts`). Storybook's boolean toggle draws its unselected option at half the text colour's opacity (`addon-docs` `getBooleanControlStyles`), 3.01:1 in the light docs theme and 4.38:1 in the dark; at half opacity no text colour reaches 4.5:1 on a light fill. The first page with boolean args, Button's, failed the new sweep on it. The enhancer runs before Storybook infers types from the args, so it reads the initial args; a control a story sets is kept. The clean fixture page lists a boolean control, so the proof covers it.

## Addendum: literal snippets (2026-09-30)

Decision 5's snippet is now a literal `parameters.docs.source.code`, never a helper's return value: Storybook's components manifest, which the MCP docs toolset reads, takes a snippet as written only from a literal and derives the rest from the frame (ADR 0090). `manifest-check` fails a story whose snippet is incomplete or shows a frame.
