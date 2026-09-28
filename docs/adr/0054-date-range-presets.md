# 0054. DateRangePicker presets: a typed, translated set and the application's own, a listbox beside or above the calendar

- Status: Accepted (2026-09-25; what the periods mean and the narrow layout chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0046, 0047, 0048, 0052, 0053; brief §9.1; ROADMAP.md "Wave 2 additions", item 3

## Context

Facts, verified on 2026-09-25 in Angular Aria 22.2.0 and Chromium 153:

- Reports and filters ask for the same periods again and again: today, this week, last month. The calendar (ADR 0048, 0053) takes two choices and often a move to another month for each.
- Angular Aria's listbox (`ngListbox`, `ngOption`) gives a list of choices its role, the arrow keys, Home, End, typeahead and one Tab stop, with roving focus. Its single selection toggles: Enter, Space or a click on the option already selected takes the selection away.
- The calendar's panel is an overlay attached to the field; its room is the window's, not the field's: a narrow field in a wide page has room beside it.
- The product owner decided (2026-09-25): the built-in periods are whole (this month is the 1st to the last day; last 7 and 30 days end today), the application may pass its own presets, and in a narrow window the list goes above the calendar in one column that scrolls.

## Decision

1. **Types** (`@avelune/ui/date-picker`): `AveDateRangePresetName`, the built-in set: `today`, `yesterday`, `thisWeek`, `lastWeek`, `thisMonth`, `lastMonth`, `thisQuarter`, `thisYear`, `last7Days`, `last30Days`; `AveDateRangeCustomPreset`, `{ label, start, end }` of ISO dates; `AveDateRangePreset`, either. The `presets` input takes a list of them, shown in its order; none by default.
2. **Periods**, from today in the browser's time zone: whole weeks from the locale's first day (`aveDateFormat`), whole months, quarters (January, April, July, October) and years; yesterday and today are one day; the last 7 and 30 days end today.
3. **Words:** the built-in names are kit messages in the four locales (ADR 0047), with the list's name ("Periods", "Периоды"); an application's preset brings its own label.
4. **Bounds:** a preset is cut to `minDate` and `maxDate`; a preset with no day inside them is shown disabled.
5. **The list** is an Angular Aria listbox, named "Periods", in the calendar's dialog, before the calendar in its order: options of the control's height with the select's row (ADR 0046) and a check on the preset whose period is the range chosen now. Choosing one sets the range, closes the calendar and returns focus to its button, as choosing the end does; choosing the checked one again keeps it (Aria's toggle, as in ADR 0053).
6. **Layout:** from `breakpoint.sm` (600px) of the window, the list stands at the calendar's inline start, as tall as the calendar and scrolling past it, with a `border.subtle` line between; in a narrower window it stands above the calendar, as wide as the calendar, four options tall, then scrolling (product owner).

## Alternatives considered

- **Presets as buttons:** a Tab stop each, and no way to say which is the range chosen now.
- **A select of presets above the calendar:** a second overlay in the dialog.
- **Periods up to today** (this month from the 1st to today): the product owner chose whole periods; the last 7 and 30 days end today.
- **A layout from the field's width:** a narrow field in a filter bar would put the list above the calendar with room beside it.
- **Presets on by default:** a list the application did not ask for, in every range field.

## Consequences

- An application that needs a period of its own computes its dates and passes them; the kit does not move them with today.
- The range's panel is wider when it has presets; the field is unchanged.
- The listbox brings Aria's listbox into the date-picker entry point, whose budget grows.
