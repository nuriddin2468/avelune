import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveRangeSlider, type AveNumberRange } from '@avelune/ui/slider';
import { AveRangeSliderHarness } from '@avelune/ui/slider/testing';
import { describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-range-slider-signal',
  imports: [AveFormField, AveHint, AveRangeSlider, FormField],
  template: `
    <ave-form-field label="Часы доставки">
      <ave-range-slider [maxValue]="24" [format]="hours" [formField]="settings.hours" />
      <p aveHint>Письма приходят только в эти часы.</p>
    </ave-form-field>
  `,
})
class SignalHost {
  readonly hours: Intl.NumberFormatOptions = { style: 'unit', unit: 'hour' };
  readonly model = signal<{ hours: AveNumberRange }>({ hours: { start: 9, end: 18 } });
  readonly settings = form(this.model);
}

@Component({
  selector: 'ave-range-slider-reactive',
  imports: [AveRangeSlider, ReactiveFormsModule],
  template: `<ave-range-slider label="Цена" [minValue]="100" [maxValue]="500" [step]="50" [formControl]="price" />`,
})
class ReactiveHost {
  readonly price = new FormControl<AveNumberRange | null>({ start: 150, end: 300 });
}

function mount<T>(type: new () => T): ComponentFixture<T> {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
  const fixture = TestBed.createComponent(type);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return fixture;
}

describe('AveRangeSlider', () => {
  it('writes the range in the field’s label row, names each thumb by the field and its end', async () => {
    const fixture = mount(SignalHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveRangeSliderHarness);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('ave-form-field .value')?.textContent).toMatch(/^9\sч – 18\sч$/);
    expect(await range.getValueText()).toMatch(/^9\sч$/);
    expect(await range.getEndText()).toMatch(/^18\sч$/);
    const label = element.querySelector('label')?.id ?? '';
    const names = await range.getThumbNames();
    expect(names.every((ids) => ids.startsWith(`${label} `))).toBe(true);
    const [lower, upper] = names.map((ids) => document.getElementById(ids.split(' ')[1] ?? '')?.textContent);
    expect([lower, upper]).toEqual(['Минимум', 'Максимум']);
    const hint = element.querySelector('[aveHint]')?.id;
    for (const input of element.querySelectorAll('input')) expect(input.getAttribute('aria-describedby')).toBe(hint);
  });

  it('keeps each thumb from passing the other, and puts the one that can move on top', async () => {
    const fixture = mount(SignalHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveRangeSliderHarness);
    const element = fixture.nativeElement as HTMLElement;
    const [start] = element.querySelectorAll('input');
    await range.setStart(20);
    expect(fixture.componentInstance.model().hours).toEqual({ start: 18, end: 18 });
    expect(await range.getRange()).toEqual({ start: 18, end: 18 });
    expect(start?.hasAttribute('data-top')).toBe(true);
    await range.setEnd(4);
    expect(fixture.componentInstance.model().hours).toEqual({ start: 18, end: 18 });
    await range.setStart(2);
    await range.setEnd(6);
    expect(fixture.componentInstance.model().hours).toEqual({ start: 2, end: 6 });
    expect(start?.hasAttribute('data-top')).toBe(false);
    const host = element.querySelector('ave-range-slider');
    expect(host?.getAttribute('style')).toContain('--ave-slider-start: 0.0833');
    expect(host?.getAttribute('style')).toContain('--ave-slider-end: 0.25');
  });

  it('binds Reactive Forms without a field: its label names the thumbs, and it writes the range itself', async () => {
    const fixture = mount(ReactiveHost);
    const range = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveRangeSliderHarness.with());
    const element = fixture.nativeElement as HTMLElement;
    const { price } = fixture.componentInstance;
    expect(element.querySelector('.head')?.textContent).toBe('150 – 300');
    const names = await range.getThumbNames();
    expect(names.map((ids) => document.getElementById(ids.split(' ')[0] ?? '')?.textContent)).toEqual(['Цена', 'Цена']);
    await range.setEnd(450);
    expect(price.value).toEqual({ start: 150, end: 450 });
    await range.focusEnd();
    expect(document.activeElement).toBe(element.querySelectorAll('input')[1]);
    await range.focus();
    await range.blur();
    expect(price.touched).toBe(true);
    price.setValue({ start: 400, end: 200 });
    expect(await range.getRange()).toEqual({ start: 200, end: 400 });
    price.setValue(null);
    expect(await range.getRange()).toEqual({ start: 100, end: 500 });
    price.disable();
    expect(await range.isDisabled()).toBe(true);
    await expect(
      TestbedHarnessEnvironment.loader(fixture).getHarness(AveRangeSliderHarness.with({ valueText: '100' })),
    ).resolves.toBeTruthy();
  });
});
