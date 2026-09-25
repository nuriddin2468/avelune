import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { AveDatePicker } from '@avelune/ui/date-picker';
import { AveDatePickerHarness } from '@avelune/ui/date-picker/testing';
import { tokens, type TokenName } from '@avelune/tokens';
import { describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-date-signal',
  imports: [AveDatePicker, FormField],
  template: `<ave-date-picker label="Signed on" [formField]="contract.signedOn" />`,
})
class SignalHost {
  readonly model = signal<{ signedOn: string | null; locked: boolean }>({ signedOn: '2026-09-23', locked: false });
  // `context.valueOf`: see the angular-eslint note in the input specs.
  readonly contract = form(this.model, (path) => {
    required(path.signedOn);
    disabled(path.signedOn, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-date-reactive',
  imports: [AveDatePicker, ReactiveFormsModule],
  template: `
    <ave-date-picker label="Due" minDate="2026-09-10" maxDate="2026-10-20" [formControl]="due" />
    <ave-date-picker label="Frozen" readonly />
  `,
})
class ReactiveHost {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly due = new FormControl<string | null>(null, { validators: [Validators.required] });
}

@Component({
  selector: 'ave-date-optional',
  imports: [AveDatePicker],
  template: `<ave-date-picker label="Paid on" [(value)]="paidOn" />`,
})
class OptionalHost {
  readonly paidOn = signal<string | null>('2026-09-23');
}

/** The tokens the layout of a date field reads. */
const layout = [
  'control.height.md',
  'control.padding-inline.md',
  'border-width.default',
  'space.1',
  'space.2',
  'space.4',
  'font.body-md',
] as const satisfies readonly TokenName[];

/** The layout tokens and border-box sizing, as the kit's global stylesheet gives every page. */
function withLayout(set: boolean): void {
  document.getElementById('ave-spec-reset')?.remove();
  if (set) {
    const reset = document.createElement('style');
    reset.id = 'ave-spec-reset';
    reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';
    document.head.append(reset);
  }
  for (const name of layout) {
    if (set) document.documentElement.style.setProperty(tokens[name].cssVar, tokens[name].css);
    else document.documentElement.style.removeProperty(tokens[name].cssVar);
  }
}

function mount<T>(type: new () => T, locale = 'ru'): ComponentFixture<T> {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(type);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return fixture;
}

describe('AveDatePicker', () => {
  it('writes and reads dates in the order of the locale', async () => {
    const fixture = mount(SignalHost, 'ru');
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDatePickerHarness);
    expect(await field.getText()).toBe('23.09.2026');
    expect(await field.getPlaceholder()).toBe('дд.мм.гггг');
    await field.type('1.10.26');
    expect(fixture.componentInstance.model().signedOn).toBe('2026-10-01');
    expect(await field.getText()).toBe('01.10.2026');
    await field.type('31.02.2026');
    expect(await field.getText()).toBe('01.10.2026');
    await field.type('');
    expect(fixture.componentInstance.model().signedOn).toBeNull();
    expect(await field.isInvalid()).toBe(true);
    expect(await field.isRequired()).toBe(true);
  });

  it('opens a calendar on the chosen date, in the locale, and chooses a day', async () => {
    const fixture = mount(SignalHost, 'uz-Latn');
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDatePickerHarness);
    expect(await field.getText()).toBe('23/09/2026');
    await field.open();
    await field.open();
    expect(await field.getMonth()).toBe('Sentabr, 2026');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-23');
    expect(await field.getChosenDates()).toEqual(['2026-09-23']);
    await field.nextMonth();
    expect(await field.getMonth()).toBe('Oktabr, 2026');
    await field.chooseDay(5);
    expect(fixture.componentInstance.model().signedOn).toBe('2026-10-05');
    expect(await field.isOpen()).toBe(false);
    await field.open();
    await field.previousMonth();
    expect(await field.getMonth()).toBe('Sentabr, 2026');
    await expect(field.chooseDay(31)).rejects.toThrow('the calendar shows no day 31');
  });

  it('moves with the arrow keys, into the next and previous month at the edges, and with Page Up and Down', async () => {
    const fixture = mount(SignalHost, 'ru');
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDatePickerHarness);
    fixture.componentInstance.model.update((model) => ({ ...model, signedOn: '2026-09-30' }));
    await field.open();
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-30');
    await field.press('right');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-10-01');
    expect(await field.getMonth()).toBe('Октябрь 2026 г.');
    await field.press('up');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-24');
    await field.press('pageDown');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-10-24');
    await field.press('pageUp');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-24');
    await field.press('left');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-23');
    await field.press('enter');
    expect(fixture.componentInstance.model().signedOn).toBe('2026-09-23');
    await field.open();
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-23');
    await field.press('escape');
    expect(await field.isOpen()).toBe(false);
  });

  it('moves a year with Shift and Page Up or Down, and leaves other keys and other cells to the grid', async () => {
    const fixture = mount(SignalHost, 'ru');
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDatePickerHarness);
    expect(await field.getMonth()).toBeNull();
    await field.open();
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-23');
    const element = fixture.nativeElement as HTMLElement;
    const focused = () => element.querySelector('[data-date]:focus');
    focused()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', shiftKey: true, bubbles: true }));
    await expect.poll(() => field.getFocusedDate()).toBe('2027-09-23');
    focused()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', shiftKey: true, bubbles: true }));
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-23');
    await field.press('down');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-09-30');
    await field.press('down');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-10-07');
    await field.press('home');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-10-05');
    await field.press('end');
    await expect.poll(() => field.getFocusedDate()).toBe('2026-10-11');
    element.querySelector('th')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    expect(await field.getMonth()).toBe('Октябрь 2026 г.');
    await field.press('escape');
    await expect(field.press('enter')).rejects.toThrow('no day of the calendar has focus');
  });

  it('closes on its button or a click outside, reads a date on Enter, and opens within its bounds', async () => {
    const fixture = mount(ReactiveHost, 'ru');
    const [due] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveDatePickerHarness);
    if (due === undefined) throw new Error('No field');
    await due.open();
    // Today (after 2026-10-20 or before 2026-09-10) is out of bounds: the calendar opens on a bound.
    await expect.poll(() => due.getFocusedDate()).toMatch(/^2026-(09|10)-\d{2}$/);
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.open')?.click();
    fixture.detectChanges();
    expect(await due.isOpen()).toBe(false);
    await due.open();
    element.querySelector('.popup')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(await due.isOpen()).toBe(true);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(await due.isOpen()).toBe(false);
    const input = element.querySelector('input');
    if (input === null) throw new Error('No input');
    input.value = '15.09.2026';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.due.value).toBe('2026-09-15');
    fixture.componentInstance.due.setValue(42 as unknown as string);
    expect(await due.getText()).toBe('');
  });

  it('clears an optional date with its button, before the calendar button, and keeps focus in it (ADR 0052)', async () => {
    withLayout(true);
    const fixture = mount(OptionalHost, 'ru');
    const field = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDatePickerHarness);
    expect(await field.canClear()).toBe(true);
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input');
    const clear = element.querySelector('.clear');
    const opener = element.querySelector('.open');
    if (input === null || clear === null || opener === null) throw new Error('No parts');
    const textEnd = input.getBoundingClientRect().right - Number.parseFloat(getComputedStyle(input).paddingInlineEnd);
    expect(clear.getBoundingClientRect().right).toBe(opener.getBoundingClientRect().left);
    expect(clear.getBoundingClientRect().left - textEnd).toBe(4);
    await field.open();
    await field.clear();
    expect(fixture.componentInstance.paidOn()).toBeNull();
    expect(await field.getText()).toBe('');
    expect(await field.isOpen()).toBe(false);
    expect(await field.canClear()).toBe(false);
    expect(document.activeElement).toBe(input);
    withLayout(false);
  });

  it('shows no clear button on a required or readonly date', async () => {
    const fixture = mount(ReactiveHost, 'ru');
    const [due, frozen] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveDatePickerHarness);
    await due?.type('01.10.2026');
    expect(await due?.canClear()).toBe(false);
    expect(await frozen?.canClear()).toBe(false);
    await expect(due?.clear()).rejects.toThrow('shows no clear button');
  });

  it('binds a Reactive Forms control, keeps dates within its bounds, and is readonly or disabled', async () => {
    const fixture = mount(ReactiveHost, 'en-US');
    const [due, frozen] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveDatePickerHarness);
    if (due === undefined || frozen === undefined) throw new Error('No fields');
    expect(await due.getPlaceholder()).toBe('mm/dd/yyyy');
    await due.type('11/01/2026');
    expect(fixture.componentInstance.due.value).toBeNull();
    expect(fixture.componentInstance.due.touched).toBe(true);
    await due.type('10/01/2026');
    expect(fixture.componentInstance.due.value).toBe('2026-10-01');
    await due.open();
    expect(await due.getDisabledDates()).toContain('2026-10-21');
    expect(await due.getDisabledDates()).not.toContain('2026-10-20');
    expect(await frozen.isReadonly()).toBe(true);
    expect(await frozen.isRequired()).toBe(false);
    await frozen.focus();
    await frozen.blur();
    const chosen = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveDatePickerHarness.with({ text: '10/01/2026' }),
    );
    await chosen.open();
    expect(await chosen.getChosenDates()).toEqual(['2026-10-01']);
    fixture.componentInstance.due.disable();
    expect(await due.isDisabled()).toBe(true);
  });
});
