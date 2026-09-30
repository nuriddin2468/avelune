# 0094. FilterPanel: a list's filters in a column that opens beside it, or in a drawer; the applied ones as tags

- Status: Accepted (2026-09-30; the column, the drawer and the tags are the product owner's, "Wave 6 looks" in ROADMAP.md; the rest is the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0044, 0048, 0067, 0080, 0083, 0091, 0093; brief §9.4; WAI-ARIA APG "Disclosure (Show/Hide)", "Dialog (Modal)"

## Context

- The product owner chose (2026-09-30): a column of filters at the start of the list on wide containers, collapsed and opened by a "Фильтры" button; a drawer on a phone; the applied filters as tags above the list. A vertical form lets long Russian and Uzbek labels wrap and holds many filters.
- The showcase's register filters by status in a popover and shows a narrowed filter as tags with "Все статусы" (Wave 3, Wave 5).
- SearchHeader's button drives any `AveSearchFilters` (ADR 0093). While the filters are a column it is a disclosure, whose `aria-controls` must name an element that exists.
- A drawer is a modal `<dialog>` (ADR 0067). The same fields cannot be projected into both the column and the drawer, so the ones shown are stamped from one template, as a DataTable's cells are (ADR 0087).
- Beside a 256px column a table needs about 700px. With the shell's navigation, a list page reaches `container.lg` (960px) from a window of about 1270px.

## Decision

1. **`<ave-filter-panel>` in `@avelune/ui/filter-panel`** (layer `patterns`) keeps `AveSearchFilters`.
   - Its inputs are `label` (the kit's new `filters` message, "Фильтры", by default), `count` (how many filters are applied, which SearchHeader's button shows) and `open` (a model, false by default).
   - `clear` emits when its "Сбросить фильтры" button is pressed. The button shows while `count` is above 0.
   - The fields come as `<ng-template aveFilterPanelContent>`, the application's form fields and choice groups one under another, 16px apart. They are stamped while shown, and their values live in the application's state.
2. **Column or drawer, by its container.** The panel measures the element around it (`ResizeObserver`) against `container.lg`, read from the token's custom property (ADR 0091).
   - **From `container.lg`** it is a column, a `section` named by its `h2` heading (`font.heading-sm`). It is 256px wide (`space.16` × 4) on the surface with a subtle border and `radius.lg`, as a Card. The element stays in the page while closed (`hidden`), so the button's `aria-controls` always names it.
   - **Below `container.lg`** it is a start drawer of the small size, headed by `label`. Under the fields, `aveDialogActions` hold "Сбросить фильтры" (ghost) and "Показать результаты" (primary, the new `showResults` message), which closes it. Filters apply as they change, in both forms.
   - The page places the column (ListPage, ADR 0095), and a closed column takes no room.
3. **`<ave-applied-filters>`** in the same entry point shows the applied filters above the list. `filters` is a list of `{ key, label }`. Each filter is a removable Tag (ADR 0080) in a `ul` named by `label` (the new `appliedFilters` message), followed by a small ghost "Сбросить фильтры". It emits `remove` with the key and `clear`, and draws nothing without filters. A filter's label says its field and its value: "Статус: Подписан".
4. **Checks:** `AveFilterPanelHarness` and `AveAppliedFiltersHarness`, unit tests in Chromium on both sides of `container.lg`, stories, and the showcase's register, where a status group and a term range replace the popover.

## Alternatives considered

- **Projected fields moved between the column and the drawer:** Angular projects content into one place, known when the template compiles. Moving the nodes by hand would detach form controls from their field context.
- **The window's width, not the container's:** a list beside the navigation would open a column that squeezes its table at 1024px (ADR 0091).
- **Apply and Cancel buttons in the column:** the register's filters apply as they change today. A second state for pending filters would double the application's model.
- **The applied tags inside FilterPanel:** they stand above the list, away from the column, and must show while it is closed.

## Consequences

- The kit's messages gain `filters`, `clearFilters`, `showResults` and `appliedFilters` in the four locales.
- A standalone FilterPanel works outside ListPage; its page places the column and keeps its room while it is open.
- The showcase's status popover goes. Its popover story stays the Popover's.

## Addendum: the drawer's fields before it opens, and its actions sharing a row (2026-09-30)

Wave 6's visual review found two problems in the drawer below `container.lg`:

- **Focus opened on "Сбросить фильтры".** The drawer is a modal `<dialog>`, and `showModal()` focuses its first focusable element (ADR 0066). The fields were stamped only while the panel was open, one change detection after the drawer had opened, so that element was the drawer's ghost "Сбросить фильтры". A keyboard user's first Enter would have cleared every filter.
  - Decision: in the drawer the fields are stamped from the start, inside the closed dialog, which shows nothing and hides it from assistive technology. The browser then focuses the first field as it opens. The column still stamps them while it is open, where nothing focuses on its own.
  - The unit test checks that focus opens on the first field. The harness's `getFieldsText()` reads the fields only while they show.
- **Its two actions wrapped into two uneven rows.** In the small drawer (320px), "Сбросить фильтры" and "Показать результаты" do not fit one row. They stood at the end of two rows, one under the other, each as wide as its words.
  - Decision: each action grows to fill its row, as a confirmation's two buttons share their row (ADR 0066). Where they fit, they share one row. Where they do not, each fills a row of its own. The rule sets flex growth only, which `avelune/pattern-layout-only` allows.
