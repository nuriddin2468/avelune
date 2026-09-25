import { Directive, InjectionToken, inject } from '@angular/core';
import type { AveControlState } from './control-state';
import { connectToField } from './connect';

/**
 * What a component shares with the element people focus inside its template: its form state, read on its host,
 * where the form binding is.
 *
 * @alpha
 */
export interface AveControlOwner {
  /** The form state of the component, read on its host, where the form binding is. */
  readonly state: AveControlState;
}

/**
 * Provided by a component whose focusable element is inside its template (a select's trigger, a date field's input),
 * for `aveControlTarget` on that element.
 *
 * @alpha
 */
export const AVE_CONTROL_OWNER = new InjectionToken<AveControlOwner>('AVE_CONTROL_OWNER');

/**
 * Connects the element people focus inside a component (a select's trigger, a date field's input) to the form field
 * around the component, with the component's state (ADR 0046): the element takes the field's id, is described by its
 * hint and error, and says invalid and required. The component provides `AVE_CONTROL_OWNER`.
 *
 * @alpha
 */
@Directive({ selector: '[aveControlTarget]' })
export class AveControlTarget {
  constructor() {
    connectToField(inject(AVE_CONTROL_OWNER).state);
  }
}
