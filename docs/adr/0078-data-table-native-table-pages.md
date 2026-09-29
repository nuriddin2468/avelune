# 0078. DataTable: a native table the kit draws, not Aria's grid or CDK's table; pages, not virtual scrolling

- Status: Accepted (2026-09-29, technical decision within Wave 5, taken before the wave's components as brief §9.4 asks)
- Date: 2026-09-29
- Related: 0002, 0046, 0055, 0056, 0074; brief §9.1, §9.4; WAI-ARIA APG "Table", "Grid"

## Context

Brief §9.4 asks for an early choice between CDK Table with virtual scrolling and Aria's Grid, for a DataTable with sorting, selection, a sticky header, column resize, density, empty, loading and error states, and tabular figures. Facts, verified on 2026-09-29 (Angular Aria and CDK 22.2.0):

- **APG.** In the Table pattern, authors "are strongly encouraged to use a native HTML `table` element whenever possible"; each widget in a table is its own Tab stop, and a grid "can dramatically reduce the length of the page tab sequence". In a grid, screen readers are in application mode and "hear only focusable elements and content that labels focusable elements"; with rows added as people move, Control+End reaches "the last row in the DOM rather than the last available row". The APG's sortable table is a table with a button in each sortable header and `aria-sort` on the sorted one.
- **Aria's grid** (`ngGrid`, `ngGridRow`, `ngGridCell`, `ngGridCellWidget`) collects its rows and cells from the DOM, selects cells, not rows, and gives the arrows to the grid: a widget in a cell takes Enter and Space only, or must be entered with Enter and left with Escape (`widgetType`), so the Menu's button would no longer open on Down. Angular's guide sends "simple read-only tables" to a native `table`; its examples keep every row in the DOM.
- **CDK's table** (`table[cdk-table]`, column and row definitions, decorator inputs, `renderRows()` for arrays) renders inside a `cdk-virtual-scroll-viewport`, recycling rows. Its sticky rows and columns, which its virtual scrolling uses for the header, write inline `position: sticky`, `top`, `left` and `right` in px and a `z-index` of 1 to 111 on each cell (`StickyStyler` in `fesm2022/table.mjs`): values outside the kit's tokens.
- **Virtual scrolling** takes the rows out of view out of the DOM: screen readers' table commands and find in page reach only the rendered rows, a focused control scrolled away is lost, and every row needs one height, which the kit's density and wrapping text change.
- The kit already pages lists: Pagination (ADR 0074), which left its page size for the DataTable, and the combobox's pages from a server (ADR 0056). A work system's registers page on the server.

## Decision

1. **A native table.** `<table>` with a caption or a name, `thead` with `th scope="col"`, `tbody`, a `th scope="row"` where a row has a title; never `role="grid"`. Its interactive parts are native controls in cells, each a Tab stop: a sort button in a sortable header, a row's Checkbox, a record's Link, a row's Menu. A row has no click handler of its own; its record opens from its link.
2. **The kit draws it** with Angular's control flow, rows tracked by the application's key, columns declared as data with cell templates for rich content, as the select family's rich options are (ADR 0055). Neither CDK's table nor Aria's grid is used.
3. **Pages, not virtual scrolling.** A table shows one page: the kit's Pagination under it, with a page-size select, for the application's pages or the server's. The rows of a page are all in the DOM, which also bounds the Tab sequence.
4. **The brief's features on native parts,** detailed with the component: sorting through header buttons (`aria-sort`, a `sort` model, the kit's comparison for local rows or the application's for the server's), selection through checkboxes (a header checkbox for the page, mixed while some rows are chosen), a sticky header in CSS on `z-index.sticky` inside the table's own scroll box, column resize with the keyboard through a native control (no hand-written key handling without its own ADR), density through the control-height tokens, the empty, loading and error states in the table's box (EmptyState, Skeleton, Alert), figures tabular and aligned to the end.

## Alternatives considered

- **Aria's grid on the native table:** one Tab stop and the arrows, but a register is read more than it is operated, application mode hides the text of cells nobody focuses unless every cell is a stop, rows would be selected through cells, and the menus and links in cells would need Enter and Escape to reach. An editable, spreadsheet-like grid is a separate component, through an RFC.
- **CDK's table with virtual scrolling:** the rows out of view leave assistive technology and find in page, focus can be lost, and its sticky header writes raw offsets and z-indexes; pages already bound a table's size.
- **CDK's table without its sticky rows or virtual scrolling:** a second rendering model (decorator inputs, `renderRows()`) with nothing a `@for` lacks.
- **Divs with table roles:** the APG prefers the native element, and the kit enhances native elements (non-negotiable 6).

## Consequences

- A page of rows with a checkbox, a link and a menu has three Tab stops a row: the page size bounds it, and a row's rarer actions go into its menu.
- Reconsider in a new ADR when a consumer needs more rows in one view than a page gives: then CDK's `cdkVirtualFor` inside the native table, with `aria-rowcount` and `aria-rowindex`.
- The DataTable is built last in Wave 5, on the wave's Badge and Avatar and the earlier waves' Checkbox, Menu, Link, Pagination, Select, EmptyState, Skeleton and Alert; its component decisions go into this ADR's addendum or an ADR of their own.
