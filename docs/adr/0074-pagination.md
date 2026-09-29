# 0074. Pagination: seven places for page numbers, the current page on the accent fill, a compact form in narrow containers

- Status: Accepted (2026-09-29; the current page's look chosen by the product owner, the rest a technical decision within Wave 4)
- Date: 2026-09-29
- Related: 0037, 0038, 0046, 0047, 0048, 0050; brief §9.1, §9.4

## Context

Brief §9.4 lists Pagination in Wave 4. Facts, verified on 2026-09-29 (Angular 22.2.0, Chromium 153):

- The APG has no pagination pattern. Common practice (GOV.UK, USWDS) is a `nav` landmark named for the pages, a list of buttons or links, `aria-current="page"` on the current page, and names that say "page" ("Страница 5").
- A work system's lists page in place: the page is state, often in the address's query, which the application writes; links would need the application's routes.
- A button that becomes `disabled` while it has focus drops focus to the page: "Next" on the last page would. `disabledInteractive` keeps a kit button focusable (ADR 0037).
- A row of numbers that changes length as people page moves the arrows under the pointer.
- Chromium drops focus from an element moved in the DOM, which a list tracked by page number does as its window shifts.

## Decision

1. **`@avelune/ui/pagination`** (layer composites), `AvePagination` (`<ave-pagination>`): `total` (required, the number of items), `page` (a model, 1-based, kept within the pages) and `pageSize` (20 by default). Nothing is drawn while `total` is 0: the list's empty state speaks then.
2. **Buttons, not links:** the application writes the page into its address if it wants to; the component emits `pageChange`.
3. **Seven places:** up to seven pages show every page; more show the first, the last, the current and its neighbours, and an ellipsis for each gap, always seven places, so the row keeps its length. The places are tracked by position, so no button moves in the DOM; after a page button is pressed, focus goes to the new current page's button.
4. **Look:** the previous and next pages are ghost IconButtons (`chevron-left`, `chevron-right`), which stay focusable when there is no page there (`disabledInteractive`). Page buttons are the kit's own: `control.height.md` square at least, `radius.md`, `font.label-md` with tabular figures, the hover fill; the current page on `accent.bg` with `fg.on-accent` (product owner, 2026-09-29), as a calendar's chosen day. The range ("21–40 из 134", `role="status"`, so a new page is announced) stands at the start, the pages at the end, wrapping under each other in a narrow container. Below `container.sm` the numbers give way to "Страница 3 из 12" between the arrows (a container query).
5. **Words:** `pagination`, `previousPage`, `nextPage`, `page(n)`, `pageOf(page, count)` and `itemRange(from, to, total)` in the kit's messages; numbers through `aveNumberFormat`.
6. **Harness:** `AvePaginationHarness` (`@avelune/ui/pagination/testing`): the range, the pages shown, the current page, going to a page, the previous and the next.

## Alternatives considered

- **Links with an address per page:** the kit would need the application's routes and query names; a list that pages in place needs neither.
- **A row of every page, or a changing number of places:** too long for long lists, or the arrows move as people page.
- **Page buttons as Buttons:** a Button's padding makes "1" and "12" of different widths, and its variants have no chosen state; a calendar draws its days itself for the same reason.
- **Hiding the pagination on a single page:** the range still says how many items there are; the arrows show as unavailable.
- **A choice of page size:** a select that must always hold a value, which the select family's clear button (ADR 0052) works against outside a form; with the DataTable (Wave 5).

## Consequences

- The showcase's register pages its contracts, ten to a page.
- A page's number buttons are not Buttons, so the same-size invariant does not measure them; their height is the control height all the same.

## Addendum: a name of the page's own (2026-09-29)

The docs page, which draws the stories together, broke axe's `landmark-unique` with landmarks all named "Страницы", as a page with a pagination over and under a long list, or two lists, would (the first visual run of Wave 4). `label` (optional) names the landmark; the kit's words stay the default.

## Addendum: a list whose items are on their way (2026-09-29)

A review of Wave 4 found that while `total` was 0 the page was clamped to 1, so a list paged from the address (`?page=3`) lost its page before the server's first answer, and that the range's live region appeared with its first range, which screen readers then did not announce. While `total` is 0 the page stays as the application set it, and the range is a live region from the start, before the landmark, empty until there are items.

## Addendum: a page size (2026-09-29)

With the DataTable, ADR 0087 gives the pagination `pageSizes` and makes `pageSize` a model: a select after the range, named "На странице", which always holds a value (the select's new `required`), and a new size shows the page that holds the first item seen so far. The alternative this ADR set aside for the select's clear button no longer applies.
