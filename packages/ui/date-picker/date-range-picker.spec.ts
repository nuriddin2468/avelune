import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { AveDateRangePicker, type AveDateRange } from '@avelune/ui/date-picker';
import { AveDateRangePickerHarness } from '@avelune/ui/date-picker/testing';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-range-signal',
  imports: [AveDateRangePicker, AveFormField, AveHint, FormField],
  template: `
    <ave-form-field label="Period">
      <ave-date-range-picker [formField]="contract.period" />
      <p aveHint>From signing to acceptance.</p>
    </ave-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ period: AveDateRange | null }>({ period: null });
  readonly contract = form(this.model, (path) => {
    required(path.period);
  });
}

@Component({
  selector: 'ave-range-reactive',
  imports: [AveDateRangePicker, ReactiveFormsModule],
  template: `<ave-date-range-picker minDate="2026-09-01" [formControl]="period" />`,
})
class ReactiveHost {
  readonly period = new FormControl<AveDateRange | null>({ start: '2026-09-10', end: '2026-09-20' });
}

@Component({
  selector: 'ave-range-labelled',
  imports: [AveDateRangePicker],
  template: `<ave-date-range-picker label="Отпуск" />`,
})
class LabelledHost {}

function mount<T>(type: new () => T): ComponentFixture<T> {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
  const fixture = TestBed.createComponent(type);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return fixture;
}

describe('AveDateRangePicker', () => {
  it('chooses the start and then the end in one calendar, marking the days between', async () => {
    const fixture = mount(SignalHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    fixture.componentInstance.model.set({ period: { start: '2026-09-07', end: null } });
    await range.open();
    await expect.poll(() => range.getFocusedDate()).toBe('2026-09-07');
    await range.chooseDay(3);
    expect(fixture.componentInstance.model().period).toEqual({ start: '2026-09-03', end: null });
    expect(await range.isOpen()).toBe(true);
    await range.chooseDay(6);
    expect(fixture.componentInstance.model().period).toEqual({ start: '2026-09-03', end: '2026-09-06' });
    expect(await range.isOpen()).toBe(false);
    expect([await range.getText(), await range.getEndText()]).toEqual(['03.09.2026', '06.09.2026']);
    await range.open();
    expect(await range.getRangeDates()).toEqual(['2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06']);
    await range.chooseDay(20);
    expect(fixture.componentInstance.model().period).toEqual({ start: '2026-09-20', end: null });
  });

  it('names each input by the field and its part, and describes both with the hint', async () => {
    const fixture = mount(SignalHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    const element = fixture.nativeElement as HTMLElement;
    const label = element.querySelector('label')?.id ?? '';
    const [start, end] = await range.getInputNames();
    expect(start?.startsWith(`${label} `)).toBe(true);
    expect(end?.startsWith(`${label} `)).toBe(true);
    const hint = element.querySelector('[aveHint]')?.id;
    for (const input of element.querySelectorAll('input')) expect(input.getAttribute('aria-describedby')).toBe(hint);
    expect([...element.querySelectorAll('[hidden]')].map((name) => name.textContent)).toEqual([
      'Дата начала',
      'Дата окончания',
    ]);
    expect(await range.isRequired()).toBe(true);
  });

  it('is named by its label input without a field', async () => {
    const fixture = mount(LabelledHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    const element = fixture.nativeElement as HTMLElement;
    const [start, end] = element.querySelectorAll('input');
    const names = await range.getInputNames();
    expect(names).toHaveLength(2);
    const name = (ids: string | undefined) =>
      (ids ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent)
        .join(', ');
    expect([
      name(start?.getAttribute('aria-labelledby') ?? ''),
      name(end?.getAttribute('aria-labelledby') ?? ''),
    ]).toEqual(['Отпуск, Дата начала', 'Отпуск, Дата окончания']);
  });

  it('works without a field, closes on its button, a click outside or Escape, and restarts a range before its start', async () => {
    const fixture = mount(ReactiveHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveDateRangePickerHarness.with({ text: '10.09.2026' }),
    );
    const element = fixture.nativeElement as HTMLElement;
    expect((await range.getInputNames()).every((ids) => !ids.includes(' '))).toBe(true);
    await range.open();
    await expect.poll(() => range.getFocusedDate()).toBe('2026-09-10');
    element.querySelector<HTMLButtonElement>('.open')?.click();
    fixture.detectChanges();
    expect(await range.isOpen()).toBe(false);
    fixture.componentInstance.period.setValue({ start: '2026-09-10', end: null });
    await range.open();
    await range.chooseDay(5);
    expect(fixture.componentInstance.period.value).toEqual({ start: '2026-09-05', end: null });
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(await range.isOpen()).toBe(false);
    fixture.componentInstance.period.setValue(null);
    await range.open();
    await range.press('escape');
    expect(await range.isOpen()).toBe(false);
    fixture.componentInstance.period.setValue('bad' as unknown as AveDateRange);
    expect(await range.getText()).toBe('');
    const [start] = [...element.querySelectorAll('input')];
    if (start === undefined) throw new Error('No input');
    start.value = '07.09.2026';
    start.dispatchEvent(new Event('input'));
    start.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(fixture.componentInstance.period.value).toEqual({ start: '2026-09-07', end: null });
    await expect(range.typeEnd('x')).resolves.toBeUndefined();
    expect(await range.getEndText()).toBe('');
  });

  it('reads typed dates, swaps an end before the start, clears an emptied range, and keeps the bounds', async () => {
    const fixture = mount(ReactiveHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    expect(await range.getText()).toBe('10.09.2026');
    await range.typeEnd('05.09.2026');
    expect(fixture.componentInstance.period.value).toEqual({ start: '2026-09-05', end: '2026-09-10' });
    await range.type('01.08.2026');
    expect(fixture.componentInstance.period.value).toEqual({ start: '2026-09-05', end: '2026-09-10' });
    expect(await range.getText()).toBe('05.09.2026');
    await range.type('');
    await range.typeEnd('');
    expect(fixture.componentInstance.period.value).toBeNull();
    expect(fixture.componentInstance.period.touched).toBe(true);
    fixture.componentInstance.period.disable();
    expect(await range.isDisabled()).toBe(true);
  });
});
