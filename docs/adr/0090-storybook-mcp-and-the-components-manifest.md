# 0090. Storybook MCP: the components manifest, the kit's component in every story file, snippets an application writes

- Status: Accepted (2026-09-30, technical decision within Wave 6; the product owner chose Storybook MCP in place of a Figma library); decision 3's "A story rendered from its args keeps the snippet Storybook derives" superseded by 0101
- Date: 2026-09-30
- Related: 0007, 0008, 0025, 0034, 0035, 0089

## Context

- Product owner, 2026-09-30: coding agents get the kit's API from Storybook MCP, first in Wave 6 so the wave's own agents use it; consumer teams have no designers in Figma.
- Storybook 10.6.0's `features.componentsManifest` writes `manifests/components.json` into the build: one entry per story file, with `$ref`s to its docgen (`meta.component`'s selector, inputs with their JSDoc, union members, outputs), a snippet per story and its docs page's MDX. `@storybook/angular-vite` 10.6.0 fills docgen through its docgen server, on by default there; the webpack framework has no manifest.
- `@storybook/addon-mcp` 10.6.0 serves MCP over HTTP at the dev server's `/mcp`. Its docs toolset (`docs-list`, `docs-show`, `docs-show-story`) reads the manifest; its dev and test toolsets add story-writing instructions, previews and `test-run`. Storybook calls its AI features a preview and the manifest not a public API.
- The spike (2026-09-30), with JIT (ADR 0025) and the patch (ADR 0035):
  - Attribute directives show as `button[aveButton], a[aveButton]`, components as `ave-accordion`, with JSDoc, `@default` and release tags.
  - Only 9 of 46 story files described a kit component. 28 described their frame (`AccordionStories` and its `view` input). 9 had none: Wave 2 left `component` out because a `model()` threw NG0203. With `AveSelect` and every other component set, all 256 story tests and the 46 docs pages render cleanly, so that no longer happens.
  - Docgen reads `meta.component` only: no parts (`AveAccordionItem`) and no host directive's inputs (the accordion's `multiple`).
  - A snippet is taken as written only from a literal `parameters.docs.source.code`, otherwise derived from the render function: 176 of 256 were incomplete and 125 showed a frame (`<ave-accordion-stories />`).
  - The dev and test toolsets tell an agent to follow their story conventions and to run `test-run` "never a package.json test script", where AGENTS.md and the ADRs rule.

## Decision

1. `features.componentsManifest: true`. `@storybook/addon-mcp` with the docs toolset only (`toolsets: { dev: false, docs: true, test: false }`). `.mcp.json` names `storybook` at `http://127.0.0.1:6006/mcp`, which `pnpm nx serve storybook` serves.
2. Every kit story file's `meta.component` is a component of its entry point, never a frame. The Toast's has none (a service). Frames still render the stories, and the `Meta<>` type argument stays the frame's, which types the args.
3. ADR 0034's snippets become literals: a story that renders through a frame or a helper sets a literal `parameters.docs.source.code`, the markup or the TypeScript an application writes for what it shows. The `source()` helpers are gone. A story rendered from its args keeps the snippet Storybook derives, which the manifest resolves. TypeScript snippets say `typescript`, the name Storybook's highlighter knows.
4. What docgen misses is named on the entry point's docs page, which the manifest carries whole: a part (`<ave-accordion-item>`, `[aveCardTitle]`), a host directive's input, a plain output of a part.
5. `tools/manifest-check` checks the built manifest against the API reports (ADR 0007). Its rules are in its README: every component and directive, every input and output, a description for every input docgen lists, and for every story a snippet that is complete and shows no frame. It exempts `forms`, the plumbing of the kit's own controls; another exemption needs an ADR. Its fixtures prove each rule.
6. Nothing else is built on the manifest. When Storybook changes its format, the reader fails with this ADR's number, and the reader and its fixture change together. Hosting it for consumers is Phase 6.

## Alternatives considered

- **Our own manifest from the API reports** (an `experimental_manifests` preset): full control, but it would re-implement a preview format that the toolset reads. Rejected.
- **A story file per part**, for its docgen: sidebar entries, docs pages and baselines for fragments. Rejected; the docs page names parts.
- **No snippet for stress and keyboard stories** (`code: null`): the toolset would list them by name only, and the docs page's "Show code" would still show the frame. Their markup is short. Rejected.
- **All three toolsets:** the instructions of the dev and test toolsets contradict the repository's. Rejected, until a toolset's instructions can be replaced.

## Consequences

- An agent gets a component's description, inputs with JSDoc, three snippets and its whole docs page from one `docs-show`, instead of reading `node_modules`.
- A new story needs a literal snippet, a new story file its component, a new part's bindings on the docs page; `manifest-check:check` fails otherwise. It runs after the Storybook build, not in pre-commit.
- The docs pages' "Show code" shows the application's markup for every story, not a frame.
- The tracked risk of NG0203 for a meta's `model()` is closed.
