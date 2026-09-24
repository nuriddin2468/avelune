import { Component, model } from '@angular/core';
import { connectToField, injectControlState } from '@avelune/ui/forms';

/**
 * The kit's checkbox (brief §9.1, ADR 0041), on a native `<input type="checkbox">`, inside its label
 * (`label[aveChoice]`). Signal Forms (`[formField]` on a boolean) and Reactive Forms (`formControl`) bind it through
 * their native checkbox accessors; the kit shows its state. `indeterminate` shows a mixed state, for a checkbox that
 * stands for a group whose items are partly checked; a click clears it, as it does natively.
 *
 * ```html
 * <label aveChoice><input type="checkbox" aveCheckbox [formField]="settings.notify" /> Notify the counterparty</label>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'input[type=checkbox][aveCheckbox]',
  host: {
    '[indeterminate]': 'indeterminate()',
    '(change)': 'cleared()',
  },
  // A native input has no content.
  template: '',
  styleUrl: './checkbox.css',
})
export class AveCheckbox {
  /**
   * Shows the mixed state: some of the items the checkbox stands for are checked. A click clears it, and the
   * checkbox then shows its checked value.
   */
  readonly indeterminate = model(false);

  constructor() {
    connectToField(injectControlState());
  }

  /** A click toggles the value and clears the mixed state natively; the model follows. */
  protected cleared(): void {
    this.indeterminate.set(false);
  }
}
