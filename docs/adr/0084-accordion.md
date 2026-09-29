# 0084. Accordion: Angular Aria's accordion, items declared with their content, a panel that opens on `timing.expand`

- Status: Accepted (2026-09-29; the chevron's place proposed by the agent to the product owner, who did not object; the rest a technical decision within Wave 5)
- Date: 2026-09-29
- Related: 0005, 0031, 0045, 0071; brief §6.3, §6.4, §6.5, §9.1, §9.4; WAI-ARIA APG "Accordion"

## Context

Brief §9.4 lists Accordion in Wave 5 and §9.1 puts its behaviour in Angular Aria. Facts, verified on 2026-09-29 (Angular Aria 22.2.0, Chromium 153):

- Aria's `ngAccordionGroup` holds `ngAccordionTrigger`s and the `ngAccordionPanel`s they control (`panel`, a template reference): the trigger is a button with `aria-expanded` and `aria-controls`, the panel a `region` that is `inert` while closed; Up, Down, Home and End move between triggers, Enter and Space toggle; `multiExpandable` lets several stay open. Content in `ng-template ngAccordionContent` enters the page when its panel first opens and, with `preserveContent`, stays. The APG puts each trigger inside a heading of the page's level.
- Brief §6.3 opens an accordion from height 0 to its own on `duration.normal` and `easing.standard`; §6.4 allows that height animation for the accordion alone, by `grid-template-rows: 0fr → 1fr`; `interpolate-size` arrives in Chrome 129 and not yet in Firefox or Safari (browser-compat-data 8.1.2), so it would only repeat what the rows do. §6.5: under reduced motion nothing grows. ADR 0045 gave a state change that must stop under reduced motion a timing of its own, `timing.slide`, rather than a duration, which reduced motion keeps.
- A state set as the page opens should not animate (ADR 0045, 0071).
- `visibility` transitions discretely: with `transition-behavior: allow-discrete` a closing panel stays visible until its height reaches none.

## Decision

1. **`@avelune/ui/accordion`** (layer composites): `AveAccordion` (`<ave-accordion>`), which carries `ngAccordionGroup`, with `multiple` (Aria's `multiExpandable` under the kit's name, true by default: `false` lets one item be open at a time; a host directive's input takes no value computed by the kit, so there is no `expand` union) and `level` (the heading level of its items, 2 to 6, 3 by default); and `AveAccordionItem` (`<ave-accordion-item>`), one heading and its panel: `heading` (required), `expanded` (a model), `disabled`; its content is the panel's.
2. **Behaviour:** Aria's, as above; a disabled item keeps focus and says it is unavailable (`softDisabled`).
3. **Look:** items one under another between `border.subtle` lines; the trigger as wide as the item, `control.height.lg` tall at least, 8px inline padding, `radius.md`, the heading in `font.heading-sm` and a 16px `chevron-down` in `fg.muted` at the inline end (the agent's proposal), turned over while open; the hover fill; a disabled trigger in `fg.disabled`. The panel's content under it, 8px from its sides and 16px from the line below. Forced colours keep the lines and the ring.
4. **Motion:** the panel's rows go from `0fr` to `1fr` and back on the new token **`timing.expand`** (200ms, the value of `duration.normal`; 0ms under reduced motion) and `easing.standard`, the chevron turns on the same, and the panel stays visible until it has closed. Only after the person has used the item: an item open as the page opens is simply open.
5. **Harness:** `AveAccordionHarness` (`@avelune/ui/accordion/testing`): the headings, which are open and which disabled, toggling one, the text of an open panel.

## Alternatives considered

- **`<details>` and `<summary>`:** native, but no arrows between items, and no single-open mode at the floor: `name` groups need Chrome 120 and Firefox 130 (browser-compat-data 8.1.2); Aria has both.
- **Aria's directives on the application's elements:** every page would repeat the heading, the button and the panel.
- **`duration.normal` for the height:** it stays 200ms under reduced motion, against brief §6.5.
- **Animating `height` from a measured value:** a measure per toggle, where the grid rows need none.
- **The chevron at the start:** the tree puts its chevrons there, and the two would read alike.

## Consequences

- One more token in `timing`; the List's rows open and close on it too.
- Every panel's content is created with the accordion; a panel that loads data does it when `expanded` says so.
