# 0062. EmptyState: a centred column that says why and offers the next action

- Status: Accepted (2026-09-28, technical decision within Wave 3)
- Date: 2026-09-28
- Related: 0033, 0036, 0040, 0060; brief §7.3; GUIDELINES.md "Writing"

## Context

GUIDELINES.md asks empty states to explain why a place is empty and to offer the next action. Facts, verified on 2026-09-28 (Angular 22.2.0):

- Content projected into a component keeps the styles of the view that declared it; the component's own styles reach its projected elements only through a component on them (as `[aveHint]` is).
- `<ave-icon>` stops at 24px, the frozen stroke sizes (ADR 0033); GNOME's status pages draw a much larger symbolic icon.

## Decision

1. **`@avelune/ui/empty-state`** (layer composites) holds `AveEmptyState` (`<ave-empty-state>`): `heading` (required) and `icon` (optional, an `AveIconName`), and `AveEmptyStateActions` (`[aveEmptyStateActions]`), a component whose host is the row of actions.
2. **Look:** a centred column, at most `container.sm` wide, `space.8` of padding above and below; the icon at 24px, decorative, in a 48px circle of `bg.surface-sunken` with a `border.subtle` edge (visible on the dark canvas too), 16px over the heading (`font.heading-md`, a paragraph: the level is the page's); the message in `fg.muted`, 8px under it; the actions 16px under that, a row that wraps, 8px apart.
3. **Content:** the message and any paragraphs are projected; the heading is text, so every empty state has one.
4. **Harness:** `AveEmptyStateHarness` (`@avelune/ui/empty-state/testing`): heading, message, icon, actions.

## Alternatives considered

- **A larger icon or an illustration:** the icon set stops at 24px, and illustrations would be a new asset kind with no design source.
- **A heading element with a level input:** the empty state stands in a region the page has already titled; a heading there would add a level to the outline for one sentence.
- **Actions as inputs (label and output):** content projection keeps the kit's buttons and links, with their own states.

## Consequences

- An empty list looks and reads the same in every product; the showcase's contracts search shows it.
