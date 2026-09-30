# manifest-check

The manifests of the built Storybook hold the kit's whole public API, as an agent reads it through the Storybook MCP docs toolset (ADR 0090, 0101, 0102).

- `pnpm nx run manifest-check:check` builds Storybook and fails when:
  - a kit story file's `meta.component` is missing, or is a frame rather than one of its entry point's components, or docgen failed on it;
  - a component or directive of `@avelune/ui` (from `packages/ui/api/*.api.md`) is neither a story file's component nor named on its entry point's docs page;
  - an input or output is neither in docgen nor named on the docs page (a host directive's inputs, the parts of a composite); a model's change event comes with its input;
  - an input has no description in docgen (its JSDoc), or is typed by an alias whose members its JSDoc does not all name (`AveSelectSize`: `sm`, `md`, `lg`);
  - a component's JSDoc has a tag other than a release tag: an example's `@for` that TypeScript read as a tag, which cuts the description;
  - any other export of an entry point (a service, a function, a type) is named on none of its docs pages, JSDoc or input types, or a field of an exported interface is named on none of its docs pages or JSDoc. An entry point without a story file has a standalone docs page, which Storybook writes to `manifests/docs.json`;
  - a story of a kit story file has no snippet, an incomplete one, a failed one, one that shows a story frame, one Storybook derived from its args (the `app-demo` component), one with an ellipsis that neither ends nor starts a word, one that mixes markup and TypeScript, or one that is TypeScript outside a whole component. The snippet comes from a literal `parameters.docs.source.code`: the markup, or the whole component, an application writes;
  - a public token's CSS variable (`packages/tokens/dist/tokens.ts`), or a class of the global stylesheet (`packages/ui/styles`), is on no Foundations docs page.
- `pnpm nx run manifest-check:foundations` fails when a token table of a Foundations docs page (`apps/storybook/src/foundations/*.mdx`, between `{/* tokens:<group> */}` and `{/* /tokens */}`) differs from `@avelune/tokens`, when a group holds no token, or when a token is in no group. `--update` regenerates the tables, formatted with the repository's Prettier config.
- `src/config.ts` exempts the entry points whose exports are the kit's own plumbing (`forms`, `overlay`), and the exports one entry point gives another (`AVE_TAG_FIELD`, `aveDelayedSpinner`, …), each with its reason; adding one needs an ADR.
- `pnpm nx run manifest-check:test` proves every rule on the small built Storybook in `fixtures/storybook` and the report in `fixtures/api`, the token tables on inline tokens, and that the reader refuses manifests it cannot read.

Storybook calls its manifests a preview and not a public API. When an upgrade changes their format, the reader fails with a message naming ADR 0090 or 0101; update the reader and the fixture together.
