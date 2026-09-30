# 0102. Foundations in MCP: a docs page per Foundations story file, with a token reference generated from the tokens

- Status: Accepted (2026-09-30, technical decision; the product owner asked for every finding of the MCP audit to be fixed)
- Date: 2026-09-30
- Related: 0016, 0017, 0031, 0089, 0090, 0101

## Context

- The seven Foundations pages and the "Custom icons" guide are stories that draw their tokens in the browser from `@avelune/tokens`. MCP gave an agent their names only: no component, no docs page, and "No code snippet was extracted".
- `@avelune/tokens` 0.0.0 exports 152 public tokens, each with its CSS variable, value, dark value and, for 99 of them, a description. `packages/ui/styles` adds 17 classes: the motion catalog's and `ave-tabular-nums`.
- The manifest carries an MDX page as written. A token table that a component draws in the browser would reach an agent as its tag alone, so the names must be in the MDX source.

## Decision

1. Each Foundations story file, and the "Custom icons" guide, gets a docs page (`<Meta of={…} />`). The page says when to use its tokens and how to reference them in CSS (`var(--ave-space-4)`).
2. Each page has a token reference between `{/* tokens:<group> */}` and `{/* /tokens */}` markers. It lists the name, the CSS variable, the light value, the dark value when there is one, and the description. `manifest-check:foundations` generates it from `@avelune/tokens` with `--update`, and fails without it when a table is stale, as `fonts:check` and `tokens:roles` do.
3. The groups: Colour `color`; Typography `font`; Spacing and size `space`, `size`, `control`, `container`, `breakpoint`; Radius and elevation `radius`, `border-width`, `elevation`, `z-index`; Global styles `focus-ring`; Motion `duration`, `easing`, `motion`, `timing`.
4. `manifest-check:check` fails when a public token's CSS variable, or a class of the global stylesheet, is on no Foundations docs page.

## Alternatives considered

- **Hand-written tables, checked by name:** descriptions and values would drift from the token sources. Rejected.
- **A snippet per Foundations story that lists the tokens:** a snippet shows how to write one thing, not a reference. Rejected.
- **One standalone "Tokens" page:** the Foundations pages already group the tokens and explain their use. Rejected.

## Consequences

- An agent writing an application's CSS finds every token and utility class, with its meaning, through `docs-show`.
- A token added to `@avelune/tokens` fails `manifest-check:foundations` until the tables are regenerated. A new group also needs its page in the generator's map.
- The Foundations entries in the sidebar each gain a "Docs" page.
