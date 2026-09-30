import { Directive, InjectionToken, inject, type Signal } from '@angular/core';
import type { AveControlState } from './control-state';
import { connectToField } from './connect';

/**
 * What a component shares with the element people focus inside its template: its form state, read on its host,
 * where the form binding is.
 *
 * @beta
 */
export interface AveControlOwner {
  /** The form state of the component, read on its host, where the form binding is. */
  readonly state: AveControlState;
  /**
   * The ids of the component's own descriptions of the element, before the field's hint and error: a file upload's
   * "Required", which ARIA has no attribute for on a button (ADR 0050).
   */
  readonly controlDescriptions?: Signal<readonly string[]>;
  /**
   * Whether the component is disabled, by its own `disabled` input or by a form: the field's label dims with it, as it
   * does for a native control, which the form's state alone would not say.
   */
  readonly controlDisabled: Signal<boolean>;
}

/**
 * Provided by a component whose focusable element is inside its template (a select's trigger, a date field's input),
 * for `aveControlTarget` on that element.
 *
 * @beta
 */
export const AVE_CONTROL_OWNER = new InjectionToken<AveControlOwner>('AVE_CONTROL_OWNER');

/**
 * Connects the element people focus inside a component (a select's trigger, a date field's input) to the form field
 * around the component, with the component's state (ADR 0046): the element takes the field's id, is described by its
 * hint and error, and says invalid and required. The component provides `AVE_CONTROL_OWNER`.
 *
 * @beta
 */
@Directive({ selector: '[aveControlTarget]' })
export class AveControlTarget {
  constructor() {
    const owner = inject(AVE_CONTROL_OWNER);
    connectToField({ ...owner.state, disabled: owner.controlDisabled }, owner.controlDescriptions);
  }
}
