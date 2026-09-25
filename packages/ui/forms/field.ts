import { InjectionToken, type Signal } from '@angular/core';
import type { AveControlState } from './control-state';

/**
 * What a form field (`<ave-form-field>`) offers the control inside it (ADR 0039): the control registers its id and
 * its state, and describes itself with the field's hint and error.
 *
 * @beta
 */
export interface AveFieldContext {
  /**
   * The id to give the control when it has none, so the field's label can name it; `null` for a group of controls
   * (`fieldset[aveChoiceGroup]`), whose legend names the group and whose controls keep their own ids.
   */
  readonly defaultId: string | null;
  /**
   * The id of the field's label or legend, for a control that names its parts with it (a date range: the label and
   * "Start date"); a control with one element is named by `<label for>` instead.
   */
  readonly labelId?: string;
  /** The ids of the field's hint and, while it shows, its error: the control's `aria-describedby`. */
  readonly describedBy: Signal<readonly string[]>;
  /** Called once by each control, with its element (whose id may be empty in a group) and its state. */
  register(control: HTMLElement, state: AveControlState): void;
  /**
   * Shows a control's value, as it writes it, at the end of the field's label row (a slider's "15 %", ADR 0051);
   * returns the function that takes it away. Screen readers hear the value from the control, so the field hides its
   * copy from them. A group of controls (`fieldset[aveChoiceGroup]`) shows none.
   */
  showValue?(text: Signal<string>): () => void;
}

/**
 * Provided by a form field for the control inside it.
 *
 * @beta
 */
export const AVE_FIELD = new InjectionToken<AveFieldContext>('AVE_FIELD');
