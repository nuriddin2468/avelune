import { Component, input, numberAttribute } from '@angular/core';
import { connectToField, injectControlState } from '@avelune/ui/forms';
import type { AveTextareaSize } from './types';

/** The rows a textarea shows when the template says nothing, or something that is not a whole number of at least 1. */
const defaultRows = 3;

/** `rows` as the template writes it: a whole number of at least 1; a fraction is dropped, anything else is 3. */
function rowsAttribute(value: unknown): number {
  const rows = Math.trunc(numberAttribute(value, defaultRows));
  return rows >= 1 ? rows : defaultRows;
}

/**
 * The kit's text field of several lines (brief §9.1, ADR 0043), on a native `<textarea>`. Bind it with Signal Forms
 * (`[formField]`) or Reactive Forms (`formControl`, `formControlName`): the native value accessor does the binding,
 * and the kit shows the control's state (invalid once touched, disabled, readonly). Put it in an `<ave-form-field>`
 * for its label, hint and error. It has the box of an Input of its size, shows `rows` lines, and people can drag it
 * taller.
 *
 * ```html
 * <textarea aveTextarea [formField]="contract.subject"></textarea>
 * <textarea aveTextarea formControlName="comment" rows="5" size="sm"></textarea>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'textarea[aveTextarea]',
  host: {
    '[attr.data-size]': 'size()',
    '[rows]': 'rows()',
  },
  // A native textarea holds its value, not content.
  template: '',
  styleUrl: './textarea.css',
})
export class AveTextarea {
  /**
   * The size: the inline padding of an Input of that size, and one line as tall as it (`sm` 32px, `md` 36px, the
   * default, `lg` 40px; one step smaller in compact density).
   */
  readonly size = input<AveTextareaSize>('md');

  /** The lines it shows before its text scrolls: 3 by default. People can drag it taller. */
  readonly rows = input(defaultRows, { transform: rowsAttribute });

  constructor() {
    connectToField(injectControlState());
  }
}
