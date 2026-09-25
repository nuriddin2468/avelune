import { InjectionToken, type Signal } from '@angular/core';
import type { AveControlState } from './control-state';

/**
 * What a form field (`<ave-form-field>`) offers the control inside it (ADR 0039): the control registers its id and
 * its state, and describes itself with the field's hint and error.
 *
 * @beta
 */
export interface AveFieldContext {
  /** The id to give the control when it has none, so the field's label can name it. */
  readonly defaultId: string;
  /** The ids of the field's hint and, while it shows, its error: the control's `aria-describedby`. */
  readonly describedBy: Signal<readonly string[]>;
  /** Called once by the control, with its id and its state. */
  register(id: string, state: AveControlState): void;
}

/**
 * Provided by a form field for the control inside it.
 *
 * @beta
 */
export const AVE_FIELD = new InjectionToken<AveFieldContext>('AVE_FIELD');
