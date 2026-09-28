# 0056. Remote lists: a server's search, pages that load at the end, and chosen options the list no longer holds

- Status: Accepted (2026-09-25, technical decision within Wave 2)
- Date: 2026-09-25
- Related: 0005, 0037, 0046 (its "the value is always one of the options" is superseded here), 0047, 0050, 0055; brief §6.2, §6.3, §9.1; ROADMAP.md "Wave 2 additions", item 5

## Context

Facts, verified on 2026-09-25 in Angular 22.2.0, Angular Aria 22.2.0, CDK 22.2.0 and Chromium 153:

- A work system's counterparties, employees or contracts number in the thousands and live on its server: the application sends what people type, and gets a page of matches back.
- ADR 0046 has the combobox filter its `options` by label, and its value always among them. A server's answer is a page: the chosen option is often not in it, and the server may match on more than the label (a tax number).
- Aria's combobox with a listbox names the active option with `aria-activedescendant`, which must point at an element in the document. A virtual scroll removes the options out of view, so the active option would be missing from the page. Aria's listbox cuts its selection to its options whenever they change (ADR 0055) and gives `wrap` (Down on the last option goes to the first) and `gotoIndex`.
- A search sent at every key is a request per letter; the timings of the motion catalog are tokens, frozen but for an ADR (brief §6.2, ADR 0005, 0045). A spinner shows only after `timing.spinner-delay` and stays `timing.spinner-min-visible` (ADR 0037), which Button's own helper does.
- CDK's `LiveAnnouncer` needs its visually hidden styles loaded (ADR 0050).

## Decision

1. **Server search** on the combobox: `search="server"` shows `options` as the server gave them, unfiltered, and emits `query` with the text once it has been quiet for the new token **`timing.search-delay`** (300ms; unchanged under reduced motion, which is not motion) and at once when the list opens on text not asked for yet (the first open asks with `''`). `search="local"`, the default, is ADR 0046's filter.
2. **States**, as inputs: `loading`, `error` and `hasMore`. While loading, the list shows "Loading…" with a spinner at its end, on the spinner's timings; an error shows "The list did not load" and a Try again button, which, as Enter in the input does, sends the last request again; no options and no request in flight say `noResults`. Messages in the four locales (ADR 0047).
3. **Pages:** `loadMore` is emitted when the list is scrolled to within an option of its end, when Down is pressed on the last option, and when the options do not fill the list, while `hasMore` and neither loading nor failed. Down on the last option does not wrap while there is more; the new options take the keyboard's place from the first of them.
4. **Chosen options outside the list** (superseding ADR 0046's rule): the value is one or more of the options the person chose, which the list may no longer hold. `chosenOptions` gives the options of a value set from outside (a form's saved value), and each component remembers the options people choose; the input or trigger names them from there. A change that only drops values no option holds is Aria's pruning, not a choice (ADR 0055).
5. **Announcements:** `LiveAnnouncer` says how many options the list holds once it loads ("Options: 20"), that none matched, or that it failed and how to try again; the kit loads CDK's hidden styles itself (ADR 0050).
6. **No virtual scrolling:** `aria-activedescendant` needs the options in the page. A list grows a page at a time; an application that pages through thousands narrows the search instead.
7. **The spinner's timing** moves from Button to `@avelune/ui/theme` (`aveDelayedSpinner`, `aveDurationToken`), which Button and the select family share, as the motion catalog's rule (brief §6.3).

## Alternatives considered

- **CDK's virtual scroll:** the active option would be missing from the page; Aria's combobox names it by id.
- **A debounce in the application:** every application would write its own, with its own delay.
- **A literal delay in code:** a timing outside the token set, which ADR 0005 forbids.
- **Retry as a focusable button only:** focus in the popup outside its listbox closes Aria's combobox; Enter keeps the keyboard in the input.
- **Keeping ADR 0046's rule:** a server's page cannot hold every chosen option.

## Consequences

- `timing` holds one more token; `tokens-check` covers it.
- A server's result that omits the chosen option leaves it chosen, named from `chosenOptions` or from the person's choice.
- The searchable multiselect (item 6 of the Wave 2 additions) takes the same inputs and outputs.
