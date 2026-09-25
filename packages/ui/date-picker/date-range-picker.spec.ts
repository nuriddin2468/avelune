import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { AveDateRangePicker, type AveDateRange } from '@avelune/ui/date-picker';
import { AveDateRangePickerHarness } from '@avelune/ui/date-picker/testing';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { tokens, type TokenName } from '@avelune/tokens';
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

@Component({
  selector: 'ave-range-optional',
  imports: [AveDateRangePicker, AveFormField],
  template: `
    <ave-form-field label="Отпуск">
      <ave-date-range-picker [(value)]="leave" />
    </ave-form-field>
  `,
})
class OptionalHost {
  readonly leave = signal<AveDateRange | null>({ start: '2026-09-10', end: '2026-09-20' });
}

const layout = [
  'control.height.md',
  'control.padding-inline.md',
  'border-width.default',
  'space.1',
  'space.2',
  'space.4',
  'font.body-md',
  'font.label-md',
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

/** The room an input leaves for its text: its width without borders and paddings. */
function room(input: HTMLInputElement): number {
  const style = getComputedStyle(input);
  return input.clientWidth - Number.parseFloat(style.paddingInlineStart) - Number.parseFloat(style.paddingInlineEnd);
}

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
  it('clears both dates with one button in the end input, and moves focus to the start (ADR 0052)', async () => {
    withLayout(true);
    const fixture = mount(OptionalHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    const element = fixture.nativeElement as HTMLElement;
    // The narrowest container in which the dates stand side by side.
    element.style.display = 'block';
    element.style.inlineSize = '320px';
    const [start, end] = [...element.querySelectorAll<HTMLInputElement>('.trigger')];
    const clear = element.querySelector('.clear');
    if (start === undefined || end === undefined || clear === null) throw new Error('No parts');
    expect(await range.canClear()).toBe(true);
    expect(clear.parentElement).toBe(end.parentElement);
    expect(start.getBoundingClientRect().top).toBe(end.getBoundingClientRect().top);
    // Both inputs have the same room for a date; the end input is wider by the clear button's room.
    expect(room(end)).toBe(room(start));
    expect(end.getBoundingClientRect().width).toBeGreaterThan(start.getBoundingClientRect().width);
    const names = (clear.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id));
    // "Clear" in the locale, then the field's own label (whose hidden asterisk is no part of a name).
    expect(names[0]?.textContent).toBe('Очистить');
    expect(names[1]).toBe(element.querySelector('ave-form-field label'));
    const wide = end.getBoundingClientRect().width;
    await range.clear();
    expect(fixture.componentInstance.leave()).toBeNull();
    expect([await range.getText(), await range.getEndText()]).toEqual(['', '']);
    expect(document.activeElement).toBe(start);
    // Nothing moves when the button goes: the room for it stays while the range may be cleared.
    expect(end.getBoundingClientRect().width).toBe(wide);
    expect(await range.canClear()).toBe(false);
    withLayout(false);
  });

  it('keeps two equal inputs and no clear button while the range is required', async () => {
    withLayout(true);
    const fixture = mount(SignalHost);
    fixture.componentInstance.model.set({ period: { start: '2026-09-07', end: '2026-09-09' } });
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    expect(await range.canClear()).toBe(false);
    const [start, end] = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.trigger')];
    expect(end?.getBoundingClientRect().width).toBe(start?.getBoundingClientRect().width);
    withLayout(false);
  });
  it('moves between months and years without choosing one, and marks the months of both ends (ADR 0053)', async () => {
    const fixture = mount(ReactiveHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDateRangePickerHarness);
    fixture.componentInstance.period.setValue({ start: '2026-09-10', end: '2026-11-02' });
    await range.open();
    await range.clickHeading();
    const element = fixture.nativeElement as HTMLElement;
    const selected = [...element.querySelectorAll('[data-month][aria-selected="true"]')].map((cell) =>
      cell.getAttribute('data-month'),
    );
    expect(selected).toEqual(['2026-09', '2026-11']);
    expect(await range.getDisabledPeriods()).toContain('2026-08');
    await range.chooseMonth('Октябрь');
    expect(await range.getMonth()).toBe('Октябрь 2026 г.');
    expect(fixture.componentInstance.period.value).toEqual({ start: '2026-09-10', end: '2026-11-02' });
    expect(await range.getRangeDates()).toContain('2026-10-15');
  });
});
