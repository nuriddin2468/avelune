import { Component, ElementRef, inject, input } from '@angular/core';
import { connectToField, injectControlState } from '@avelune/ui/forms';
import type { AveInputSize } from './types';

/** The types an input of text accepts; the other types have their own components. */
const textTypes = new Set(['text', 'email', 'tel', 'url', 'password', 'search', 'number']);

/**
 * The kit's text input (brief §9.1, ADR 0039), on a native `<input>`. Bind it with Signal Forms (`[formField]`) or
 * Reactive Forms (`formControl`, `formControlName`): the native value accessor does the binding, and the kit shows
 * the control's state (invalid once touched, disabled, readonly). Put it in an `<ave-form-field>` for its label,
 * hint and error. In development a type that is not text throws.
 *
 * ```html
 * <input aveInput type="text" [formField]="form.number" />
 * <input aveInput type="email" formControlName="email" size="sm" />
 * ```
 *
 * @beta
 */
@Component({
  selector: 'input[aveInput]',
  host: {
    '[attr.data-size]': 'size()',
  },
  // A native input has no content.
  template: '',
  styleUrl: './input.css',
})
export class AveInput {
  /** The size: `sm` 32px, `md` 36px (default), `lg` 40px; one step smaller in compact density. */
  readonly size = input<AveInputSize>('md');

  constructor() {
    const element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && !textTypes.has(element.type)) {
      throw new Error(
        `<input aveInput type="${element.type}">: aveInput is for text. Use aveCheckbox for a checkbox; ` +
          `other types get their own components.`,
      );
    }
    connectToField(injectControlState());
  }
}
