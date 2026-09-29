# 0077. Stepper: where a person is in a sequence of steps, drawn from data, the done steps optionally a way back

- Status: Accepted (2026-09-29, technical decision within Wave 4)
- Date: 2026-09-29
- Related: 0033, 0047, 0071, 0074; brief §9.4

## Context

Brief §9.4 lists Stepper in Wave 4. Facts, verified on 2026-09-29:

- The APG has no stepper pattern. Common practice (GOV.UK's step-by-step, USWDS's step indicator) is an ordered list of the steps, `aria-current="step"` on the current one, and the state of each step in words, not only in colour or a mark.
- A work system shows two kinds: the steps of a form that a person fills in turn (a wizard), and the stages a document passes through (an approval route), which nobody clicks.
- Angular Aria has no stepper; the steps' content is the application's page, so the kit's part is the indicator.
- A step that is done can be a way back in a wizard; one that is ahead cannot be reached before the steps before it.

## Decision

1. **`@avelune/ui/stepper`** (layer composites), `AveStepper` (`<ave-stepper>`): `label` (required, names the list), `steps` (required), `AveStep`s (`label`, `description?`, `error?`), `current` (the index of the current step, from 0), `orientation` (`horizontal` by default, or `vertical`), `selectable`, and the output `stepSelected: number`.
2. **States from `current`:** the steps before it are done, the one at it is current (`aria-current="step"`), those after it are ahead. `error` marks a step that needs attention, done or current. With `selectable`, the done steps are buttons that emit their index; the current step and those ahead are text.
3. **Marks and words:** a 24px circle (`size.icon.lg`): a done step on `accent.bg` with Lucide's `check` in `fg.on-accent`, named "Выполнен" in the locale (`stepComplete`); the current step with a 2px `accent.border` ring and its number in `accent.fg`; a step ahead with a `border.strong` ring and its number in `fg.muted`; a step with an error on `danger.bg` with `x`, named "Требует внимания" (`stepError`). Labels in `font.label-md`, muted ahead; descriptions in `font.caption`, muted, or `danger.fg` with an error. A done step's button underlines its label under the pointer.
4. **Layout:** horizontal, the steps share the width, each mark followed by a line to the next step, the words under the mark; vertical, the words beside the mark and the line under it to the next. The line after a done step is `accent.bg`, the others `border.default`. A horizontal stepper in a container under `container.sm` lays out vertically (a container query).
5. **Harness:** `AveStepperHarness` (`@avelune/ui/stepper/testing`): the list's name, the steps' words and states, the current step, going back to a done step.

## Alternatives considered

- **A wizard container with the steps' panels and Back and Next buttons:** it would copy the application's form and its validation; the page shows the step it is on, and the stepper says where that is.
- **Tabs for steps:** tabs let people choose any section in any order; steps have an order.
- **Every step a button:** a step ahead cannot be done before the ones before it.
- **The state in colour and marks alone:** WCAG 1.4.1; the marks carry the words.

## Consequences

- The showcase's contract page shows its approval route as a vertical stepper.
- The kit has no toggle between orientations by width other than the container query; an application that wants vertical steps in a wide column says so.
