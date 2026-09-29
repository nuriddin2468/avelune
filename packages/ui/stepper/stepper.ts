import { Component, booleanAttribute, input, numberAttribute, output } from '@angular/core';
import { lucideCheck, lucideX } from '@avelune/icons/lucide';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import type { AveStep, AveStepperOrientation } from './types';

/**
 * The kit's stepper (brief §9.4, ADR 0077): where a person, or a document, is in a sequence of steps. The steps before
 * `current` are done, the one at it is current (`aria-current="step"`), the rest are ahead; each state is in words
 * too. With `selectable` a done step is a button back to it. The page shows the step's content itself.
 *
 * ```html
 * <ave-stepper label="Оформление договора" [steps]="steps" [current]="1" selectable (stepSelected)="go($event)" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-stepper',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideCheck, lucideX])],
  host: { '[attr.data-orientation]': 'orientation()' },
  template: `
    <ol class="steps" [attr.aria-label]="label()">
      @for (step of steps(); track $index) {
        <li
          class="step"
          [attr.data-state]="stateOf($index)"
          [attr.data-error]="step.error ? '' : null"
          [attr.aria-current]="$index === current() ? 'step' : null"
        >
          @if (selectable() && stateOf($index) === 'done') {
            <button type="button" class="target" (click)="stepSelected.emit($index)">
              <span class="mark">
                @if (step.error) {
                  <ave-icon name="x" [label]="messages.stepError" />
                } @else {
                  <ave-icon name="check" [label]="messages.stepComplete" />
                }
              </span>
              <span class="text">
                <span class="label">{{ step.label }}</span>
                @if (step.description; as description) {
                  <span class="description">{{ description }}</span>
                }
              </span>
            </button>
          } @else {
            <div class="target">
              <span class="mark">
                @if (step.error) {
                  <ave-icon name="x" [label]="messages.stepError" />
                } @else if (stateOf($index) === 'done') {
                  <ave-icon name="check" [label]="messages.stepComplete" />
                } @else {
                  {{ $index + 1 }}
                }
              </span>
              <span class="text">
                <span class="label">{{ step.label }}</span>
                @if (step.description; as description) {
                  <span class="description">{{ description }}</span>
                }
              </span>
            </div>
          }
        </li>
      }
    </ol>
  `,
  styleUrl: './stepper.css',
})
export class AveStepper {
  /** Names the list of steps: what they make up ("Оформление договора", "Маршрут согласования"). */
  readonly label = input.required<string>();

  /** The steps, in order. */
  readonly steps = input.required<readonly AveStep[]>();

  /** The index of the current step, from 0: the steps before it are done, those after it ahead. */
  readonly current = input(0, { transform: numberAttribute });

  /** The steps in a row (default) or in a column; a row lays out as a column in a container under 480px. */
  readonly orientation = input<AveStepperOrientation>('horizontal');

  /** Makes each done step a button back to it, which emits `stepSelected`: for the steps of a form. */
  readonly selectable = input(false, { transform: booleanAttribute });

  /** Emits the index of the done step the person chose to go back to. */
  readonly stepSelected = output<number>();

  protected readonly messages = injectAveMessages();

  /** Where a step stands against the current one. */
  protected stateOf(index: number): 'done' | 'current' | 'ahead' {
    const current = this.current();
    if (index < current) return 'done';
    return index === current ? 'current' : 'ahead';
  }
}
