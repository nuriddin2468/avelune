import { Component } from '@angular/core';
import { connectToField, injectControlState } from '@avelune/ui/forms';

/**
 * The kit's radio button (brief §9.1, ADR 0044), on a native `<input type="radio">`, inside its label
 * (`label[aveChoice]` from `@avelune/ui/checkbox`). Radios of one `name` are one choice: Signal Forms (`[formField]`
 * with a `value` on each) and Reactive Forms (`formControlName` on each) bind them through their native radio
 * accessors, and the arrow keys move the choice natively. Put the radios of one question in a
 * `fieldset[aveChoiceGroup]` for its legend, hint and error.
 *
 * ```html
 * <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'input[type=radio][aveRadio]',
  // A native input has no content.
  template: '',
  styleUrl: './radio.css',
})
export class AveRadio {
  constructor() {
    connectToField(injectControlState());
  }
}
