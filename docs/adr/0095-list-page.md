# 0095. ListPage: a register's header, notices, applied filters, and the filters' column beside the list

- Status: Accepted (2026-09-30; the header and the filters are the product owner's, ADR 0093, 0094; the page's order and widths are the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0061, 0078, 0087, 0091, 0093, 0094; brief §9.4

## Context

- Brief §9.4 names a list page among the layouts. The showcase's register lays one out in `@layer app`: SearchHeader, the export's progress and an alert about expired contracts, the applied filters as tags, and a grid that puts FilterPanel's column beside the DataTable while it is open. Its page is at most `container.lg` wide.
- FilterPanel decides whether it is a column by measuring the element around it (ADR 0094). The page has to give the column its room while it is open, and none while it is closed or a drawer.
- A table uses the width it gets; beside a 256px column it needs about 700px (ADR 0094). With the navigation, a 1600px window leaves about 1300px.

## Decision

1. **`<ave-list-page>` in `@avelune/ui/list-page`** (layer `patterns`) places what the application puts in it, recognised by element and marker:
   - `ave-search-header`, the page's `h1`, first;
   - `[aveListPageNotice]` on alerts and progress about the whole list, under the header, 24px apart;
   - `ave-applied-filters`, 16px over the list, across its width;
   - `ave-filter-panel`, whose column it sets at the list's start while the panel is open and not a drawer, 24px from it;
   - the list itself, a DataTable or a List, as the rest of its content.
2. **Parts 24px apart** (`space.6`, ADR 0091). The applied filters sit 16px over the list, since they belong to it. A part that is absent or draws nothing leaves no gap.
3. **Full width.** The page takes the inline size its parent gives it, since a table uses the width it has. It is an inline-size container (ADR 0091). The column's room follows the panel's `open()` and `modal()`, and the panel measures the page's body, where the column and the list stand. The page provides `AVE_FILTER_PANEL_LAYOUT` from `@avelune/ui/filter-panel`, and a panel inside sets itself there for as long as it lives, as Card's parts count themselves in (ADR 0083). A signal query's generated arrow would leave a small file under its coverage threshold.
4. **No heading of its own:** SearchHeader draws the page's `h1`. A list page without a search starts with its own `h1`, which the page keeps as the rest of its content.
5. **Checks:** `AveListPageHarness`, unit tests in Chromium, stories (the register with its column open and closed, a narrow page with the drawer, no results, loading), and the showcase's register.

## Alternatives considered

- **Named slots for every part (`[aveListPageHeader]`, `[aveListPageFilters]`):** the parts are the kit's own components. Recognising them by element keeps the markup short and puts each in its place without a marker.
- **A width capped at `container.lg`, as the showcase's register was:** on a wide window the table would scroll sideways inside a narrow page next to empty space.
- **The page measures itself and tells the panel its form:** FilterPanel already works alone (ADR 0094), and a second measurement could disagree with it at the threshold.
- **A card view of the table on a phone, which Wave 5 left for Wave 6:** a record's card is a taste decision for each kind of record, and the table already scrolls sideways inside its own box. It is not taken here and goes to the product owner at the wave's STOP.

## Consequences

- The showcase's register loses its layout CSS; what stays belongs to its content (the export's box, the drawer's card).
- The DataTable's box is as wide as the page, beside the column or without it.
