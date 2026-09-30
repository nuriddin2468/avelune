# 0101. Storybook MCP: snippets that paste, every export where an agent reads it

- Status: Accepted (2026-09-30, technical decision; the product owner asked for every finding of the MCP audit to be fixed)
- Date: 2026-09-30
- Related: 0007, 0032, 0047, 0090, 0102; supersedes the sentence of 0090's decision 3 that keeps derived snippets

## Context

- An audit of what `@storybook/addon-mcp` 10.6.0 serves, entry by entry against the source (2026-09-30): the 207 inputs, 45 outputs and 285 stories of the 55 kit entries match their source. What an agent could not use:
  - Storybook derives the snippet of a story rendered from its args as a component whose fields are the args: `size = 'md';`. TypeScript widens that field to `string`, which `strictTemplates` rejects for `[size]`. The derived snippets of the locale stories left out the `LOCALE_ID` they show.
  - 98 lines of snippets held `…`: in bindings (`[loading]="…"`), in arrays, as a whole element's content. Other snippets mixed markup and TypeScript in one block, with types of the story file (`Action`, `Command`), or bound a frame's members (`label()`).
  - TypeScript 6.0.3 reads any `@word` after white space in a JSDoc comment as a tag, in a code fence too. The `@for` and `@if` of four components' examples cut their descriptions: MCP showed `**For:**`.
  - Nine inputs typed by an alias (`AveSelectSize`, `AveAccordionLevel`) named some or none of its members.
  - `manifest-check` knew components and directives only. Services, functions, types and interfaces fell through: `theme` and `i18n` had no page at all, and `AveSort`'s fields or `AveTreeNode.disabled` were on no page.
- A standalone MDX page (`<Meta title="…" />`, no story file) goes to `manifests/docs.json`, and the docs toolset lists it under "Docs" and returns it whole (checked on the dev server, 2026-09-30).

## Decision

1. Every story of a kit story file sets a literal `parameters.docs.source.code`. A snippet Storybook derived (its `selector: 'app-demo'` wrapper) fails.
2. A snippet is markup alone, which binds the application's fields by name, or a whole TypeScript component: its imports, `@Component` with the template, and the fields that template binds, typed with the kit's exported types or types the snippet declares. Never both in one snippet. Pages may still show a template and its fields as two blocks.
3. In a snippet, an ellipsis only ends or starts a word of text ("Загрузка…", an account's "…9012"). Content left out is written, or named in a comment (`<!-- the contract's fields -->`).
4. A component's JSDoc example has no control-flow block. The block goes on the docs page, which TypeScript does not parse. The class keeps release tags only (`@alpha`, `@beta`, `@public`, `@deprecated`).
5. An input typed by an alias whose members docgen does not show names every member in its JSDoc.
6. Every export of an entry point is named where an agent reads it: a story file's component, a docs page, a JSDoc, or the type of an input or output. Every field of an exported interface is on the docs page, or in the JSDoc of the input that takes it. An entry point without a story file (`theme`, `i18n`) gets a standalone docs page under Guides.
7. The plumbing between the kit's own entry points is exempt in `tools/manifest-check/src/config.ts`, with its reason. That covers `overlay` as a whole, plus `aveStatusIcon`, `aveStatusIcons`, `aveStatusLabel`, `aveStatusRole`, `AVE_TAG_FIELD`, `AVE_FILTER_PANEL_LAYOUT`, `AveFilterPanelLayout`, `AveModal`, `aveDelayedSpinner` and `aveDurationToken`. Another exemption needs an ADR.
8. `manifest-check` enforces 1 to 7, each rule proven by its fixture. For rule 2, TypeScript outside a whole component fails, with markup next to it or without. Whether a component compiles is not checked on every run; every whole-component snippet compiled under `strictTemplates` when this ADR was written.

## Alternatives considered

- **Keep derived snippets and type the args:** the derived wrapper has no types to take. Rejected.
- **Escape `@` in JSDoc (`\@for`, `&#64;for`):** MCP shows the escape as written, and an agent would paste it. Rejected.
- **Mark the plumbing `@internal`:** it changes the API reports of released entry points, and API Extractor then wants underscored names. Rejected for now.
- **Compile every TypeScript snippet with ngc:** the strongest proof, but a build of its own. Not taken.

## Consequences

- An agent can paste a snippet into a component, and learns every export and field of the kit from MCP.
- Stories cost one more literal. A new export needs its words on a page, or an ADR to exempt it.
- The docs pages' "Show code" no longer follows Controls on the stories that were rendered from args.
- A standalone page has no story to read the Theme toolbar through (ADR 0034). The docs container reads the globals from the channel there, and re-renders when they change.
