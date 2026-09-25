# 0046. Select, Combobox and Multiselect: Angular Aria in a CDK overlay, options as data, both form APIs

- Status: Accepted (2026-09-25, technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0002, 0031, 0039, 0040, 0044, 0047; brief §6.3, §8.2, §9.1; GUIDELINES.md "Radio, select or combobox"

## Context

Wave 2 needs a select (6–15 options), a combobox with search (more than 15, or unknown), and a multiselect. Brief §9.1 puts their behaviour in Angular Aria. Facts, verified on 2026-09-25 (Angular 22.2.0, Aria and CDK 22.2.0, Chromium 153):

- Aria's `ngCombobox` on a trigger (a `<button>` for a select, an `<input>` for a combobox), an `ng-template ngComboboxPopup` and an `ngListbox` with `ngOption`s give the WAI-ARIA combobox patterns: roles, `aria-activedescendant`, arrow keys, Home, End, Enter, Escape, typeahead. The official Select example opens the popup in CDK's `cdkConnectedOverlay` with `usePopover: 'inline'` and `matchWidth`.
- `ngOption` injects its listbox, so options cannot be projected from the application's template into a list the component renders; they must be rendered by the component.
- `ngCombobox` is soft-disabled by default (focusable when disabled); `ngComboboxPopup` is deferred content that is removed the moment the combobox collapses unless the combobox preserves it; and a popup inside the overlay's template registers only when the overlay first opens, so a closed combobox had no `aria-haspopup` and `aria-autocomplete="none"`.
- An element with `animate.enter` or `animate.leave` inside a CDK connected overlay throws NG0205 when the application is destroyed with the overlay open: the animation queue is read from the destroyed environment injector. A plain element does not (reproduced 2026-09-25).
- Signal Forms binds a value accessor before a custom control; a component that provides `NG_VALUE_ACCESSOR` and injects `FORM_FIELD` or `NgControl` itself makes a dependency cycle.
- A `<label for>` names a `<button>` or an `<input>`, not a `div`.
- Storybook instantiates a meta's `component` outside an injection context, where `model()` throws (NG0203).

## Decision

1. **`@avelune/ui/select`** (layer composites) holds `AveSelect<V>` (`<ave-select>`), `AveCombobox<V>` (`<ave-combobox>`) and `AveMultiselect<V>` (`<ave-multiselect>`), with the `AveOption<V>` type (`value`, `label`, `disabled`) and `AveSelectSize`. Options are data: an `options` input.
2. **Markup:** the trigger is a `<button>` (select, multiselect) or an `<input>` (combobox) with `ngCombobox`, soft-disabled off and `preserveContent` on. `ngComboboxPopup` wraps the overlay, not the reverse, so the popup registers at once. The list is an `ngListbox` in `activedescendant` focus mode with explicit selection; the select closes on a choice, the multiselect stays open.
3. **Overlay:** CDK's connected overlay in the top layer (`usePopover: 'inline'`), as wide as the trigger, under it or above it, `transform-origin` at the trigger; the gap is the popup's `space.1` margin.
4. **Motion:** the popup takes the catalog's classes itself: `ave-motion-popover-enter` when it is created, `ave-motion-popover-exit` while it closes; the overlay stays open until the exit's animations finish (`listPresence`), and closes at once when there is none. No `animate.enter` or `animate.leave` in an overlay.
5. **Forms:** the value is a `model()` (`V | null`, or `V[]` for the multiselect) with a `touch` output, so Signal Forms binds it as a custom control; for Reactive Forms the component sets itself as `NgControl.valueAccessor` when no Signal Forms field is present. No `NG_VALUE_ACCESSOR` provider. The state comes from `injectControlState()` on the host; an internal `aveControlTarget` directive on the trigger calls `connectToField()` with it, so the trigger takes the field's id (the label's `for`), description, `aria-invalid` and `aria-required`. A `label` input names a control without a visible label.
6. **Look:** the trigger has Input's box for its size, a `chevron-down` at the inline end, the value truncated on one line, the placeholder in `fg.subtle`, and Input's invalid, readonly and disabled states. The popup is `bg.surface-raised` with `elevation.popover` and `radius.lg`, 4px padding around options of `radius.md` (concentric) and the control's height; the list scrolls after eight options. The active option takes `bg.hover`, the chosen ones a `check` in `accent.fg`; in forced colours the active option takes `Highlight`.
7. **Combobox search:** an option matches when its label contains what was typed, ignoring case and treating every apostrophe people type for ʻ and ʼ as one ("o'zbek" finds "Oʻzbekiston"). Text that matches no option is put back when the person leaves; an emptied input clears the value. An empty list says the kit's `noResults` message (ADR 0047).
8. **Harnesses:** `AveSelectHarness`, `AveMultiselectHarness` (extends it) and `AveComboboxHarness` in `@avelune/ui/select/testing`; they find options from the document root through `aria-controls`.
9. Stories do not name these components as the meta's `component`.

## Alternatives considered

- **Options as projected `<ave-option>` children:** `ngOption` would be created in the application's view, without its listbox.
- **A native `<select>`:** its popup cannot be styled at the browser floor (`appearance: base-select` arrives after Chrome 119).
- **`animate.enter` / `animate.leave` in the overlay:** the NG0205 above; the teardown of every Storybook story with an open list failed.
- **One value accessor for both form APIs through `NG_VALUE_ACCESSOR`:** the dependency cycle above.

## Consequences

- The same-size invariant compares the three triggers with the other controls of their size.
- Menu, Popover and Dialog (Wave 3) meet the same NG0205 in a CDK overlay; `listPresence` is the pattern to generalise then.
- Rich option content (icons, two lines) and grouped options are not in this version.
