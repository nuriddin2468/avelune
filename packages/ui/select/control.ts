import { Directive, InjectionToken, inject } from '@angular/core';
import { connectToField, type AveControlState } from '@avelune/ui/forms';

/** What a select, a combobox or a multiselect shares with the element people focus inside it. */
export interface AveControlOwner {
  /** The form state of the component, read on its host, where the form binding is. */
  readonly state: AveControlState;
}

/** Provided by each of the three components for the element it focuses. */
export const AVE_CONTROL_OWNER = new InjectionToken<AveControlOwner>('AVE_CONTROL_OWNER');

/**
 * Connects the element people focus inside a select, a combobox or a multiselect (its trigger or its input) to the
 * form field around the component, with the component's state (ADR 0046): that element takes the field's id, is
 * described by its hint and error, and says invalid and required.
 */
@Directive({ selector: '[aveControlTarget]' })
export class AveControlTarget {
  constructor() {
    connectToField(inject(AVE_CONTROL_OWNER).state);
  }
}
