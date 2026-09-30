import { Component, inject, input } from '@angular/core';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AVE_FIELD } from './field';

/** Unique ids for the names of clear buttons. */
let nextClear = 0;

/**
 * The button that takes a selection field's value away (ADR 0052): a square with Lucide's `x`, which the field shows
 * at its inline end while it has a value, can be changed and is not required. It is not a Tab stop, since the
 * keyboard clears by deleting, and a press leaves focus where it is, so the field can put it back on its own control.
 * Screen readers hear "Clear" in the locale and the field's label: the `<ave-form-field>`'s, or the control's own
 * `label` without one. The field sizes and places it, and gives it the icon, as a button's content.
 *
 * ```html
 * <button aveClearButton type="button" class="clear" [label]="label()" (click)="clear()">
 *   <ave-icon name="x" decorative />
 * </button>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'button[aveClearButton]',
  host: {
    tabindex: '-1',
    'data-focus-ring': 'inset',
    '[attr.aria-labelledby]': 'labelledBy()',
    '(mousedown)': 'keepFocus($event)',
  },
  template: `
    <span hidden [id]="nameId">{{ messages.clear }}</span>
    @if (ownLabel()) {
      <span hidden [id]="labelId">{{ label() }}</span>
    }
    <ng-content />
  `,
  styleUrl: './clear-button.css',
})
export class AveClearButton {
  /** The field's name when no `<ave-form-field>` gives it one: the control's own `label` input. */
  readonly label = input('');

  protected readonly messages = injectAveMessages();
  protected readonly nameId = `ave-clear-${String(nextClear)}`;
  protected readonly labelId = `ave-clear-${String(nextClear++)}-label`;

  private readonly field = inject(AVE_FIELD, { optional: true });

  /** Whether the button names the field with its own copy of the `label` input. */
  protected ownLabel(): boolean {
    return this.field?.labelId === undefined && this.label() !== '';
  }

  /** "Clear", then the field's label. */
  protected labelledBy(): string {
    const label = this.field?.labelId ?? (this.ownLabel() ? this.labelId : undefined);
    return label === undefined ? this.nameId : `${this.nameId} ${label}`;
  }

  /** A press does not take focus: the field keeps it, or gets it back when the value is gone. */
  protected keepFocus(event: Event): void {
    event.preventDefault();
  }
}
