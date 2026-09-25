# 0053. The calendar's months and years: its heading opens a grid of months, then of years, on Angular Aria's grid

- Status: Accepted (2026-09-25; the heading's look chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0047, 0048, 0052; brief §9.1; ROADMAP.md "Wave 2 additions", item 2

## Context

Facts, verified on 2026-09-25 in Angular Aria 22.2.0 and Chromium 153:

- The calendar (ADR 0048) moves a month at a time with its buttons and Page Up or Page Down, a year with Shift. A date ten years away (a date of registration, the end of a long contract) takes dozens of presses.
- Angular Aria's grid (`ngGrid`, `ngGridRow`, `ngGridCell`) gives any table the arrow keys, Home and End, and a single selection by click, Enter or Space; the day grid already uses it.
- `Intl.DateTimeFormat` with `{ month: 'long' }` alone writes a month in the nominative, as a name stands alone ("сентябрь", "сентябр", "September"); with a day it writes the genitive ("23 сентября"). Uzbek in Latin script is the kit's data (ADR 0048), whose stand-alone months are the months of a date with a capital ("Sentabr").
- The heading is a live region (ADR 0048), so screen readers hear the month when it changes.
- Aria's grid in single selection toggles: Enter, Space or a click on the cell already selected takes its selection away (`toggleOne` in `@angular/aria`'s grid behaviour), and on another cell first takes every selection away, then selects it. The day grid listened for a selection only, so choosing the day already chosen did nothing and left it unmarked.
- A view drawn anew removes the cell or the heading button that has focus; focus then leaves the field, whose `focusout` closes the calendar.
- The day grid is as tall as its month's weeks: four to six rows.
- The product owner chose (2026-09-25) a heading that looks as it does today and shows a fill under the pointer, without a chevron.

## Decision

1. **Three views** of one calendar (`AveCalendar`, shared by DatePicker and DateRangePicker): days (as before), the twelve months of a year, and twelve years (a page of years whose first is a multiple of 12, `2016–2027`). Each is a table on Angular Aria's grid, three columns by four rows for months and years.
2. **The heading** is a button inside the heading element, which stays the live region: "Сентябрь 2026 г." opens the months of 2026; "2026" opens the years; the years' heading, "2016–2027", is text. The button looks like the heading and takes `bg.hover` under the pointer (product owner), `radius.sm`, and the kit's focus ring; it is described by "Choose a month" or "Choose a year" in the locale (new messages).
3. **Choosing:** a month opens its days, with focus on the same day of the month, or its last day when the month is shorter; a year opens its months, with focus on the same month. The buttons before and after the heading move a month, a year or twelve years, and are named for it (new messages: previous and next year, previous and next years).
4. **Keyboard**, as in the days: the arrows move within the grid and past its edges into the year or the page before or after; Page Up and Page Down move a year (months) or twelve years (years); Home and End go to the row's ends; Enter or Space choose. Escape in the months or years goes back to the days, with focus on the day it left; Escape in the days closes the calendar, as before. The keys that leave the grid are the calendar's own, read before the grid's (ADR 0048).
5. **Bounds:** a month or a year with no day within `minDate` and `maxDate` is disabled; the arrows and pages never move focus onto one.
6. **Marks:** the current month and year have today's border (`aria-current="date"`); the month or year of the chosen date (a range: of either end) the accent fill (`aria-selected`). Each month is named with its year ("Сентябрь 2026 г."), so a screen reader hears the year it belongs to.
7. **Names:** `AveDateFormat` gains `months`, the twelve stand-alone month names with a capital, from Intl or, for Uzbek in Latin script, the kit's data.
8. **One size:** the calendar is as wide as seven days and as tall as the weekdays and six weeks in every view and every month, so the panel never jumps; the months and years fill it.
9. **A press is read whole:** the selection changes of one press are read together, after it: the cell selected is the one chosen, or else the one cell whose selection was taken, the one already chosen. Before a view is drawn anew, the calendar itself (`tabindex="-1"`, out of the Tab order) takes focus from a cell or the heading, until the new view's cell takes it.

## Alternatives considered

- **A select of months and a field for the year above the grid:** two more controls in a dialog, and a nested overlay for the select.
- **A year field people type into:** a third way to move, and a number to check against the bounds by hand; the years grid shows which years can be chosen.
- **Only Shift and Page Up or Page Down for years:** not found by a pointer or a touch screen.
- **A chevron in the heading:** the product owner chose the fill alone.

## Consequences

- Both date fields gain the views; the range's calendar only moves between months and years, and never chooses one.
- The calendar's keyboard handler reads three views; its tests cover the edges of each.
- The heading is focusable, so Tab in the calendar goes through the month buttons and the heading before the grid.
