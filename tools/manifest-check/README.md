# manifest-check

The components manifest of the built Storybook holds the kit's whole public API, as an agent reads it through the Storybook MCP docs toolset (ADR 0090).

- `pnpm nx run manifest-check:check` builds Storybook and fails when:
  - a kit story file's `meta.component` is missing, or is a frame rather than one of its entry point's components, or docgen failed on it;
  - a component or directive of `@avelune/ui` (from `packages/ui/api/*.api.md`) is neither a story file's component nor named on its entry point's docs page;
  - an input or output is neither in docgen nor named on the docs page (a host directive's inputs, the parts of a composite); a model's change event comes with its input;
  - an input has no description in docgen (its JSDoc);
  - a story of a kit story file has no snippet, an incomplete one, a failed one, or one that shows a story frame. The snippet comes from a literal `parameters.docs.source.code`: the markup an application writes.
- `src/config.ts` exempts the entry points whose components are the kit's own plumbing (`forms`), each with its reason; adding one needs an ADR.
- `pnpm nx run manifest-check:test` proves every rule on the small built Storybook in `fixtures/storybook` and the report in `fixtures/api`, and that the reader refuses a manifest it cannot read.

Storybook calls its manifest a preview and not a public API. When an upgrade changes its format, the reader fails with a message naming ADR 0090; update the reader and the fixture together.
