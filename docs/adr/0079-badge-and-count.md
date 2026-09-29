# 0079. Badge and Count: a record's status in words on its tinted fill, and a number that needs attention

- Status: Accepted (2026-09-29; the badge's look chosen by the product owner, the rest a technical decision within Wave 5)
- Date: 2026-09-29
- Related: 0050, 0061, 0072; brief §4.2, §9.1, §9.4; WCAG 1.4.1, 1.4.3, 1.4.11

## Context

Brief §9.4 lists Badge in Wave 5. Facts, verified on 2026-09-29 (Angular 22.2.0, Chromium 153):

- The showcase writes a contract's status as coloured words (`contracts.css`, `.status`); the Alert's subtle fills carry the status colours already, and `contrast-pairs.json` holds each status's `fg` on its `bg-subtle` at 4.5:1.
- `color.bg.active` is translucent (8% of the ink in light), so a fill of it keeps its shape on a row that is hovered or chosen with the same fill (ADR 0078's chosen row, product owner, 2026-09-29).
- Navigation shows how many items wait in a place ("Входящие 12"); the sidebar navigation's links take their name from their content (ADR 0072), so a number inside is read after the page's name.
- `aveNumberFormat` writes numbers in the four locales (ADR 0050). ARIA 1.2 prohibits `aria-label` on a generic `span`.

## Decision

1. **`@avelune/ui/badge`** (layer components) holds two components.
2. **`AveBadge`** (`<ave-badge variant>`): the status of a record in words, its content. `variant` is `neutral` (default), `info`, `success`, `warning` or `danger`; the application maps its statuses to them ("Подписан" `success`, "Истёк" `danger`).
   - **Look (product owner, 2026-09-29):** a tinted rectangle: the variant's `bg-subtle` with its `fg`, `radius.sm`; neutral `bg.active` with `fg.muted`. `font.label-sm`, 20px tall, 8px inline padding; text wraps and never truncates. A transparent border only forced colours paint, where the fill is dropped, as the Alert's.
   - **No role and no icon:** the words say the status, the colour repeats it (WCAG 1.4.1); a status that changes after an action is announced by what the action shows (a toast, the page's live region).
3. **`AveCount`** (`<ave-count [value] max>`): how many items need attention, beside a place's name. The number in `aveNumberFormat` of the application's locale, tabular, on the accent fill with `fg.on-accent`, `radius.full`, 20px tall and at least as wide; above `max` (99 by default) "99+"; nothing drawn at 0 or below. It is text, read after the name around it; the application words that name so the number makes sense.
4. **The sidebar navigation** (ADR 0072, addendum) takes `count` on a page, drawn as an `AveCount` at the row's end.
5. **Harnesses:** `AveBadgeHarness` (the words, the variant) and `AveCountHarness` (the text shown, the value) in `@avelune/ui/badge/testing`.

## Alternatives considered

- **A pill, or a dot and words** (the product owner's other options): the rectangle matches the Alert's fills, and leaves the pill to the count and the outlined rectangle to the Tag.
- **Solid status fills:** loud in a table of twenty rows, where every row has one.
- **Badge sizes:** one size fits a 40px row, a card's heading and a list's line; a second waits for a need.
- **A count inside `AveBadge` (`count` input):** a number has its own formatting, cap and emptiness; one component per job keeps both inputs typed.
- **An `aria-label` for the count:** prohibited on a generic element, and a hidden sentence would repeat the visible name.

## Consequences

- The showcase's register and a contract's page show their statuses as badges; the navigation counts the register's expired contracts.
- A status needs words in every locale the application has; the kit adds none.
