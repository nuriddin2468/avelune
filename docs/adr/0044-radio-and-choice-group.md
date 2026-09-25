# 0044. Radio and choice group: a drawn native radio, a fieldset that describes its choices

- Status: Accepted (2026-09-25, technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0039 (field context changed here), 0040, 0041; brief §9.1; GUIDELINES.md "Radio, select or combobox"

## Context

A radio group answers one question with 2–5 visible options (GUIDELINES.md). A checkbox's error needed the application's own message (ADR 0041); ROADMAP.md planned a group of choices with a legend and one hint and error. Facts, verified on 2026-09-25 (Angular 22.2.0, axe-core 4.13):

- Signal Forms bind a radio natively (`checked` is `value === element.value`) and write its `name` and `required`; Reactive Forms bind it through `RadioControlValueAccessor` (`formControlName` on each radio); both mark the control touched on blur.
- Native radios of one `name` move the choice with the arrow keys and take one Tab stop, as the WAI-ARIA radio group pattern asks.
- ARIA does not allow `aria-required` on `role=radio` (axe `aria-allowed-attr`); it allows it, and `aria-invalid`, on `radiogroup`. A `<fieldset>` is a `group`, named by its `<legend>`.
- A fieldset's rendered legend is not a grid item: `gap` does not reach it, its margin does.
- The field context of ADR 0039 gave every control the field's id and description, which suits one control, not several.

## Decision

1. **`AveRadio`** (`@avelune/ui/radio`, layer components) on `input[type=radio][aveRadio]`, empty template, `injectControlState()` and `connectToField()`. Drawn like the checkbox (ADR 0041): a 16px circle with a `border.strong` border; checked, the `accent.bg` fill with a 6px dot in `fg.on-accent`; the same invalid, disabled and forced-colours rules. Its label is `label[aveChoice]` from `@avelune/ui/checkbox`.
2. **`AveChoiceGroup`** (`@avelune/ui/form-field`, layer composites) on `fieldset[aveChoiceGroup]` with a required `legend` input. It renders the legend (with the asterisk when every control is required: a group of radios, or of one required checkbox; a mixed group of checkboxes shows none), the choices one under the other 8px apart, the hint and the error with its icon, and reuses `[aveHint]` and `[aveError]`.
   - The group, not each control, is described: `aria-describedby` on the fieldset lists the application's own ids, the hint and, while it shows, the error.
   - A group that holds a radio is a `radiogroup`, labelled by its legend, with `aria-required` and `aria-invalid`.
   - The error shows whenever it is in the template without a form binding; with one, once a control of the group is touched, so a group-level rule ("choose at least one") shows too.
   - The legend dims when every control, or the fieldset itself, is disabled.
3. **Field context** (changes ADR 0039): `AveFieldContext.defaultId` is `string | null`, `null` for a group, whose controls keep their own ids; `register(control, state)` receives the control's element instead of its id. `connectToField()` never writes `aria-required` on a radio.
4. **Harnesses:** `AveRadioHarness` (`@avelune/ui/radio/testing`) and `AveChoiceGroupHarness` (`@avelune/ui/form-field/testing`), a content container for the radio and checkbox harnesses.
5. `input` with `aveRadio` joins `kitElements`.

## Alternatives considered

- **`<ave-radio-group>` wrapping the fieldset:** wraps a native element (brief §9.1), and Angular's content projection would need the radios to be told their name.
- **Angular Aria's listbox as a radio group:** hand-made semantics where native radios already carry them.
- **The hint above the choices (GOV.UK):** the kit keeps one order in every field: question, answer, hint, error.
- **`aria-describedby` on every control:** screen readers would repeat the hint on each option.

## Consequences

- A checkbox's error no longer needs an element of the application's: put the checkbox in a group.
- A group of radios says "required" once, on the group, for both form APIs.
- Horizontal layouts of short options ("Yes" / "No") are not in this version.
- `@avelune/ui/forms` is beta and its field context changes shape; no application implements `AveFieldContext` (the kit's fields and groups do), so no migration is needed. The change is recorded for the changeset when changesets arrive with CI.
