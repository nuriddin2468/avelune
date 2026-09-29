# 0057. A multiselect that searches: an input as its trigger over the same multi-select listbox

- Status: Accepted (2026-09-25, technical decision within Wave 2); decision 2 superseded by 0081 (the chosen values as tags, the input holds only the search)
- Date: 2026-09-25
- Related: 0046, 0052, 0055, 0056; brief §9.1; ROADMAP.md "Wave 2 additions", item 6

## Context

Facts, verified on 2026-09-25 in Angular Aria 22.2.0:

- The multiselect (ADR 0046) opens its list from a button; a list of fifty approvers or a hundred regions is scrolled, not searched.
- Aria's combobox takes an `<input>` as well as a button over the same listbox, `multi` included; on an input, Space types and is not passed to the list, Enter is.
- The combobox's input shows the chosen label and filters by what is typed (ADR 0046), or asks a server (ADR 0056).
- Chips for the chosen options wait for Tag (Wave 5); the product owner left them out of this version.

## Decision

1. **`search` on the multiselect:** `none`, the default, keeps the button; `local` makes the trigger an input that filters the options by label as the combobox does (one Uzbek apostrophe for all); `server` asks a server with the combobox's inputs and outputs (`query`, `loading`, `error`, `hasMore`, `loadMore`, ADR 0056).
2. **What the input says:** the chosen labels, comma-separated, as the button did, until the person types; then the search. The list shows every option while the text is the chosen labels, the matches while it is a search. Checking an option keeps the search and the list open; closing the list or leaving puts the chosen labels back. Focus selects the text, so typing starts a search.
3. **Keyboard:** Down opens the list; the arrow keys move; Enter checks or unchecks (Space types); Escape closes; Tab leaves. Deleting the text only clears the search: the list unchecks options, and the clear button all of them (ADR 0052's Delete on a trigger is the button's).
4. **Look:** the combobox's input box, without a chevron; the clear button inside its end (ADR 0052); the rows of ADR 0055.

## Alternatives considered

- **A search field inside the popup:** focus would leave the trigger for the popup, a second input in one control, and a dialog's behaviour in a listbox.
- **Chips in the input:** not taken in this version (Tag, Wave 5).
- **An emptied input unchecking everything, as it clears a combobox:** a search deleted by habit would take a dozen choices with it.

## Consequences

- The multiselect's template holds a button or an input for its trigger; the popup finds the trigger by its directive.
- The harness types into a searchable multiselect and reads its input.
