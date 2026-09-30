import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, maxLength, pattern, required } from '@angular/forms/signals';
import { AveInput } from '@avelune/ui/input';
import { AveMask, aveMaskPattern, type AveMaskInput } from '@avelune/ui/mask';
import { AveMaskHarness } from '@avelune/ui/mask/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-mask-host',
  imports: [AveInput, AveMask],
  template: `
    <input aveInput [aveMask]="mask()" [(value)]="value" aria-label="Поле" />
    <input id="source" aria-label="Источник" />
    <button type="button">Дальше</button>
  `,
})
class MaskHost {
  readonly mask = signal<AveMaskInput>('phone');
  readonly value = signal('');
}

@Component({
  selector: 'ave-mask-signal-host',
  imports: [AveInput, AveMask, FormField],
  template: `<input aveInput aveMask="phone" type="tel" aria-label="Телефон" [formField]="contact.phone" />`,
})
class SignalFormsHost {
  readonly locked = signal(false);
  readonly model = signal({ phone: '' });
  readonly contact = form(this.model, (path) => {
    required(path.phone);
    pattern(path.phone, aveMaskPattern('phone'));
    maxLength(path.phone, 13);
    disabled(path.phone, { when: () => this.locked() });
  });
}

@Component({
  selector: 'ave-mask-reactive-host',
  imports: [AveInput, AveMask, ReactiveFormsModule],
  template: `<input
      aveInput
      aveMask="passport"
      aria-label="Паспорт"
      inputmode="text"
      autocapitalize="off"
      [formControl]="passport"
    />
    <input aveInput aveMask="card" aria-label="Карта" inputmode="text" [formControl]="card" />`,
})
class ReactiveFormsHost {
  readonly passport = new FormControl<string | null>('AA1234567');
  readonly card = new FormControl('8600123456789012', {
    nonNullable: true,
    validators: [Validators.pattern(aveMaskPattern('card'))],
  });
}

function mount<T>(host: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement; input: HTMLInputElement } {
  const fixture = TestBed.createComponent(host);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  const input = element.querySelector<HTMLInputElement>('input[data-ave-mask]');
  if (input === null) throw new Error('No masked input');
  return { fixture, element, input };
}

let mounted: HTMLElement | null = null;
afterEach(() => {
  mounted?.remove();
  mounted = null;
});

async function paste(element: HTMLElement, into: HTMLInputElement, text: string): Promise<void> {
  const source = element.querySelector<HTMLInputElement>('#source');
  if (source === null) throw new Error('No source input');
  source.value = text;
  source.select();
  await userEvent.copy();
  into.focus();
  into.select();
  await userEvent.paste();
}

describe('AveMask', () => {
  it('groups a phone as typed, holds it as E.164, and keeps +998 out of an empty value', async () => {
    const { fixture, element, input } = mount(MaskHost);
    mounted = element;
    await fixture.whenStable();
    const mask = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMaskHarness);
    expect(await mask.getInputMode()).toBe('tel');
    expect(await mask.getMask()).toBe('phone');

    await userEvent.click(input);
    expect(input.value).toBe('+998 ');
    expect(fixture.componentInstance.value()).toBe('');
    await userEvent.keyboard('90x1234567');
    expect(await mask.getShown()).toBe('+998 90 123-45-67');
    expect(fixture.componentInstance.value()).toBe('+998901234567');
    await userEvent.keyboard('8');
    expect(fixture.componentInstance.value()).toBe('+998901234567');

    // A partial number stays partial; clearing leaves the prefix, and leaving an empty field takes it away.
    // Deleting a digit after a written character deletes both: "+998 90 123-45-67" loses 7, 6 and "-5".
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}');
    expect(input.value).toBe('+998 90 123-4');
    expect(fixture.componentInstance.value()).toBe('+998901234');
    input.select();
    await userEvent.keyboard('{Backspace}');
    expect(input.value).toBe('+998 ');
    expect(fixture.componentInstance.value()).toBe('');
    await userEvent.click(element.querySelector('button') ?? element);
    expect(input.value).toBe('');
  });

  it('takes a pasted phone in any shape', async () => {
    const { fixture, element, input } = mount(MaskHost);
    mounted = element;
    await fixture.whenStable();
    for (const text of ['+998 90 123 45 67', '998901234567', '(90) 123-45-67', '901234567']) {
      await paste(element, input, text);
      expect(input.value).toBe('+998 90 123-45-67');
      expect(fixture.componentInstance.value()).toBe('+998901234567');
    }
  });

  it('shows a value the program writes grouped, in the shape the mask asks for', async () => {
    const { fixture, element, input } = mount(MaskHost);
    mounted = element;
    fixture.componentInstance.value.set('+998901234567');
    await fixture.whenStable();
    expect(input.value).toBe('+998 90 123-45-67');
    fixture.componentInstance.value.set('998711234567');
    await fixture.whenStable();
    expect(input.value).toBe('+998 71 123-45-67');
    fixture.componentInstance.value.set('');
    await fixture.whenStable();
    expect(input.value).toBe('');

    fixture.componentInstance.mask.set('card');
    fixture.componentInstance.value.set('8600123456789012');
    await fixture.whenStable();
    expect(input.value).toBe('8600 1234 5678 9012');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    await paste(element, input, '9860 0000 1111 2222');
    expect(fixture.componentInstance.value()).toBe('9860000011112222');

    fixture.componentInstance.mask.set('account');
    fixture.componentInstance.value.set('23402000300100001010');
    await fixture.whenStable();
    expect(input.value).toBe('2340 2000 3001 0000 1010');
  });

  it('writes a passport’s letters upper case and takes digits only where digits go', async () => {
    const { fixture, element, input } = mount(MaskHost);
    mounted = element;
    fixture.componentInstance.mask.set('passport');
    await fixture.whenStable();
    expect(input.getAttribute('inputmode')).toBe('text');
    expect(input.getAttribute('autocapitalize')).toBe('characters');
    await userEvent.click(input);
    await userEvent.keyboard('a1b1234567');
    expect(input.value).toBe('AB1234567');
    expect(fixture.componentInstance.value()).toBe('AB1234567');

    for (const [preset, typed] of [
      ['stir', '30234567899'],
      ['pinfl', '123456789012345'],
      ['mfo', '001234'],
      ['postcode', '1000001'],
    ] as const) {
      fixture.componentInstance.mask.set(preset);
      fixture.componentInstance.value.set('');
      await fixture.whenStable();
      expect(input.hasAttribute('autocapitalize')).toBe(false);
      await userEvent.click(input);
      input.select();
      await userEvent.keyboard(`{Backspace}x${typed}`);
      expect(fixture.componentInstance.value()).toMatch(aveMaskPattern(preset));
    }
  });

  it('runs a pattern of the application’s, and a RegExp as a filter', async () => {
    const { fixture, element, input } = mount(MaskHost);
    mounted = element;
    fixture.componentInstance.mask.set({ pattern: '\\0A-000' });
    await fixture.whenStable();
    await userEvent.click(input);
    await userEvent.keyboard('b12345');
    expect(input.value).toBe('0B-123');
    expect(fixture.componentInstance.value()).toBe('B123');
    expect(aveMaskPattern({ pattern: '\\0A-000' }).test('B123')).toBe(true);

    fixture.componentInstance.mask.set({ pattern: '00.00', value: 'shown', inputMode: 'tel' });
    fixture.componentInstance.value.set('');
    await fixture.whenStable();
    expect(input.getAttribute('inputmode')).toBe('tel');
    input.select();
    await userEvent.keyboard('{Backspace}1234');
    expect(fixture.componentInstance.value()).toBe('12.34');
    expect(aveMaskPattern({ pattern: '00.00', value: 'shown' }).test('12.34')).toBe(true);

    fixture.componentInstance.mask.set(/^[A-Z0-9-]{0,6}$/);
    fixture.componentInstance.value.set('');
    await fixture.whenStable();
    input.select();
    await userEvent.keyboard('{Backspace}AB-1x2345');
    expect(input.value).toBe('AB-123');
    expect(fixture.componentInstance.value()).toBe('AB-123');
  });

  it('binds Signal Forms: the clean value, its pattern and length on the value, disabled on the input', async () => {
    const { fixture, element, input } = mount(SignalFormsHost);
    mounted = element;
    await fixture.whenStable();
    const field = fixture.componentInstance.contact.phone;
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(input.required).toBe(true);
    await userEvent.click(input);
    await userEvent.keyboard('901234');
    expect(field().value()).toBe('+998901234');
    expect(
      field()
        .errors()
        .map((error) => error.kind),
    ).toEqual(['pattern']);
    await userEvent.keyboard('567');
    expect(input.value).toBe('+998 90 123-45-67');
    expect(field().errors()).toEqual([]);
    await userEvent.click(document.body);
    expect(field().touched()).toBe(true);

    fixture.componentInstance.model.set({ phone: '+998711234567' });
    await fixture.whenStable();
    expect(input.value).toBe('+998 71 123-45-67');
    fixture.componentInstance.locked.set(true);
    await fixture.whenStable();
    expect(input.disabled).toBe(true);
  });

  it('binds Reactive Forms: the control’s value shown grouped, typing and disabling through the control', async () => {
    const { fixture, element, input } = mount(ReactiveFormsHost);
    mounted = element;
    await fixture.whenStable();
    const { card, passport } = fixture.componentInstance;
    // The application's keyboard settings stay; a null from the form shows nothing.
    expect(input.value).toBe('AA1234567');
    expect(input.getAttribute('autocapitalize')).toBe('off');
    passport.setValue(null);
    await fixture.whenStable();
    expect(input.value).toBe('');

    const cardInput = element.querySelector<HTMLInputElement>('[data-ave-mask="card"]');
    if (cardInput === null) throw new Error('No card input');
    expect(cardInput.value).toBe('8600 1234 5678 9012');
    expect(cardInput.getAttribute('inputmode')).toBe('text');
    await userEvent.click(cardInput);
    await userEvent.keyboard('{Backspace}{Backspace}');
    expect(card.value).toBe('86001234567890');
    expect(card.valid).toBe(false);
    await userEvent.click(document.body);
    expect(card.touched).toBe(true);
    card.setValue('9860000011112222');
    await fixture.whenStable();
    expect(cardInput.value).toBe('9860 0000 1111 2222');
    expect(card.valid).toBe(true);
    card.disable();
    expect(cardInput.disabled).toBe(true);
    const mask = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveMaskHarness.with({ shown: '9860 0000 1111 2222' }),
    );
    expect(await mask.isDisabled()).toBe(true);
    card.enable();
    await mask.focus();
    await mask.blur();
    expect(await mask.isDisabled()).toBe(false);
  });
});
