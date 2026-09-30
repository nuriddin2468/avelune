# 0087. DataTable: columns as data, header buttons that sort, checkboxes that choose, a page size in the pagination

- Status: Accepted (2026-09-29; the lines between rows and the chosen rows' fill chosen by the product owner, the rest a technical decision within Wave 5)
- Date: 2026-09-29
- Related: 0046, 0052, 0055, 0074, 0078, 0079, 0082; brief §8.2, §9.1, §9.4; WAI-ARIA APG "Table", "Sortable Table"

## Context

ADR 0078 made the DataTable a native table the kit draws, one page at a time, and left its component decisions to this ADR. Facts, verified on 2026-09-29 (Angular 22.2.0, Chromium 153):

- The APG's sortable table puts a button in each sortable header and `aria-sort` on the sorted header only; each press toggles between ascending and descending.
- The product owner chose lines between rows and, for chosen rows, the neutral `bg.active` fill with the checkbox (2026-09-29).
- The showcase's register draws a list of contracts by hand: a number, a subject that links the record, a counterparty, an amount, a status Badge, an end date and a row Menu, ten to a page.
- The select's clear button shows while its value may be taken away, which a form's required validator stops (ADR 0052); outside a form nothing stops it, and a page size always holds a value. `injectControlState` reads `required` from the element, which a component's host is not.
- A table's cell sets its column's width in automatic layout, and never narrower than its content: text wraps to its longest word.
- A box that scrolls must be reachable from the keyboard (WCAG 2.1.1; axe `scrollable-region-focusable`) when nothing inside it takes focus.
- An element with `position: sticky` sticks inside its nearest scrolling ancestor; a box that scrolls sideways scrolls both ways.

## Decision

1. **`@avelune/ui/data-table`** (layer composites), `AveDataTable<R, K>` (`<ave-data-table>`): `label` (required: the table's caption, visually hidden, and its pagination's name), `rows`, `columns`, `rowKey` (the row's key, which tracks it and says it is chosen), `source` (`local`, the default: the table sorts and pages `rows`; `server`: `rows` is the page the server sent, in its order, and `total` says how many there are), `sort` (a model), `selectable` and `selected` (a model of keys), `page`, `pageSize` and `pageSizes` (models and the sizes offered: 10, 20, 50, 100), `resizable` and `widths` (a model of widths in pixels by column), `loading`, `failed` and `retry` (an output).
2. **Columns as data**, `AveColumn<R>`: `key`, `header`, `value` (what the cell shows without a template, numbers written for the locale, and what sorting compares), `sortable`, `numeric` (aligned to the end in tabular figures), `rowHeader` (the row's title, a `th scope="row"`) and `hideHeader` (the words said, not shown: a column of menus). Rich cells are the application's templates, `ng-template aveCell="key"`, typed by `aveCellOf` as the select family's are (ADR 0055).
3. **Sorting:** a sortable header is a button with the header's words and an arrow: `arrow-up` or `arrow-down` while it sorts, a muted `arrow-up-down` while it does not. The first press sorts ascending, each next press turns the order over, and the page goes back to the first; `aria-sort` is on the sorted header only. Local rows are compared by `value`: numbers as numbers, text by the locale's collation with numbers inside it in order, empty values last, equal rows in their own order. The server's rows stay as they came; the application reads `sort`.
4. **Selection:** a first column of checkboxes. A row's checkbox is named "Выбрать" and the row's title (its row header, or its first cell); the header's checkbox chooses every row of the page and is mixed while some are chosen. Chosen rows take `bg.active` (product owner). `selected` holds keys, so a choice stays across pages and sorts; the rows' actions are the application's, beside the table.
5. **Pages:** the kit's Pagination under the table, named "Договоры: страницы" (`pagesOf`), with a page-size select. `AvePagination` gains `pageSizes` (none by default: no select) and its `pageSize` becomes a model; the select stands after the range, named by the words before it ("На странице"), and a new size shows the page that holds the first item seen so far. `AveSelect` gains `required`: no clear button, and `aria-required` outside a form. A page size is a select although it has four options (GUIDELINES.md sends fewer than six to radios): it is a setting of a toolbar, which people expect there, not a question of a form.
6. **Look:** the box as the List's (`bg.surface`, a `border.subtle` border, `radius.lg`); the header in `font.label-md` and `fg.muted` on `bg.surface` over a `border.default` line; rows of `control.height.lg` at least, so density applies, 8px and 12px of padding, cells centred in their row, text wrapping; `border.subtle` lines between rows (product owner); no hover fill, since a row is not a control (ADR 0078).
7. **Sticky header:** the header's cells stick to the top of the table's box on `z-index.sticky`; the box scrolls both ways once the application bounds its height. While its content overflows, the box is a region named by the table's label, and a Tab stop.
8. **Resizing:** with `resizable`, each header has a native range at its inline end, named "Ширина столбца «Сумма»": the arrows change the width by 8px, from 48px to 960px, and a pointer drags it. The range reads the width the column is drawn at, since content keeps a column from narrowing further.
9. **States in the table's body**, under its header: while `loading`, skeleton rows (as many as the rows shown, five when there are none) and `aria-busy`; when `failed`, a danger Alert "Записи не загрузились." with a Retry button that emits `retry`; with no rows, the application's empty state (`[aveDataTableEmpty]`), or an EmptyState "Записей нет".
10. **Harness:** `AveDataTableHarness` (`@avelune/ui/data-table/testing`): the headers, the cells by row, sorting, choosing rows and the page, the chosen rows, the states, a column's width, and the pagination's harness.

## Alternatives considered

- **Three presses (ascending, descending, none):** the APG toggles; a register's own order is a sort the application sets first.
- **Choosing a row by a click on it:** a row holds links and menus, and ADR 0078 gives it no click of its own.
- **Choosing every row of every page:** the header chooses the page; "all 134" across a server's pages is the application's action, with its own words.
- **A `role="separator"` splitter for resizing:** its keyboard would be written by hand (non-negotiable 5); a range has it natively.
- **A hover fill on rows:** it says a row can be pressed, which it cannot.
- **Radios for the page size:** four more Tab stops beside every table.

## Consequences

- Every pagination carries the select in its bundle, used or not; its budget rises with it (ADR 0028).
- The showcase's register is a DataTable: sortable, with chosen rows, sizes of a page, and its menus in a column.
- A table on a phone scrolls sideways inside its box; a card view of the rows is a pattern for Wave 6.

## Addendum: the wave's visual review (2026-09-29)

The first visual run and its review found four things, now part of the decisions above:

- **A set width is a minimum too.** A table wider than its box lays its columns out at their content's narrowest, where a cell's `inline-size` counts for nothing: a column people widened stayed as it was. The width people set is the header's `min-inline-size` as well.
- **Headers on one line.** Headers wrapped ("Сумма, / сум") beside their arrows while the cells' text had room; the header's words keep one line, and a table wider than its box scrolls.
- **No skeleton in a column of controls.** A column whose header is only said (a row's menus) has no content while rows load, and its skeleton shrank to a dot; its cells stay empty.
- **Docs pages name each table apart.** The stories' tables shared a name, and with it their paginations' landmarks (axe `landmark-unique`); each story's table has a name of its own.
