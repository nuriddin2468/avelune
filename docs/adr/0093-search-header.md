# 0093. SearchHeader: a list page's heading, count and main action over the search and the filters' button

- Status: Accepted (2026-09-30; the layout is the product owner's, "Wave 6 looks" in ROADMAP.md; the rest is the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0037, 0039, 0079, 0091, 0092; brief §9.4; WAI-ARIA APG "Disclosure (Show/Hide)", "Dialog (Modal)"

## Context

- The product owner chose the header of a list page (2026-09-30): the heading, the count of records and the main action on the first row, then the search across the width with the filters' button.
- The showcase's register draws this by hand (`contracts.css`): an `h1` with "34 договора" under it in `role="status"`, the actions wrapping under the heading on a phone, and a row with the search input and a status popover.
- The filters' button shows or hides a FilterPanel (the next pattern): a column beside the list on a wide page, a modal drawer on a narrow one. The button is a disclosure in the first case (`aria-expanded`, `aria-controls`) and opens a dialog in the second (`aria-haspopup="dialog"`, APG).
- `<search>` is the search landmark element at the floor (ADR 0091).

## Decision

1. **`<ave-search-header>` in `@avelune/ui/search-header`** (layer `patterns`). Its inputs:
   - `heading` (required), the page's `h1` in `font.heading-xl`;
   - `summary`, the count of records in the application's words ("34 договора", "Загрузка договоров…"), muted, on the heading's baseline after it. It sits in a `role="status"` element that is always there, so screen readers hear a new count after a search;
   - `searchLabel`, the name of the `<search>` landmark, needed when the page has another one;
   - `filters`, the filters the button controls, or none.
2. **Its regions:**
   - `[aveSearchHeaderActions]` holds the main action and at most one more, at the first row's inline end, 8px apart. The row wraps, so on a narrow page the actions go under the heading, the primary last.
   - `[aveSearchHeaderSearch]` goes on the application's `input[aveInput]` of type `search`. It fills the second row, 16px under the first, inside `<search>`, and the application binds its value.
3. **The filters' button** is a secondary Button with Lucide's `list-filter`, the filters' label and a Count (ADR 0079) of the applied filters, at the search's inline end, 8px from it.
   - `filters` is the typed contract `AveSearchFilters`: `id`, `label`, `count`, `open`, `modal` and `toggle()`. FilterPanel implements it (ADR 0094), and an application's own filters may too.
   - While the filters open in a column, the button carries `aria-expanded` and `aria-controls`. While they open in a drawer, it carries `aria-haspopup="dialog"`, and the drawer returns focus to it.
4. **Checks:** `AveSearchHeaderHarness`, unit tests in Chromium, stories (the register's header, without filters, loading, long Uzbek text), and the showcase's register.

## Alternatives considered

- **The pattern draws the search input itself** (`[(query)]`): the input would need its own debounce, validation and form wiring, which the application already has for its `input[aveInput]`, and a second API for placeholder and autocomplete.
- **A filters' slot for the application's button:** every product would draw the icon, the count and the ARIA of both modes again.
- **A context the list page provides, instead of a reference:** a header outside a ListPage could not have filters, and the link would be invisible in the template; `[filters]="panel"` says what the button controls.
- **The count under the heading, as the showcase drew it:** the product owner put it on the first row.

## Consequences

- FilterPanel brings the kit's `filters` message ("Фильтры"), its default label; SearchHeader says nothing of its own.
- A page with SearchHeader has one `h1`, and a page pattern around it draws none (ADR 0091).
- The showcase's register keeps its status popover under the header until FilterPanel replaces it.
