import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveCheckboxHarness } from '@avelune/ui/checkbox/testing';
import { AveChoiceGroup, AveError, AveHint } from '@avelune/ui/form-field';
import { AveChoiceGroupHarness } from '@avelune/ui/form-field/testing';
import { AveRadio } from '@avelune/ui/radio';
import { AveRadioHarness } from '@avelune/ui/radio/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-group-radios',
  imports: [AveChoice, AveChoiceGroup, AveError, AveHint, AveRadio, FormField],
  template: `
    <fieldset aveChoiceGroup legend="Delivery">
      <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
      <label aveChoice><input type="radio" aveRadio value="pickup" [formField]="order.delivery" /> Pickup</label>
      <p aveHint>Pickup is free.</p>
      @if (order.delivery().errors().length > 0) {
        <p aveError>Choose how to deliver the order.</p>
      }
    </fieldset>
  `,
})
class RadioGroupHost {
  readonly model = signal({ delivery: '' });
  readonly order = form(this.model, (path) => {
    required(path.delivery);
  });
}

@Component({
  selector: 'ave-group-checkboxes',
  imports: [AveCheckbox, AveChoice, AveChoiceGroup, AveError, FormField],
  template: `
    <fieldset aveChoiceGroup legend="Notify" aria-describedby="own-note">
      <label aveChoice><input type="checkbox" aveCheckbox [formField]="settings.email" /> By email</label>
      <label aveChoice><input type="checkbox" aveCheckbox [formField]="settings.sms" /> By SMS</label>
      @if (settings().errors().length > 0) {
        <p aveError>Choose at least one way to notify.</p>
      }
    </fieldset>
  `,
})
class CheckboxGroupHost {
  readonly model = signal({ email: false, sms: false });
  // `context.value()`, not a destructured `value`: see the angular-eslint note in the input specs.
  readonly settings = form(this.model, (path) => {
    validate(path, (context) =>
      context.value().email || context.value().sms ? undefined : { kind: 'channel', message: 'one at least' },
    );
  });
}

@Component({
  selector: 'ave-group-reactive',
  imports: [AveChoice, AveChoiceGroup, AveRadio, ReactiveFormsModule],
  template: `
    <fieldset aveChoiceGroup legend="Delivery" [formGroup]="order">
      <label aveChoice><input type="radio" aveRadio value="courier" formControlName="delivery" /> Courier</label>
      <label aveChoice><input type="radio" aveRadio value="pickup" formControlName="delivery" /> Pickup</label>
    </fieldset>
  `,
})
class ReactiveGroupHost {
  readonly order = new FormGroup({
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    delivery: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

@Component({
  selector: 'ave-group-plain',
  imports: [AveCheckbox, AveChoice, AveChoiceGroup, AveError],
  template: `
    <fieldset aveChoiceGroup legend="Archived">
      <label aveChoice><input type="checkbox" aveCheckbox disabled /> Keep the drafts</label>
      <label aveChoice><input type="checkbox" aveCheckbox disabled /> Keep the comments</label>
      <p aveError>The archive is read-only.</p>
    </fieldset>
    <fieldset aveChoiceGroup legend="Empty" disabled></fieldset>
    <fieldset aveChoiceGroup legend="Before sending">
      <label aveChoice><input type="checkbox" aveCheckbox /> Notify the counterparty</label>
      <label aveChoice><input type="checkbox" aveCheckbox required /> I confirm the data</label>
    </fieldset>
    <fieldset aveChoiceGroup legend="Confirm">
      <label aveChoice><input type="checkbox" aveCheckbox required /> I confirm the data</label>
    </fieldset>
  `,
})
class PlainGroupHost {}

const used = [
  'space.1',
  'space.2',
  'font.label-md',
  'font.body-md',
  'font.body-sm',
  'size.icon.sm',
  'size.target.min',
  'color.fg.default',
  'color.fg.disabled',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
});

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

describe('AveChoiceGroup', () => {
  it('makes radios a radiogroup named by its legend: required, described by its hint, and its error once touched', async () => {
    const { fixture, element } = mount(RadioGroupHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const group = await loader.getHarness(AveChoiceGroupHarness.with({ legend: 'Delivery' }));
    const fieldset = element.querySelector('fieldset');
    expect(await group.getRole()).toBe('radiogroup');
    expect(fieldset?.getAttribute('aria-labelledby')).toBe(element.querySelector('legend')?.id);
    expect(await group.isRequired()).toBe(true);
    expect(fieldset?.getAttribute('aria-required')).toBe('true');
    expect(await group.getHint()).toBe('Pickup is free.');
    expect(await group.getError()).toBeNull();
    expect(await group.getDescribedBy()).toEqual([element.querySelector('[aveHint]')?.id]);

    const [courier] = await group.getAllHarnesses(AveRadioHarness);
    await courier?.focus();
    await courier?.blur();
    expect(await group.getError()).toBe('Choose how to deliver the order.');
    expect(fieldset?.getAttribute('aria-invalid')).toBe('true');
    expect(await group.getDescribedBy()).toHaveLength(2);
    // The radios keep no id and no description of their own: the group carries both.
    expect(
      [...element.querySelectorAll('input')].map((radio) => radio.id + (radio.getAttribute('aria-describedby') ?? '')),
    ).toEqual(['', '']);

    await courier?.check();
    expect(await group.getError()).toBeNull();
    expect(fieldset?.hasAttribute('aria-invalid')).toBe(false);
  });

  it('keeps checkboxes a plain group, and shows a group error once a checkbox is touched', async () => {
    const { fixture, element } = mount(CheckboxGroupHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const group = await loader.getHarness(AveChoiceGroupHarness);
    expect(await group.getRole()).toBeNull();
    expect(await group.isRequired()).toBe(false);
    expect(await group.getHint()).toBeNull();
    expect(await group.getDescribedBy()).toEqual(['own-note']);
    expect(await group.getError()).toBeNull();
    const [email] = await group.getAllHarnesses(AveCheckboxHarness);
    await email?.blur();
    expect(await group.getError()).toBe('Choose at least one way to notify.');
    expect(await group.getDescribedBy()).toEqual(['own-note', element.querySelector('[aveError]')?.id]);
    await email?.check();
    expect(await group.getError()).toBeNull();
  });

  it('says required for Reactive Forms radios on the group, where ARIA allows it', async () => {
    const { fixture, element } = mount(ReactiveGroupHost);
    const group = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveChoiceGroupHarness);
    await fixture.whenStable();
    expect(await group.isRequired()).toBe(true);
    expect(element.querySelector('fieldset')?.getAttribute('aria-required')).toBe('true');
    expect(element.querySelector('input[aria-required]')).toBeNull();
  });

  it('shows an unbound error at once and dims the legend of disabled choices and of a disabled fieldset', async () => {
    const { fixture, element } = mount(PlainGroupHost);
    const [archived, empty, mixed, confirm] =
      await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveChoiceGroupHarness);
    // The asterisk only when every choice is required.
    expect(await mixed?.isRequired()).toBe(false);
    expect(await confirm?.isRequired()).toBe(true);
    expect(await archived?.getError()).toBe('The archive is read-only.');
    expect(await empty?.getError()).toBeNull();
    expect(await empty?.getDescribedBy()).toEqual([]);
    const [archivedLegend, emptyLegend] = [...element.querySelectorAll('legend')];
    const disabledColour = rgb(tokens['color.fg.disabled'].css);
    expect(archivedLegend === undefined ? '' : getComputedStyle(archivedLegend).color).toBe(disabledColour);
    expect(emptyLegend === undefined ? '' : getComputedStyle(emptyLegend).color).toBe(disabledColour);
    expect(element.querySelectorAll('fieldset')[1]?.hasAttribute('data-disabled')).toBe(false);
  });

  it('puts the legend 8px above the choices, 8px between them, and the hint 4px under them', () => {
    const { element } = mount(RadioGroupHost);
    const legend = element.querySelector('legend')?.getBoundingClientRect();
    const [first, second] = [...element.querySelectorAll('label')].map((label) => label.getBoundingClientRect());
    const hint = element.querySelector('[aveHint]')?.getBoundingClientRect();
    if (legend === undefined || first === undefined || second === undefined || hint === undefined) {
      throw new Error('No parts');
    }
    expect(first.top - legend.bottom).toBe(tokens['space.2'].value);
    expect(second.top - first.bottom).toBe(tokens['space.2'].value);
    expect(hint.top - second.bottom).toBe(tokens['space.1'].value);
  });
});
