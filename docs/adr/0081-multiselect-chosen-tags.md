# 0081. The multiselect's chosen values as tags inside its field

- Status: Accepted (2026-09-29; the tags asked for by the product owner, the rest a technical decision within Wave 5); supersedes decision 2 of ADR 0057
- Date: 2026-09-29
- Related: 0046, 0052, 0056, 0057, 0080; brief §8.2, §9.1

## Context

The product owner asked for the multiselect's chosen values as tags with a remove button, in this wave (2026-09-29); ADR 0057 had left them for Tag. Facts, verified on 2026-09-29 (Angular 22.2.0, Aria 22.2.0, Chromium 153):

- The trigger is a `<button>` or, with `search`, an `<input>` carrying Aria's combobox (ADR 0046, 0057). A button cannot hold buttons, and an input holds text only; the trigger is the field's box, its focus ring, its states and what the same-size invariant measures.
- A select-only combobox's value is its text content. A searchable one's value is the search.
- The clear button (ADR 0052) is not a Tab stop: the keyboard changes a field through its list and its keys, not through buttons inside it.
- Stylelint allows the focus ring's properties in `focus.css` only; a box drawn around an input could not ring itself.

## Decision

1. **Every multiselect** shows each chosen option as an `sm` Tag (ADR 0080) inside its field, in the order of the chosen values, in rows 4px apart that wrap; the field grows by a row of 24px tags. The host carries `data-chips` while it does.
2. **The trigger stays the field:** while there are tags it covers the field (positioned over it), keeping its box, ring, states and the combobox; the tags lie over it, where a press on a tag's words reaches the trigger. The chevron and the clear button stay at the first row's end, and the tags stop before them.
3. **The button's text** is the chosen labels, hidden from sight while tags show them, so the combobox's value stays; the placeholder shows while nothing is chosen.
4. **The search** (supersedes ADR 0057, decision 2): the input holds only what people type, after the last tag on its row, or on a row of its own when that has under 96px; the placeholder shows while nothing is chosen. The input is described by "Выбрано: …" (the new `chosenValues` message). Closing the list or leaving empties the search.
5. **A tag's remove button** unchecks its option: not a Tab stop, a press leaves focus in the field and puts it on the trigger, and it is not drawn while the multiselect is disabled or readonly. Tag provides `AVE_TAG_FIELD` for a field that draws tags this way. The keyboard unchecks in the list, as before.
6. **Disabled and readonly:** the tags lose their buttons; disabled tags take `fg.disabled` on the disabled fill.
7. **Invariants:** a multiselect with tags grows with its rows, as a textarea does, and its height is not compared (`data-chips`, ADR 0043's rule).
8. **Harness:** `getChips()` and `removeChip(label)`.

## Alternatives considered

- **The tags under the field:** a second place to look for one value; the product owner saw them inside.
- **A box around the tags and the input:** the ring would have to leave `focus.css` for the box, and the invariant would measure a new element.
- **Tag remove buttons as Tab stops:** ten tags make ten stops inside one field.
- **Backspace in an empty search removes the last tag:** ADR 0057 kept deleting a search from taking choices away.
- **At most N tags and "ещё 5":** the product owner saw the field grow; a cap waits for a need.

## Consequences

- The search's position after the last tag is measured from the tags' layout (a `ResizeObserver`), as the tabs' indicator is (ADR 0071).
- The showcase's delivery regions show their tags; the same-size invariant skips a multiselect's height while it shows tags.
