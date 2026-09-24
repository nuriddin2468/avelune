import { Directive, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { injectControlState, type AveControlState } from '@avelune/ui/forms';
import { describe, expect, it } from 'vitest';

/** Exposes the control state of its element, as a kit control reads it. */
@Directive({ selector: 'input[aveSpecState]', exportAs: 'aveSpecState' })
class StateProbe {
  readonly state: AveControlState = injectControlState();
}

@Component({
  selector: 'ave-state-signal',
  imports: [StateProbe, FormField],
  template: `<input aveSpecState aria-label="Number" [formField]="contract.number" />`,
})
class SignalHost {
  readonly model = signal({ number: '', locked: false });
  // `context.valueOf`, not a destructured `valueOf`: angular-eslint 22.5's reactive-context-must-read-signal looks call
  // names up in a plain object and crashes on Object.prototype.valueOf.
  readonly contract = form(this.model, (path) => {
    required(path.number);
    disabled(path.number, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-state-reactive',
  imports: [StateProbe, ReactiveFormsModule],
  template: `
    <input aveSpecState aria-label="Required" [formControl]="needed" />
    <input aveSpecState aria-label="Optional" [formControl]="optional" required />
  `,
})
class ReactiveHost {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly needed = new FormControl('', { validators: [Validators.required] });
  readonly optional = new FormControl('');
}

@Component({
  selector: 'ave-state-native',
  imports: [StateProbe],
  template: `
    <input aveSpecState aria-label="Plain" />
    <input aveSpecState aria-label="Native" required disabled />
  `,
})
class NativeHost {}

function states<T>(type: new () => T): { fixture: ComponentFixture<T>; all: () => AveControlState[] } {
  const fixture = TestBed.createComponent(type);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  const all = () =>
    fixture.debugElement
      .queryAll((node) => node.injector.get(StateProbe, null) !== null)
      .map((node) => node.injector.get(StateProbe).state);
  return { fixture, all };
}

const snapshot = (state: AveControlState | undefined) => ({
  invalid: state?.invalid(),
  touched: state?.touched(),
  required: state?.required(),
  disabled: state?.disabled(),
  showError: state?.showError(),
  bound: state?.bound,
});

describe('injectControlState', () => {
  it("reads a Signal Forms field's state", () => {
    const { fixture, all } = states(SignalHost);
    const [state] = all();
    expect(snapshot(state)).toEqual({
      invalid: true,
      touched: false,
      required: true,
      disabled: false,
      showError: false,
      bound: true,
    });
    fixture.componentInstance.contract.number().markAsTouched();
    expect(snapshot(state)).toMatchObject({ touched: true, showError: true });
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(snapshot(state)).toMatchObject({ disabled: true });
  });

  it("reads a Reactive Forms control's state, required from its validator or its attribute", async () => {
    const { fixture, all } = states(ReactiveHost);
    await fixture.whenStable();
    const [needed, optional] = all();
    expect(snapshot(needed)).toEqual({
      invalid: true,
      touched: false,
      required: true,
      disabled: false,
      showError: false,
      bound: true,
    });
    expect(snapshot(optional)).toMatchObject({ required: true, invalid: true });
    fixture.componentInstance.needed.markAsTouched();
    fixture.componentInstance.needed.disable();
    expect(snapshot(needed)).toMatchObject({ touched: true, disabled: true, invalid: false });
    fixture.componentInstance.optional.markAsTouched();
    expect(optional?.showError()).toBe(true);
  });

  it('stops listening to a Reactive Forms control once destroyed', async () => {
    const { fixture, all } = states(ReactiveHost);
    await fixture.whenStable();
    const [needed] = all();
    expect(needed?.touched()).toBe(false);
    fixture.destroy();
    fixture.componentInstance.needed.markAsTouched();
    expect(needed?.touched()).toBe(false);
  });

  it("reads an unbound element's own attributes", () => {
    const { all } = states(NativeHost);
    const [plain, native] = all();
    expect(snapshot(plain)).toEqual({
      invalid: false,
      touched: false,
      required: false,
      disabled: false,
      showError: false,
      bound: false,
    });
    expect(snapshot(native)).toMatchObject({ required: true, disabled: true, bound: false });
  });
});
