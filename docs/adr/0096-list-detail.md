# 0096. ListDetail: a list beside the record it opens, or one of them at a time on a narrow page

- Status: Accepted (2026-09-30, technical decision within Wave 6; the proportions and the back button are the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0062, 0083, 0085, 0086, 0091; brief §9.4; WCAG 2.2 SC 2.4.3

## Context

- Brief §9.4 names a list–detail layout. The showcase's departments page draws one in `@layer app`: a heading and a note over a Tree beside the chosen department's Card, side by side from a 640px container. Below that width the card falls under the tree, where a phone user scrolls past the whole tree to reach it.
- On a phone a list–detail shows one of the two: the list, then the chosen record with a way back. The record is chosen in the list, so the element with focus is hidden when the record shows, and focus would fall to the page (WCAG 2.4.3).
- Container queries decide the layout (ADR 0091). Which pane shows on a narrow page is state: the application knows when a record was chosen.

## Decision

1. **`<ave-list-detail heading description [(detail)] backLabel>` in `@avelune/ui/list-detail`** (layer `patterns`):
   - It draws the page's `h1` from `heading`, and `description` muted under it.
   - `[aveListDetailList]` goes on the application's list (a Tree, a List, a DataTable) and `[aveListDetailDetail]` on its record (a Card, a form, or an EmptyState while none is chosen).
2. **From `container.md`** the list and the record stand side by side, 2 : 3, 24px apart, their tops level. Both show whatever `detail` says.
3. **Below `container.md`** one pane shows. `detail` is a model, false by default, and the application sets it when a record is chosen.
   - While it is true the record shows under a ghost "Назад к списку" button (`arrow-left`, the new `backToList` message, or `backLabel`), and the list is hidden. The button sets `detail` to false.
   - CSS hides the pane by the container query and `data-view`, so the layout needs no measuring.
4. **Focus follows the pane.** When the record shows on a narrow page while focus is in the list, focus moves to the back button. Going back returns it to the element of the list that had it. The shell's `main` holds the page, and nothing else moves.
5. **Checks:** `AveListDetailHarness`, unit tests in Chromium on both sides of `container.md`, stories, and the showcase's departments page.

## Alternatives considered

- **The record under the list on a phone:** the reader scrolls past the whole list, and the list's scroll position is lost on every choice.
- **A route per record (`/departments/:id`), with the pattern reading the router:** a pattern declares no routes (ADR 0091). An application with such a route binds `detail` to it.
- **A drawer for the record on a phone:** a record is a page's content people read and act on, not a side task (GUIDELINES.md, "Dialog, drawer or page").
- **Measuring the width in TypeScript:** CSS already knows which pane shows. Only focus needs the answer, and it reads whether the back button is displayed.

## Consequences

- The kit's messages gain `backToList`.
- The departments page's layout CSS goes. What stays is its card's content.
