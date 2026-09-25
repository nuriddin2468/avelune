import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, pattern, required } from '@angular/forms/signals';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveFormFieldHarness } from '@avelune/ui/form-field/testing';
import { AveInput } from '@avelune/ui/input';
import { AveInputHarness } from '@avelune/ui/input/testing';
import { describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-field-signal',
  imports: [AveFormField, AveHint, AveError, AveInput, FormField],
  template: `
    <ave-form-field label="Contract number">
      <input aveInput type="text" [formField]="contract.number" />
      <p aveHint>As written on the signed copy.</p>
      @if (contract.number().invalid()) {
        <p aveError>Enter the contract number, for example ДК-2026/114.</p>
      }
    </ave-form-field>
  `,
})
class SignalHost {
  readonly model = signal({ number: '', locked: false });
  // `context.valueOf`, not a destructured `valueOf`: angular-eslint 22.5's reactive-context-must-read-signal looks call
  // names up in a plain object and crashes on Object.prototype.valueOf.
  readonly contract = form(this.model, (path) => {
    required(path.number);
    pattern(path.number, /^ДК-\d{4}\/\d+$/);
    disabled(path.number, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-field-reactive',
  imports: [AveFormField, AveError, AveInput, ReactiveFormsModule],
  template: `
    <ave-form-field label="Email">
      <input aveInput type="email" id="email" aria-describedby="email-note" [formControl]="email" />
      <p aveError id="email-error">Enter an address like name@example.uz.</p>
    </ave-form-field>
    <p id="email-note">We send the approval notices here.</p>
  `,
})
class ReactiveHost {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
}

@Component({
  selector: 'ave-field-plain',
  imports: [AveFormField, AveError, AveInput],
  template: `
    <ave-form-field label="Note">
      <input aveInput type="text" aria-invalid="true" />
      <p aveError>Too long by 20 characters.</p>
    </ave-form-field>
    <ave-form-field label="Empty" />
  `,
})
class PlainHost {}

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

describe('AveFormField', () => {
  it('labels its Signal Forms control, marks it required, and describes it by its hint', async () => {
    const { fixture, element } = mount(SignalHost);
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFormFieldHarness);
    const input = await field.getHarness(AveInputHarness);
    const control = element.querySelector('input');
    expect(await field.getLabel()).toBe('Contract number');
    expect(await field.getControlId()).toBe(control?.id);
    expect(control?.id).toMatch(/^ave-field-\d+$/);
    expect(await field.isRequired()).toBe(true);
    expect(await field.getHint()).toBe('As written on the signed copy.');
    const hintId = element.querySelector('[aveHint]')?.id ?? '';
    expect(await input.getDescribedBy()).toEqual([hintId]);
    // The label names the control, so assistive technology reads "Contract number".
    expect(control?.labels?.[0]?.textContent.replace(/\s+/g, ' ').trim()).toBe('Contract number *');
    expect(element.querySelector('.required')?.getAttribute('aria-hidden')).toBe('true');
    // No whitespace between the label and the marker, so a wrapped label never leaves the asterisk alone on a line.
    expect(element.querySelector('.required')?.previousSibling?.textContent).toBe('Contract number');
  });

  it('shows its error once the control is invalid and touched, and describes the control by it', async () => {
    const { fixture, element } = mount(SignalHost);
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFormFieldHarness);
    const input = await field.getHarness(AveInputHarness);
    expect(await field.getError()).toBeNull();
    await input.setValue('114');
    expect(await field.getError()).toBeNull();
    await input.blur();
    expect(await field.getError()).toBe('Enter the contract number, for example ДК-2026/114.');
    const errorId = element.querySelector('[aveError]')?.id ?? '';
    expect(await input.getDescribedBy()).toContain(errorId);
    expect(await input.isInvalid()).toBe(true);
    expect(element.querySelector('.error ave-icon')?.getAttribute('aria-hidden')).toBe('true');
    await input.setValue('ДК-2026/114');
    expect(await field.getError()).toBeNull();
    expect(await input.getDescribedBy()).not.toContain(errorId);
  });

  it('dims its label when the control is disabled', async () => {
    const { fixture, element } = mount(SignalHost);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelector('ave-form-field')?.hasAttribute('data-disabled')).toBe(true);
  });

  it("keeps a Reactive Forms control's own id and description, and marks Validators.required", async () => {
    const { fixture, element } = mount(ReactiveHost);
    await fixture.whenStable();
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFormFieldHarness);
    const input = await field.getHarness(AveInputHarness);
    expect(await field.getControlId()).toBe('email');
    expect(await field.isRequired()).toBe(true);
    expect(element.querySelector('input')?.getAttribute('aria-required')).toBe('true');
    expect(await field.getHint()).toBeNull();
    expect(await field.getError()).toBeNull();
    expect(await input.getDescribedBy()).toEqual(['email-note']);
    await input.blur();
    expect(await field.getError()).toBe('Enter an address like name@example.uz.');
    expect(await input.getDescribedBy()).toEqual(['email-note', 'email-error']);
  });

  it('shows the error of an unbound control whenever the template has one', async () => {
    const { fixture } = mount(PlainHost);
    const [note, empty] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveFormFieldHarness);
    expect(await note?.getError()).toBe('Too long by 20 characters.');
    expect(await note?.isRequired()).toBe(false);
    expect(await empty?.getControlId()).toMatch(/^ave-field-\d+$/);
  });

  it('matches fields by label', async () => {
    const { fixture } = mount(PlainHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveFormFieldHarness.with({ label: /^No/ }))).toHaveLength(1);
  });
});
