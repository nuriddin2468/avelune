import { Component } from '@angular/core';

/**
 * The label of a checkbox (ADR 0041), and of a radio or a switch later: the control first, then its text, 8px apart,
 * the control on the middle of the first line. A click anywhere on the label toggles the control, and the label
 * names it. It dims with a disabled control.
 *
 * ```html
 * <label aveChoice><input type="checkbox" aveCheckbox /> Notify the counterparty by email</label>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'label[aveChoice]',
  template: '<ng-content />',
  styleUrl: './choice.css',
})
export class AveChoice {}
