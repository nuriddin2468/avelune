import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form } from '@angular/forms/signals';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveSlider } from '@avelune/ui/slider';
import { AveSliderHarness } from '@avelune/ui/slider/testing';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { clamp, ratio } from './scale';

@Component({
  selector: 'ave-slider-signal',
  imports: [AveFormField, AveHint, AveSlider, FormField],
  template: `
    <ave-form-field label="Аванс">
      @if (shown()) {
        <ave-slider [maxValue]="50" [step]="5" [format]="percent" [formField]="contract.advance" />
      }
      <p aveHint>Доля суммы договора.</p>
    </ave-form-field>
  `,
})
class SignalHost {
  readonly shown = signal(true);
  readonly percent: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent' };
  readonly model = signal({ advance: 15, locked: false });
  // `context.valueOf`: see the angular-eslint note in the input specs.
  readonly contract = form(this.model, (path) => {
    disabled(path.advance, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-slider-reactive',
  imports: [AveSlider, ReactiveFormsModule],
  template: `
    <ave-slider label="Громкость" [formControl]="volume" />
    <ave-slider minValue="10" maxValue="20" />
  `,
})
class ReactiveHost {
  readonly volume = new FormControl(40, { nonNullable: true });
}

@Component({
  selector: 'ave-slider-disabled',
  imports: [AveFormField, AveSlider],
  template: `
    <ave-form-field label="Аванс">
      <ave-slider disabled [value]="15" />
    </ave-form-field>
  `,
})
class DisabledHost {}

function mount<T>(type: new () => T, locale = 'ru'): ComponentFixture<T> {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(type);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return fixture;
}

describe('AveSlider', () => {
  it('writes its value in the field’s label row and for screen readers, and its bounds, in the locale', async () => {
    const fixture = mount(SignalHost);
    const slider = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSliderHarness.with());
    const element = fixture.nativeElement as HTMLElement;
    const shown = () => element.querySelector('ave-form-field .value')?.textContent;
    expect(shown()).toBe('15\u00a0%');
    expect(await slider.getValueText()).toBe('15\u00a0%');
    expect(await slider.getBounds()).toEqual(['0\u00a0%', '50\u00a0%']);
    await slider.setValue(25);
    expect(fixture.componentInstance.model().advance).toBe(25);
    expect(shown()).toBe('25\u00a0%');
    await slider.setValue(80);
    expect(await slider.getValue()).toBe(50);
    expect(fixture.componentInstance.model().advance).toBe(50);
    const input = element.querySelector('input');
    expect(input?.id).toBe(element.querySelector('label')?.getAttribute('for'));
    expect(input?.getAttribute('aria-describedby')).toBe(element.querySelector('[aveHint]')?.id);
    expect(element.querySelector('ave-slider')?.getAttribute('style')).toContain('--ave-slider-end: 1');
  });

  it('follows the keyboard as the browser’s range input does, and asks for the ring on its thumb', async () => {
    const fixture = mount(SignalHost);
    const slider = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSliderHarness);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input');
    input?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(await slider.getValue()).toBe(20);
    await userEvent.keyboard('{End}');
    expect(fixture.componentInstance.model().advance).toBe(50);
    await userEvent.keyboard('{Home}');
    expect(fixture.componentInstance.model().advance).toBe(0);
    // The ring on the thumb is the global stylesheet's (focus.css), which the Global styles story checks.
    expect(input?.getAttribute('data-focus-ring')).toBe('thumb');
  });

  it('dims while the form disables it, and takes its value out of the label row when it goes', async () => {
    const fixture = mount(SignalHost);
    const slider = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSliderHarness);
    const element = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    fixture.detectChanges();
    expect(await slider.isDisabled()).toBe(true);
    expect(element.querySelector('ave-slider')?.getAttribute('data-disabled')).toBe('true');
    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();
    expect(element.querySelector('ave-form-field .value')).toBeNull();
  });

  it('binds Reactive Forms, shows its value itself without a field, and is named by its label', async () => {
    const fixture = mount(ReactiveHost, 'en-US');
    const [volume, plain] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveSliderHarness);
    if (volume === undefined || plain === undefined) throw new Error('No sliders');
    const element = fixture.nativeElement as HTMLElement;
    const [first, second] = element.querySelectorAll('input');
    expect(first?.getAttribute('aria-label')).toBe('Громкость');
    expect(second?.hasAttribute('aria-label')).toBe(false);
    expect(element.querySelector('.head')?.textContent).toBe('40');
    expect(await plain.getBounds()).toEqual(['10', '20']);
    expect(await plain.getValue()).toBe(10);
    await volume.setValue(55);
    expect(fixture.componentInstance.volume.value).toBe(55);
    await volume.focus();
    await volume.blur();
    expect(fixture.componentInstance.volume.touched).toBe(true);
    expect(await volume.isInvalid()).toBe(false);
    fixture.componentInstance.volume.setValue('loud' as unknown as number);
    expect(await volume.getValue()).toBe(0);
    fixture.componentInstance.volume.disable();
    expect(await volume.isDisabled()).toBe(true);
    const found = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSliderHarness.with({ valueText: '10' }),
    );
    expect(await found.getValue()).toBe(10);
  });
});

describe('AveSlider disabled by its own input', () => {
  it('dims the label and the value of the field around it', () => {
    const fixture = mount(DisabledHost);
    const field = (fixture.nativeElement as HTMLElement).querySelector('ave-form-field');
    expect(field?.hasAttribute('data-disabled')).toBe(true);
    expect(field?.querySelector('.value')?.textContent).toBe('15');
  });
});

describe('slider scale', () => {
  it('keeps a value within its bounds and finds its share of the track', () => {
    expect(clamp(120, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(7, 10, 10)).toBe(7);
    expect(ratio(25, 0, 50)).toBe(0.5);
    expect(ratio(25, 10, 10)).toBe(0);
  });
});
