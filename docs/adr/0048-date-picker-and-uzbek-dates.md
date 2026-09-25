# 0048. DatePicker and DateRangePicker: ISO dates, a calendar on Angular Aria's grid, Uzbek dates written by the kit

- Status: Accepted (2026-09-25, technical decision within Wave 2); a range that may be cleared has a wider end input (0052)
- Date: 2026-09-25
- Related: 0046, 0047; brief §9.4 (DatePicker locale-aware, uz-Latn and ru first day and month names); ROADMAP.md tracked risk "Chromium's Intl formats uz"

## Context

Facts, verified on 2026-09-25 in the pinned image's Chromium, Firefox and WebKit, and in Angular 22.2.0 / Aria 22.2.0:

- **Chromium has no Uzbek (Latin) data.** `uz` and `uz-Latn` resolve but format with root patterns: `2026 M09 23`, month `M09`, weekdays `Wed`, numbers `1,234,567.8`. Chrome and Edge are Chromium. Firefox and WebKit give CLDR's `23-sentabr, 2026`, `Sentabr`, `Chor`, `1 234 567,8`, and the same month and weekday names, in full and abbreviated (`Yak Dush Sesh Chor Pay Jum Shan`, where Chromium gives `Sun Mon Tue`; extracted from both, identical). `uz-Cyrl`, `ru` and `en` format correctly everywhere.
- A native `<input type="date">` shows the operating system's locale, not the application's, and its calendar cannot be styled.
- Angular Aria's grid (`ngGrid`, `ngGridRow`, `ngGridCell`) gives a table the arrow keys, Home and End, and single selection by click, Enter or Space; its official calendar example moves to the next or previous month itself at the month's edges.
- Signal Forms binds a control's `min` and `max` inputs typed as its value (`NonNullable<TValue> | undefined`); a range's `min` would have to be a range.
- `Date` objects carry a time zone; a calendar date typed in Tashkent must stay the same date on a server elsewhere.

## Decision

1. **Values are ISO calendar dates** (`AvePlainDate`, `2026-09-23`): a date field's value is `AvePlainDate | null`; a range's is `AveDateRange` (`start`, `end`, either `null`), or `null` while both are missing. Bounds are `minDate` and `maxDate`.
2. **`aveDateFormat(locale)`** in `@avelune/ui/i18n` writes and reads dates: the numeric form people type (`23.09.2026` ru, `23/09/2026` uz-Latn and uz-Cyrl, `09/23/2026` en) and its placeholder in the locale's letters (`дд.мм.гггг`, `kk/oo/yyyy`, `кк/оо/йййй`, `mm/dd/yyyy`), the date in words, the month and year of a calendar heading, the weekday names from Sunday (in full, and abbreviated with a capital for the calendar's columns, "Пн Вт Ср", because single letters repeat: П, В and С twice in Russian), and the first day of the week (Sunday for English without a region or in the US, Monday otherwise). Intl writes every locale except Uzbek in Latin script, which the kit writes from the CLDR data above. Parsing accepts `.`, `/`, `-` or a space between the parts and a two-digit year (20yy), and refuses dates that do not exist.
3. **`@avelune/ui/date-picker`** (layer composites):
   - `<ave-date-picker>`: an input with Input's box, and a calendar button 4px inside its end (radius concentric), so the input's focus ring surrounds both; the button's own ring is drawn inside its edge (`data-focus-ring="inset"`), because outside it would lie on the field's border. Typed text is read on Enter or when focus leaves the field; a date outside the bounds, or not a date, is put back; an emptied field clears the value.
   - `<ave-date-range-picker>`: two such inputs with a dash between them and one calendar; the first date chosen sets the start, the second the end (a date before the start restarts the range); days between are marked. An end typed before the start swaps them. Each input is named by the field's label (or the range's `label` input, without a field) and "Start date" or "End date" (`aria-labelledby`, with the field's new `labelId`), and both are described by the field's hint and error. The inputs share two equal columns; in a container narrower than `container.xs` (320px), where two dates no longer fit side by side, the end input goes under the start input (a container query).
4. **The calendar** is a dialog (`aria-modal`, CDK's focus trap) in CDK's connected overlay, with the popover's surface and motion (ADR 0046's `aveOverlayPresence`). It opens on the chosen date (or today, within the bounds) with focus on that day; a choice or Escape closes it and returns focus to the button; a click outside closes it. Its heading, between the buttons to the months before and after, is a live region. The grid is Angular Aria's: the arrows move between days, and at the month's edges into the next or previous month; Page Up and Page Down move a month, with Shift a year. Today has a 3:1 border; the chosen day, and a range's ends, the accent fill; days between, `accent.bg-subtle`; days outside the bounds are disabled.
5. **`@avelune/ui/overlay`** (layer foundations) now holds `aveConnectedOverlay()` and `aveOverlayPresence()`, which the select family and the date fields share, and Wave 3's overlays will; `@avelune/ui/forms` holds `aveControlTarget` and `AVE_CONTROL_OWNER`.
6. **Messages** (ADR 0047): `chooseDate`, `previousMonth`, `nextMonth`, `rangeStart`, `rangeEnd` in the four locales.

## Alternatives considered

- **`<input type="date">`:** the operating system's locale and calendar, not the application's.
- **`Date` values:** a time zone that shifts dates.
- **Intl for Uzbek in Latin script:** wrong in Chrome and Edge, the browsers most consumers use.
- **A range as two date fields:** two calendars for one question, and two controls registering with one form field.
- **`min` and `max` inputs:** a clash with Signal Forms' control contract for the range.

## Consequences

- The ROADMAP risk on Uzbek formatting is resolved for dates; numbers follow with Slider.
- Uzbek month and weekday names are the kit's data: an update of CLDR is taken by hand, checked against Firefox and WebKit.
- Times and time zones are out of scope; a date-time field would be a new component.
