import { DestroyRef, ElementRef, afterNextRender, computed, inject, signal, type Signal } from '@angular/core';
import { NgControl, Validators, type AbstractControl } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';

/**
 * The state of a form control as the kit shows it (ADR 0039): the same signals whether the control is bound with
 * Signal Forms (`[formField]`), Reactive Forms (`formControl`, `formControlName`), or neither.
 *
 * @alpha
 */
export interface AveControlState {
  /** Whether the value fails its validation. */
  readonly invalid: Signal<boolean>;
  /** Whether the person has left the control at least once. */
  readonly touched: Signal<boolean>;
  /** Whether the control needs a value. */
  readonly required: Signal<boolean>;
  /** Whether the control is disabled. */
  readonly disabled: Signal<boolean>;
  /** Whether to show the error: invalid, and touched. A form marks every control touched when it is submitted. */
  readonly showError: Signal<boolean>;
  /** Whether a form binding (Signal Forms or Reactive Forms) drives the state, rather than the element alone. */
  readonly bound: boolean;
}

/**
 * Whether a Reactive Forms control requires a value: `Validators.required`, or `Validators.requiredTrue` for a
 * checkbox that must be checked. Both are static functions that never read `this`, and `hasValidator` needs the
 * references themselves.
 */
function requiredByValidator(control: AbstractControl | null): boolean {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- static validators never read this; hasValidator compares these references.
  const { required, requiredTrue } = Validators;
  return control !== null && (control.hasValidator(required) || control.hasValidator(requiredTrue));
}

/** The element's own attributes, for a control without a form binding; they do not change after creation. */
function nativeState(element: HTMLInputElement): Omit<AveControlState, 'showError' | 'bound'> {
  const off = signal(false).asReadonly();
  return {
    invalid: off,
    touched: off,
    required: signal(element.required).asReadonly(),
    disabled: signal(element.disabled).asReadonly(),
  };
}

/**
 * The state of the form control on the caller's element: Signal Forms' field state, a Reactive Forms control's
 * status, or the element's own attributes. Reactive Forms reports changes through `control.events`, which is read
 * from the first render on; its control does not exist before. Call it in the injection context of a directive or
 * component on the control's element.
 *
 * @alpha
 */
export function injectControlState(): AveControlState {
  const element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  const field = inject(FORM_FIELD, { self: true, optional: true });
  const ngControl = field === null ? inject(NgControl, { self: true, optional: true }) : null;
  let state: Omit<AveControlState, 'showError' | 'bound'>;
  if (field !== null) {
    state = {
      invalid: computed(() => field.state().invalid()),
      touched: computed(() => field.state().touched()),
      required: computed(() => field.state().required()),
      disabled: computed(() => field.state().disabled()),
    };
  } else if (ngControl !== null) {
    const version = signal(0);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const subscription = ngControl.control?.events.subscribe(() => {
        version.update((value) => value + 1);
      });
      destroyRef.onDestroy(() => subscription?.unsubscribe());
      version.update((value) => value + 1);
    });
    const read = (value: () => boolean) =>
      computed(() => {
        version();
        return value();
      });
    state = {
      invalid: read(() => ngControl.invalid === true),
      touched: read(() => ngControl.touched === true),
      required: read(() => requiredByValidator(ngControl.control) || element.required),
      disabled: read(() => ngControl.disabled === true),
    };
  } else {
    state = nativeState(element);
  }
  return {
    ...state,
    showError: computed(() => state.invalid() && state.touched()),
    bound: field !== null || ngControl !== null,
  };
}
