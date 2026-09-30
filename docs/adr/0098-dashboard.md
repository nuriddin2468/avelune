# 0098. Dashboard: a page's heading, a row of key figures, and cards in up to three columns

- Status: Accepted (2026-09-30, technical decision within Wave 6; the figures' look and the columns are the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0079, 0083, 0086, 0091; brief §9.4; ROADMAP.md, "Out of scope" (charts)

## Context

- Brief §9.4 names a dashboard among the layouts. GUIDELINES.md sends a few records or groups read side by side to cards (ADR 0083). Charts and data visualisation are out of scope (ROADMAP.md).
- A work system's home page says what waits for the person: a few counts ("На согласовании 5", "Истекают в этом месяце 3"), then lists of the records behind them. The kit has Count for a number beside a name (ADR 0079), and nothing for a figure that stands alone with its label.
- Cards in a grid read well at 320px and wider. With 24px gaps a container holds two from 664px and three from 1008px. The container tokens are 480, 640 and 960px.
- A grid cell cannot hold two components: a Card and a marker component on one element fail to compile (Wave 5, ADR 0083).

## Decision

1. **`<ave-dashboard heading description>` in `@avelune/ui/dashboard`** (layer `patterns`) places, 24px apart:
   - the header: the page's `h1` and `description`, with `[aveDashboardActions]` at the row's end for a period or "Настроить", wrapping under the heading on a narrow page;
   - the key figures, `<ave-dashboard-metric>`s, in a row that wraps, each at least 192px wide (`space.16` × 3), a list of figures named by `metricsLabel`;
   - the application's cards as the rest, in one column, two from `container.md` and three from `container.lg`, 24px apart, stretched to the tallest in their row.
2. **`<ave-dashboard-metric label value note>`**, a key figure:
   - `label` is what it counts, muted, in `font.label-md`. `value` is the number in the application's words and format ("34", "1,2 млрд сум"), in `font.heading-xl` with tabular figures. `note` is what it means, muted: "+3 за месяц", "до 31 октября".
   - It sits on a Card's surface: `bg.surface`, `border.subtle`, `radius.lg`, 16px. It has no interaction of its own; a figure that opens its list puts a link in its note.
3. **`[aveDashboardWide]`** goes on the application's element around a card that needs room, such as a list with many columns. It spans two columns from `container.md`. It is a component on a wrapper element, since the card is a component too.
4. **No charts** (out of scope). A figure over time is its value and its note.
5. **Checks:** `AveDashboardHarness`, unit tests in Chromium at one, two and three columns, stories, and the showcase's new home page, the department's overview. The new contract moves to `/contracts/new`.

## Alternatives considered

- **Cards with `auto-fill` columns of 320px:** a wide card would open an implicit column in a one-column grid and overflow it. Queries on the container tokens keep a span within the columns there are.
- **Four columns on a wide window:** four lists side by side are hard to compare and each gets narrow. Three columns suit the card lists of a work system.
- **The figures as Cards with the application's markup:** every product would draw the label, the number and the note differently. The figure is small, and part of this pattern.
- **Count for the figures:** Count is a small number beside a place's name, on the accent fill, and nothing at 0. A dashboard shows 0 as news.

## Consequences

- The showcase gets a home page. The app bar's link and the navigation's "Обзор" lead to it.
- The kit's messages gain nothing: every word is the application's.
