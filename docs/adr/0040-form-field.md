# 0040. FormField: a label, a projected control, a hint and an error that register themselves

- Status: Accepted (2026-09-24; the asterisk chosen by the product owner, the rest a technical decision within Wave 1)
- Date: 2026-09-24
- Related: 0026, 0036, 0039; brief §7.3, §9.1

## Context

Brief §9.1 names FormField a true composite: label, hint, error and required marker around one control. ADR 0039 gives the control's side: it registers its id and state with `AVE_FIELD` and describes itself with the field's ids. Facts, verified on 2026-09-24 (Angular 22.1.7):

- A component's emulated styles do not reach content projected into it; projected hint and error elements need styles of their own.
- `contentChildren()` compiles to query functions that tests cannot call, so a file using it cannot reach the 90% function threshold (ADR 0026).
- `aria-hidden` text is left out of an accessible name: a label "Contract number *" with a hidden asterisk names its control "Contract number".
- The product owner chose (2026-09-24) an asterisk after the label for required fields.

## Decision

1. **`AveFormField`** (`@avelune/ui/form-field`, layer composites), `<ave-form-field label="…">`, provides `AVE_FIELD` (ADR 0039). Its template is a `<label for>` naming the control, the projected control, the hint, and, while it shows, the error behind a `circle-alert` icon.
2. **Hint and error** are components on any element, `[aveHint]` and `[aveError]`, with their own styles. Each keeps the element's id or generates one. It adds itself to the field around it (a private token) when created and removes itself when destroyed, so an error inside an `@if` comes and goes. No content queries.
3. **When the error shows:** with a form binding, once the control is invalid and touched (`showError`); without one, whenever the template has an error. The control's `aria-describedby` lists the hint, then the error while it shows.
4. **Required:** an asterisk after the label, in `danger.fg`, hidden from assistive technology, when the control state says required. The control states it itself: the native `required` attribute, or `aria-required` from ADR 0039.
5. **Layout:** one column, the width of its container; the label 8px above the control, the hint and the error 4px under it (GUIDELINES.md); label type `label-md`, hint and error `body-sm`. The label dims with a disabled control.
6. **Harness:** `AveFormFieldHarness` (a content container, so a control's harness loads from it): label, control id, required, hint, error.

## Alternatives considered

- **`hint` and `error` string inputs:** an error depends on which rule failed, and the template chooses it; projection keeps that in the application's hands.
- **`contentChildren()` for the hints and errors:** untestable generated functions, see Context.
- **"(required)" in words, or marking optional fields instead:** the product owner chose the asterisk.
- **A live region for errors:** an error appears when the person leaves the field, and is read when they return; announcing it as they move on would interrupt the next field.

## Consequences

- A form above its fields explains the asterisk once ("* Required field"), in the application's language.
- Later single-value controls (Select, Combobox, DatePicker, Textarea) work in the field as soon as they call `connectToField()`.
