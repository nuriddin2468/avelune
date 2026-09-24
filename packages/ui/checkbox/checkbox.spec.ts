import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveCheckboxHarness } from '@avelune/ui/checkbox/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-checkbox-signal',
  imports: [AveCheckbox, AveChoice, FormField],
  template: `
    <label aveChoice
      ><input type="checkbox" aveCheckbox [formField]="terms.accept" /> I confirm the data is correct</label
    >
    <label aveChoice><input type="checkbox" aveCheckbox [formField]="terms.notify" /> Notify the counterparty</label>
  `,
})
class SignalHost {
  readonly model = signal({ accept: false, notify: true, locked: false });
  // `context.valueOf`, not a destructured `valueOf`: angular-eslint 22.5's reactive-context-must-read-signal looks call
  // names up in a plain object and crashes on Object.prototype.valueOf.
  readonly terms = form(this.model, (path) => {
    required(path.accept);
    disabled(path.notify, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-checkbox-reactive',
  imports: [AveCheckbox, AveChoice, ReactiveFormsModule],
  template: `
    <label aveChoice><input type="checkbox" aveCheckbox [formControl]="accept" /> I accept the terms</label>
    <input type="checkbox" aveCheckbox aria-label="Select all rows" [(indeterminate)]="mixed" />
  `,
})
class ReactiveHost {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly accept = new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] });
  readonly mixed = signal(true);
}

@Component({
  selector: 'ave-checkbox-plain',
  imports: [AveCheckbox, AveChoice],
  template: `
    <label aveChoice>
      <input type="checkbox" aveCheckbox checked disabled />
      Архивировать документы старше трёх лет вместе с приложениями и листами согласования
    </label>
  `,
})
class PlainHost {}

const used = [
  'size.icon.sm',
  'size.target.min',
  'space.1',
  'space.2',
  'border-width.default',
  'border-width.selected',
  'radius.sm',
  'font.body-md',
  'color.border.strong',
  'color.accent.bg',
  'color.fg.on-accent',
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

describe('AveCheckbox', () => {
  it('draws a 16px box with a 3:1 border, filled with the accent and ticked when checked', async () => {
    const { fixture, element } = mount(SignalHost);
    await fixture.whenStable();
    const [accept, notify] = [...element.querySelectorAll('input')];
    if (accept === undefined || notify === undefined) throw new Error('No checkboxes');
    const box = accept.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([tokens['size.icon.sm'].value, tokens['size.icon.sm'].value]);
    expect(getComputedStyle(accept).borderTopColor).toBe(rgb(tokens['color.border.strong'].css));
    expect(getComputedStyle(accept, '::before').opacity).toBe('0');
    expect(getComputedStyle(notify).backgroundColor).toBe(rgb(tokens['color.accent.bg'].css));
    expect(getComputedStyle(notify, '::before').opacity).toBe('1');
    expect(getComputedStyle(notify, '::before').backgroundColor).toBe(rgb(tokens['color.fg.on-accent'].css));
  });

  it('binds a Signal Forms boolean: toggles it, requires it, disables it', async () => {
    const { fixture } = mount(SignalHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const accept = await loader.getHarness(AveCheckboxHarness.with({ label: 'I confirm the data is correct' }));
    const notify = await loader.getHarness(AveCheckboxHarness.with({ label: /counterparty/ }));
    expect(await accept.isChecked()).toBe(false);
    expect(await accept.isRequired()).toBe(true);
    expect(await notify.isChecked()).toBe(true);
    await accept.blur();
    expect(await accept.isInvalid()).toBe(true);
    await accept.check();
    expect(fixture.componentInstance.model().accept).toBe(true);
    expect(await accept.isInvalid()).toBe(false);
    await notify.uncheck();
    expect(fixture.componentInstance.model().notify).toBe(false);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await notify.isDisabled()).toBe(true);
    expect(await loader.getAllHarnesses(AveCheckboxHarness.with({ checked: true }))).toHaveLength(1);
  });

  it('toggles with the label and with Space, as a native checkbox does', async () => {
    const { fixture, element } = mount(SignalHost);
    const label = element.querySelector('label');
    label?.click();
    expect(fixture.componentInstance.model().accept).toBe(true);
    element.querySelector('input')?.focus();
    await userEvent.keyboard(' ');
    expect(fixture.componentInstance.model().accept).toBe(false);
  });

  it('binds a Reactive Forms control with Validators.requiredTrue', async () => {
    const { fixture, element } = mount(ReactiveHost);
    await fixture.whenStable();
    const accept = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveCheckboxHarness.with({ label: /terms/ }),
    );
    expect(await accept.isRequired()).toBe(true);
    expect(element.querySelector('input')?.getAttribute('aria-required')).toBe('true');
    fixture.componentInstance.accept.markAsTouched();
    expect(await accept.isInvalid()).toBe(true);
    await accept.toggle();
    expect(fixture.componentInstance.accept.value).toBe(true);
    expect(await accept.isInvalid()).toBe(false);
  });

  it('shows the mixed state, and clears it with a click through its model', async () => {
    const { fixture } = mount(ReactiveHost);
    const all = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveCheckboxHarness.with({ label: 'Select all rows' }),
    );
    expect(await all.isIndeterminate()).toBe(true);
    const host = await all.host();
    expect(await host.getCssValue('background-color')).toBe(rgb(tokens['color.accent.bg'].css));
    await all.toggle();
    expect(await all.isIndeterminate()).toBe(false);
    expect(fixture.componentInstance.mixed()).toBe(false);
    expect(await all.isChecked()).toBe(true);
  });

  it('keeps the box on the middle of the first line of a long label, and the label 24px or taller', async () => {
    const { element, fixture } = mount(PlainHost);
    element.style.display = 'block';
    element.style.inlineSize = '240px';
    fixture.detectChanges();
    await fixture.whenStable();
    const label = element.querySelector('label');
    const input = element.querySelector('input');
    if (label === null || input === null) throw new Error('No label');
    const labelBox = label.getBoundingClientRect();
    const inputBox = input.getBoundingClientRect();
    expect(labelBox.height).toBeGreaterThan(tokens['size.target.min'].value);
    // Padding 2px, then a 20px line whose middle is the box's middle.
    expect(inputBox.top - labelBox.top).toBe(4);
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveCheckboxHarness);
    expect(await harness.getLabel()).toMatch(/^Архивировать документы/);
    expect(await harness.isDisabled()).toBe(true);
    expect(await harness.isRequired()).toBe(false);
  });

  it('reports no label for a checkbox without one', async () => {
    @Component({
      selector: 'ave-checkbox-bare',
      imports: [AveCheckbox],
      template: '<input type="checkbox" aveCheckbox />',
    })
    class Bare {}
    const { fixture } = mount(Bare);
    const bare = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveCheckboxHarness);
    expect(await bare.getLabel()).toBe('');
    await bare.uncheck();
    expect(await bare.isChecked()).toBe(false);
  });
});
