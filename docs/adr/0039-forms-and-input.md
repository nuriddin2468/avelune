# 0039. Forms and Input: one control state for both form APIs, a field context, a native input

- Status: Accepted (2026-09-24; the input border and the required marker chosen by the product owner, the rest a technical decision within Wave 1)
- Date: 2026-09-24
- Related: 0002, 0004, 0023, 0037; brief §8.1, §8.2, §9.1

## Context

Every kit control must work with Signal Forms and, for legacy code, Reactive Forms (brief §9.1), and a form field shows its label, hint, error and required marker for the control inside it. Facts, verified on 2026-09-24 (Angular 22.1.7):

- Signal Forms are stable (`@publicApi 22.0`). `[formField]` binds a native `<input>` itself: it writes the value and the native `disabled`, `readonly`, `required`, `name`, `min`/`max` and length properties, marks the field touched on blur, and pushes the field's state (`invalid`, `touched`, `errors`, …) into any input of that name on the element's other directives. It provides `FORM_FIELD` (the directive, with `state()`) and an `NgControl` for interop.
- Reactive Forms bind a native input through `DefaultValueAccessor` or `CheckboxControlValueAccessor`. `NgControl` exposes the status as plain getters; `control.events` (value, status, touched, pristine) reports changes. The control of `formControlName` exists only after the first change detection.
- `Validators.required` is found with `control.hasValidator(Validators.required)`; it does not set the native `required` attribute.
- A component may sit on a void element such as `<input>` with an empty template; its emulated styles apply to the host.
- A host attribute binding that evaluates to `null` removes the attribute, so a component that binds `aria-invalid` or `aria-describedby` would erase an application's own value.
- Only `color.border.strong` gives an input's boundary 3:1 (WCAG 1.4.11): 3.66 on the light surface, 4.20 on the dark one; `border.default` gives 1.56 and 2.01.
- The product owner chose (2026-09-24) the darker `border.strong` for inputs, keeping the lighter border on secondary buttons, and an asterisk after the label for required fields.

## Decision

1. **`@avelune/ui/forms`** (layer foundations) holds what every control shares:
   - `injectControlState()`: signals `invalid`, `touched`, `required`, `disabled` and `showError` (invalid and touched), plus `bound`. It reads, in order, `FORM_FIELD`, then `NgControl`, re-reading on `control.events` from the first render, then the element's own attributes.
   - `AVE_FIELD` and `AveFieldContext`: what a form field offers its control (a default id, the ids that describe the control, a `register` call).
   - `connectToField(state)`: the element takes the field's id when it has none and registers its state. `aria-describedby` becomes the element's own ids, as written in the template, followed by the field's. While a form binding shows an error, `aria-invalid="true"`; when the binding requires a value that no native `required` attribute states (Reactive Forms' `Validators.required`), `aria-required="true"`. Without a binding, the application owns both. The attributes are written through `Renderer2`, never by host bindings.
   - `@angular/forms` becomes a peer dependency of `@avelune/ui`.
2. **`AveInput`** (`@avelune/ui/input`, layer components) is a component on `input[aveInput]` with an empty template, for the text types (`text`, `email`, `tel`, `url`, `password`, `search`, `number`); another type throws in development. Its one input is `size`. The value is bound by the forms' native accessors; the kit adds no value accessor.
3. **Look**, from tokens:
   - The control box of its size, the same as Button's: `control.height.*`, `control.padding-inline.*`, `border-width.default`, `radius.md`, 14px text (`font.body-md`).
   - `border.strong` on `bg.surface`, placeholder in `fg.subtle`.
   - The states differ by more than colour. Invalid: the `danger.border` border, and the field's error in words, with an icon. Readonly: a dashed border on `bg.surface-sunken`, the text at full contrast. Disabled: a flat `bg.disabled` fill without a border, `fg.disabled` text, and `GrayText` in forced colours.
   - It fills its container's width.
4. **Harness:** `AveInputHarness` in `@avelune/ui/input/testing`.
5. `input` with `aveInput` joins `kitElements`.

## Alternatives considered

- **Inputs named `invalid` and `touched` on the control, fed by Signal Forms:** it works for Signal Forms only, and a manual `invalid` would clash with the one Signal Forms pushes.
- **A kit `ControlValueAccessor`:** the native accessors of both form APIs already bind a native input; another would compete with them.
- **The form field writing its control's attributes:** it would reach into a child element; the control writes its own, from the context it injects.
- **`border.default` on inputs, to match secondary buttons:** fails WCAG 1.4.11.

## Consequences

- Checkbox and every later control call `injectControlState()` and `connectToField()`; FormField provides `AVE_FIELD`.
- An application that uses no form binding sets `aria-invalid` itself; the docs say so.
- `id` and `aria-describedby` are read from the template once, at creation: an application that binds them dynamically on a kit control inside a form field has to use the field's context instead.
