# 0049. A list that must hold an item: `minLength(path, 1)`, shown as required

- Status: Accepted (2026-09-25, technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0039, 0046, 0050

## Context

Facts, verified on 2026-09-25 in `@angular/forms` 22.2.0:

- Signal Forms' `required` fails only on `''`, `false`, `null`, `undefined` and `NaN` (`isEmpty` in `signals.mjs`). An empty array passes, so `required(path.approvers)` on a multiselect never fails; a test showed the multiselect valid with nothing chosen, while its docs page said "`required` means at least one".
- Signal Forms' `minLength` works on arrays (`length`), and exposes its limit as the public `MIN_LENGTH` metadata; `field.state().metadata(MIN_LENGTH)` reads it.
- Reactive Forms' `Validators.required` fails on an empty array.
- The kit shows a required control with the field's asterisk and `aria-required` (ADR 0039, 0040), from the control state's `required`.

## Decision

1. For a control whose value is a list (the multiselect, the file upload), "at least one" is written `minLength(path, 1)` in Signal Forms, and `Validators.required` in Reactive Forms.
2. `injectControlState()` reports `required` for a Signal Forms field whose value is an array and whose `MIN_LENGTH` is at least 1, so that list gets the asterisk and `aria-required` too.
3. The docs pages of those controls say so; their stories and specs use the recipe.

## Alternatives considered

- **A list value of `null` when empty,** so that `required` works (as the date range does, ADR 0048): the multiselect's value is already `V[]`, and an application would handle two empty values.
- **The kit's own `required` for lists:** a second rule with Angular's name and different behaviour.

## Consequences

- `required(path)` alone on a list still shows the asterisk and never fails; the docs pages warn about it.
- A future Signal Forms change to `isEmpty` would make `required` enough; the multiselect spec would show it.
