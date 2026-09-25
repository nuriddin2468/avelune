# 0052. Clearing a selection field: a clear button while the value may be taken away, deleting on the keyboard

- Status: Accepted (2026-09-25; the icon and the range's layout chosen by the product owner, the rest a technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0039, 0046, 0047, 0048, 0049, 0050; brief §8.1, §9.1; ROADMAP.md "Wave 2 additions", item 1

## Context

Facts, verified on 2026-09-25 in Angular 22.2.0, Angular Aria 22.2.0 and Chromium 153:

- The select and the multiselect trigger is a `<button>`. HTML allows no interactive content inside a button, so a second button cannot sit in the trigger.
- Angular Aria's combobox (`ComboboxPattern` in `@angular/aria/private`) handles no Delete or Backspace on a select-only trigger: closed, it opens on Down, Enter and Space; open, it passes the arrows, Home, End, Page Up and Down, Enter, Space and single characters to the list. A select's list has no empty option, so once a select had a value, nothing took it back to none.
- The combobox and the date fields are text inputs: deleting their text clears the value when the person leaves, and a date field also on Enter (ADR 0046, 0048).
- A required field would be made invalid by clearing it; a readonly or a disabled field cannot change.
- The date field's calendar button is a square of the control height minus 8px, 4px inside the field, with an inset focus ring (ADR 0048).
- A range's two inputs share equal columns (ADR 0048). With a clear button beside the calendar button in the end input, the end date ("23.09.2026", about 75px at `body-md`) no longer fits its input in containers from 320 to 341px, a 360px phone's form column among them.
- The product owner chose (2026-09-25) Lucide's `x`, and for the range the clear button beside the calendar button in the end input, with the end input wider by the clear button whenever the range can be cleared, so both dates show in full down to 320px and nothing moves when a value arrives.

## Decision

1. **When:** a Select, Combobox, Multiselect, DatePicker or DateRangePicker shows a clear button while it has a value (a range: either date; a multiselect: at least one option), is enabled, is not readonly, and is not required (the control state's `required`, ADR 0039 and 0049). No input turns it on or off: whether an empty answer is valid decides.
2. **Look:** `AveClearButton` (`button[aveClearButton]`, in `@avelune/ui/forms`, used by all five, which give it its icon as its content, so the template rule that a button has content holds): the calendar button's square (the control height minus `space.2`, `radius.sm`, 4px inside the field's block edges, `data-focus-ring="inset"`), with Lucide's `x` at `size.icon.sm` in `fg.muted`, and `bg.hover` with `fg.default` under the pointer.
3. **Place:** at the field's inline end, before what is already there:
   - Select and Multiselect: before the chevron, the button's box ending where the chevron begins (two neighbouring icons, as the date field's two buttons);
   - Combobox: 4px inside the input's end;
   - DatePicker: before the calendar button;
   - DateRangePicker: before the calendar button, in the end input.
   The text stops `space.1` before the button: the field's inline-end padding grows while it shows. The text is aligned to the start, so nothing moves. A range that can be cleared makes its end column wider, by the difference between the end input's padding with both buttons and the start input's, so both inputs have the same room for their text; a range that cannot be cleared keeps equal columns.
4. **Keyboard:** the button is not a Tab stop (`tabindex="-1"`). People clear with the keyboard by deleting: a date field by emptying its text, read on Enter or when they leave; a combobox by emptying its text and leaving it; a select or a multiselect by Delete or Backspace on its trigger, while the button would show. The kit writes that key itself: Aria has none for it (brief §9.1).
5. **Clearing:** a press does not take focus (the button prevents the default of `mousedown`); the value becomes `null` (`[]` for a multiselect), an open list or calendar closes, and focus goes to the field: the trigger or input, a range's start input. No library behaviour covers the return of focus; the kit writes it, as FileUpload does (ADR 0050). For the forms, clearing is a change of the value like a choice: Signal Forms see the `value` model change, Reactive Forms get `onChange`. The field is touched when the person leaves it, as before.
6. **Name:** the new message `clear` ("Очистить", "Tozalash", "Тозалаш", "Clear"; ADR 0047), then the field's label: `aria-labelledby` with the form field's `labelId`, or a hidden copy of the `label` input without a field, so a screen reader hears "Очистить Вид договора".

## Alternatives considered

- **An empty option in the select's list** ("Not chosen"): it helps the select only, and it is a choice that means no choice.
- **The button as a Tab stop:** one more stop for every filled field of a long form; deleting is the keyboard's way to clear, and the WAI-ARIA combobox pattern has no clear button.
- **A button that shows on hover, or replaces the chevron or the calendar button:** a touch screen never shows it, and the field would lose its sign of what it opens.
- **A `clearable` input:** one more input on five components, where required already says whether a field may be empty.
- **The range, with equal columns and both buttons in the end input:** the end date is cut in containers from 320 to 341px. **Going under the start input below `container.sm`:** a two-column form at 1280px would show every range on two rows. **The clear button in the start input:** it reads as clearing the start only. The product owner chose the wider end input.

## Consequences

- ADR 0048's equal columns hold for a range that cannot be cleared; one that can has a wider end input. ADR 0048 is otherwise unchanged.
- The baselines of every story with an editable, optional value in the five components change; the same-size invariant is unaffected, since the button changes no box.
- A select or multiselect clears on Delete or Backspace; its docs page and the harness say so. The date fields' stories find the calendar button by its popup, no longer as the field's first button.
