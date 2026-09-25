import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveChoice } from '@avelune/ui/checkbox';
import { AVE_FIELD, type AveControlState, type AveFieldContext } from '@avelune/ui/forms';
import { AveRadio } from '@avelune/ui/radio';
import { AveRadioHarness } from '@avelune/ui/radio/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-radio-signal',
  imports: [AveChoice, AveRadio, FormField],
  template: `
    <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
    <label aveChoice><input type="radio" aveRadio value="pickup" [formField]="order.delivery" /> Pickup</label>
  `,
})
class SignalHost {
  readonly model = signal({ delivery: '', locked: false });
  // `context.valueOf`, not a destructured `valueOf`: angular-eslint 22.5's reactive-context-must-read-signal looks call
  // names up in a plain object and crashes on Object.prototype.valueOf.
  readonly order = form(this.model, (path) => {
    required(path.delivery);
    disabled(path.delivery, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-radio-reactive',
  imports: [AveChoice, AveRadio, ReactiveFormsModule],
  template: `
    <div [formGroup]="order">
      <label aveChoice><input type="radio" aveRadio value="courier" formControlName="delivery" /> Courier</label>
      <label aveChoice><input type="radio" aveRadio value="pickup" formControlName="delivery" /> Pickup</label>
    </div>
  `,
})
class ReactiveHost {
  readonly order = new FormGroup({
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    delivery: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

@Component({
  selector: 'ave-radio-plain',
  imports: [AveChoice, AveRadio],
  template: `
    <label aveChoice><input type="radio" aveRadio name="plain" value="a" checked /> Checked</label>
    <label aveChoice><input type="radio" aveRadio name="plain" value="b" aria-invalid="true" /> Invalid</label>
    <input type="radio" aveRadio name="plain" value="c" aria-label="Disabled" disabled />
    <input type="radio" aveRadio name="plain" value="d" />
  `,
})
class PlainHost {}

/** A stand-in for a group of choices: it gives its controls no id and no description. */
class FakeGroup implements AveFieldContext {
  readonly defaultId = null;
  readonly describedBy = signal<readonly string[]>([]);
  readonly registered: { control: HTMLElement; state: AveControlState }[] = [];

  register(control: HTMLElement, state: AveControlState): void {
    this.registered.push({ control, state });
  }
}

@Component({
  selector: 'ave-radio-in-group',
  imports: [AveRadio],
  template: `<input type="radio" aveRadio name="grouped" value="a" aria-label="Grouped" />`,
})
class InGroup {}

const used = [
  'size.icon.sm',
  'space.1',
  'border-width.default',
  'radius.full',
  'color.border.strong',
  'color.accent.bg',
  'color.danger.border',
  'color.bg.surface',
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

describe('AveRadio', () => {
  it('draws a 16px circle with a 3:1 border, filled with the accent and a dot when checked', () => {
    const { element } = mount(PlainHost);
    const [checked, invalid] = [...element.querySelectorAll('input')];
    if (checked === undefined || invalid === undefined) throw new Error('No radios');
    const box = invalid.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([16, 16]);
    expect(getComputedStyle(invalid).borderTopColor).toBe(rgb(tokens['color.danger.border'].css));
    expect(getComputedStyle(checked).backgroundColor).toBe(rgb(tokens['color.accent.bg'].css));
    expect(getComputedStyle(checked, '::before').opacity).toBe('1');
    expect(getComputedStyle(invalid, '::before').opacity).toBe('0');
  });

  it('binds a Signal Forms field: the value of the checked radio, required, invalid once touched, disabled', async () => {
    const { fixture } = mount(SignalHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const [courier, pickup] = await loader.getAllHarnesses(AveRadioHarness);
    if (courier === undefined || pickup === undefined) throw new Error('No radios');
    expect(await courier.isRequired()).toBe(true);
    expect(await courier.getName()).toBe(await pickup.getName());
    await courier.focus();
    await courier.blur();
    expect(await courier.isInvalid()).toBe(true);
    await pickup.check();
    expect(fixture.componentInstance.model().delivery).toBe('pickup');
    expect(await pickup.isInvalid()).toBe(false);
    fixture.componentInstance.model.update((model) => ({ ...model, delivery: 'courier' }));
    expect(await courier.isChecked()).toBe(true);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await pickup.isDisabled()).toBe(true);
  });

  it('binds a Reactive Forms control, and never writes aria-required on a radio', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const courier = await loader.getHarness(AveRadioHarness.with({ value: 'courier' }));
    expect(await courier.isInvalid()).toBe(false);
    fixture.componentInstance.order.markAllAsTouched();
    expect(await courier.isInvalid()).toBe(true);
    await courier.check();
    expect(fixture.componentInstance.order.value.delivery).toBe('courier');
    expect(await courier.isInvalid()).toBe(false);
    expect(element.querySelector('[aria-required]')).toBeNull();
  });

  it("leaves an unbound radio's ARIA to the application", async () => {
    const { fixture } = mount(PlainHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const checked = await loader.getHarness(AveRadioHarness.with({ checked: true }));
    expect(await checked.getLabel()).toBe('Checked');
    expect(await (await loader.getHarness(AveRadioHarness.with({ label: 'Invalid' }))).isInvalid()).toBe(true);
    const disabled = await loader.getHarness(AveRadioHarness.with({ label: 'Disabled' }));
    expect(await disabled.isDisabled()).toBe(true);
    expect(await disabled.isRequired()).toBe(false);
    // Without a label or an aria-label, nothing names it (axe reports that in the stories).
    expect(await (await loader.getHarness(AveRadioHarness.with({ value: 'd' }))).getLabel()).toBe('');
  });

  it('keeps no id in a group of choices, and registers itself with the group', () => {
    const group = new FakeGroup();
    TestBed.configureTestingModule({ providers: [{ provide: AVE_FIELD, useValue: group }] });
    const { element } = mount(InGroup);
    const radio = element.querySelector('input');
    expect(radio?.id).toBe('');
    expect(radio?.hasAttribute('aria-describedby')).toBe(false);
    expect(group.registered.map(({ control }) => control)).toEqual([radio]);
    expect(group.registered[0]?.state.bound).toBe(false);
  });
});
