import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { AveCombobox, type AveOption } from '@avelune/ui/select';
import { AveComboboxHarness } from '@avelune/ui/select/testing';
import { describe, expect, it } from 'vitest';

const counterparties: readonly AveOption<number>[] = [
  { value: 1, label: 'ООО «Альфа Технологии»' },
  { value: 2, label: 'Oʻzbekiston temir yoʻllari' },
  { value: 3, label: 'АО «Узбекнефтегаз»' },
  { value: 4, label: 'ООО «Бета Логистик»', disabled: true },
];

@Component({
  selector: 'ave-combobox-signal',
  imports: [AveCombobox, FormField],
  template: `<ave-combobox label="Counterparty" [options]="counterparties" [formField]="contract.counterparty" />`,
})
class SignalHost {
  readonly counterparties = counterparties;
  readonly model = signal<{ counterparty: number | null; locked: boolean }>({ counterparty: null, locked: false });
  // `context.valueOf`: see the angular-eslint note in the input specs.
  readonly contract = form(this.model, (path) => {
    required(path.counterparty);
    disabled(path.counterparty, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-combobox-reactive',
  imports: [AveCombobox, ReactiveFormsModule],
  template: `
    <ave-combobox
      label="Counterparty"
      placeholder="Start typing"
      [options]="counterparties"
      [formControl]="counterparty"
    />
    <ave-combobox label="Frozen" [options]="counterparties" readonly />
  `,
})
class ReactiveHost {
  readonly counterparties = counterparties;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly counterparty = new FormControl<number | null>(3, { validators: [Validators.required] });
}

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

describe('AveCombobox', () => {
  it('filters the options as people type, matching every Uzbek apostrophe, and chooses one', async () => {
    const { fixture } = mount(SignalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.type("o'zbek");
    expect(await combobox.isOpen()).toBe(true);
    expect(await combobox.getOptions()).toEqual(['Oʻzbekiston temir yoʻllari']);
    await combobox.type('ооо');
    expect(await combobox.getOptions()).toEqual(['ООО «Альфа Технологии»', 'ООО «Бета Логистик»']);
    await combobox.choose('ООО «Альфа Технологии»');
    expect(fixture.componentInstance.model().counterparty).toBe(1);
    expect(await combobox.getText()).toBe('ООО «Альфа Технологии»');
    expect(await combobox.isOpen()).toBe(false);
  });

  it('says so when nothing matches, in the locale of the application', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
    const { fixture } = mount(SignalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.type('Гамма');
    expect(await combobox.getOptions()).toEqual([]);
    expect(await combobox.getEmptyMessage()).toBe('Ничего не найдено');
    await combobox.type('Альфа');
    expect(await combobox.getEmptyMessage()).toBeNull();
  });

  it('moves with the arrow keys and chooses with Enter', async () => {
    const { fixture } = mount(SignalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.type('А');
    await combobox.press('down');
    await combobox.press('enter');
    expect(fixture.componentInstance.model().counterparty).not.toBeNull();
    expect(await combobox.isOpen()).toBe(false);
  });

  it('puts back text that matches no option, and clears the value when emptied', async () => {
    const { fixture } = mount(ReactiveHost);
    const [combobox] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveComboboxHarness);
    if (combobox === undefined) throw new Error('No combobox');
    expect(await combobox.getText()).toBe('АО «Узбекнефтегаз»');
    await combobox.focus();
    await combobox.type('Узбек');
    await combobox.press('escape');
    await combobox.blur();
    expect(await combobox.getText()).toBe('АО «Узбекнефтегаз»');
    expect(fixture.componentInstance.counterparty.touched).toBe(true);
    await combobox.focus();
    await combobox.type('');
    await combobox.blur();
    expect(fixture.componentInstance.counterparty.value).toBeNull();
    expect(await combobox.isInvalid()).toBe(true);
    await expect(combobox.choose('Гамма')).rejects.toThrow('no shown option matches Гамма');
  });

  it('keeps its text while focus moves into its own list, and marks a Signal Forms field touched on leaving', async () => {
    const { fixture, element } = mount(SignalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    expect(await combobox.getOptions()).toEqual([]);
    expect(await combobox.getEmptyMessage()).toBeNull();
    await combobox.focus();
    await combobox.type('Альфа');
    // A pointer on an option focuses it (tabindex -1): the input keeps what was typed.
    const option = document.querySelector<HTMLElement>('[role="option"]');
    option?.focus();
    expect(await combobox.getText()).toBe('Альфа');
    expect(fixture.componentInstance.contract.counterparty().touched()).toBe(false);
    element.querySelector('input')?.focus();
    await combobox.blur();
    expect(await combobox.getText()).toBe('');
    expect(fixture.componentInstance.contract.counterparty().touched()).toBe(true);
  });

  it('keeps focus in the input when an option is pressed', async () => {
    const { fixture } = mount(SignalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.type('А');
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    document.querySelector('[role="option"]')?.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
  });

  it('is required, disabled and readonly from its bindings and attributes', async () => {
    const { fixture } = mount(SignalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    expect(await combobox.isRequired()).toBe(true);
    fixture.componentInstance.model.update((model) => ({ ...model, counterparty: 2 }));
    expect(await combobox.getText()).toBe('Oʻzbekiston temir yoʻllari');
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await combobox.isDisabled()).toBe(true);
    const { fixture: reactive } = mount(ReactiveHost);
    const loader = TestbedHarnessEnvironment.loader(reactive);
    expect(await (await loader.getHarness(AveComboboxHarness.with({ text: '' }))).isReadonly()).toBe(true);
    reactive.componentInstance.counterparty.disable();
    expect(await (await loader.getHarness(AveComboboxHarness.with({ text: /Узбекнефтегаз/ }))).isDisabled()).toBe(true);
  });
});
