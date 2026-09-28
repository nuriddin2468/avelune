import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { AveCombobox, type AveOption } from '@avelune/ui/select';
import { AveComboboxHarness } from '@avelune/ui/select/testing';
import { countries } from './fixtures/rich';
import { tokens, type TokenName } from '@avelune/tokens';
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

@Component({
  selector: 'ave-combobox-optional',
  imports: [AveCombobox],
  template: `<ave-combobox label="Payer" [options]="counterparties" [(value)]="payer" />`,
})
class OptionalHost {
  readonly counterparties = counterparties;
  readonly payer = signal<number | null>(1);
}

/** Border-box sizing, as the kit's reset gives every page (the global stylesheet is not loaded here). */
@Component({
  selector: 'ave-combobox-server',
  imports: [AveCombobox],
  template: `
    <ave-combobox
      label="Counterparty"
      search="server"
      [options]="page()"
      [loading]="loading()"
      [error]="failed()"
      [hasMore]="more()"
      [chosenOptions]="saved"
      [(value)]="counterparty"
      (query)="asked.push($event)"
      (loadMore)="nextPage()"
    />
  `,
})
class ServerHost {
  readonly page = signal<readonly AveOption<number>[]>([]);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly more = signal(false);
  readonly saved: readonly AveOption<number>[] = [{ value: 99, label: 'АО «Сохранённый контрагент»' }];
  readonly counterparty = signal<number | null>(99);
  readonly asked: string[] = [];
  pages = 0;

  /** As an application does: counts the request and marks the list loading. */
  nextPage(): void {
    this.pages++;
    this.loading.set(true);
  }
}

/** Thirty counterparties from the server, from a number. */
function serverPage(from: number): AveOption<number>[] {
  return Array.from({ length: 30 }, (_, index) => ({
    value: from + index,
    label: `Контрагент ${String(from + index)}`,
  }));
}

/**
 * Every token, as the kit's stylesheet gives them, with the timings the server's list reads (ADR 0056): a short
 * search delay and an immediate spinner. The list then has its height and scrolls.
 */
function withTimings(set: boolean): void {
  const root = document.documentElement.style;
  for (const token of Object.values(tokens)) {
    if (set) root.setProperty(token.cssVar, token.css);
    else root.removeProperty(token.cssVar);
  }
  withReset(set);
  const timings = [
    ['--ave-timing-search-delay', '200ms'],
    ['--ave-timing-spinner-delay', '0ms'],
    ['--ave-timing-spinner-min-visible', '0ms'],
  ] as const;
  for (const [name, value] of timings) {
    if (set) root.setProperty(name, value);
    else root.removeProperty(name);
  }
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function withReset(set: boolean): void {
  const id = 'ave-spec-reset';
  document.getElementById(id)?.remove();
  if (!set) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = '*, ::before, ::after { box-sizing: border-box; }';
  document.head.append(style);
}

@Component({
  selector: 'ave-combobox-rich',
  imports: [AveCombobox],
  template: `<ave-combobox label="Country" [options]="countries" value="kz" />`,
})
class RichHost {
  readonly countries = countries;
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
    expect(await combobox.getOptionDescriptions()).toEqual([null, null]);
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

  it('clears an optional value with its button, empties the input and keeps focus in it (ADR 0052)', async () => {
    const used = [
      'control.height.md',
      'control.padding-inline.md',
      'border-width.default',
      'space.1',
      'space.2',
      'size.icon.sm',
      'font.body-md',
    ] as const satisfies readonly TokenName[];
    const root = document.documentElement;
    for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
    withReset(true);
    const { fixture, element } = mount(OptionalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    expect(await combobox.canClear()).toBe(true);
    const input = element.querySelector('input');
    const clear = element.querySelector('.clear');
    if (input === null || clear === null) throw new Error('No parts');
    // The button is 4px inside the input's end; the text stops 4px before it.
    const box = input.getBoundingClientRect();
    const textEnd = box.right - Number.parseFloat(getComputedStyle(input).paddingInlineEnd);
    expect(box.right - clear.getBoundingClientRect().right).toBe(4);
    expect(clear.getBoundingClientRect().left - textEnd).toBe(4);
    await combobox.clear();
    expect(fixture.componentInstance.payer()).toBeNull();
    expect(await combobox.getText()).toBe('');
    expect(await combobox.canClear()).toBe(false);
    expect(document.activeElement).toBe(input);
    const { fixture: required } = mount(ReactiveHost);
    const [needed, frozen] = await TestbedHarnessEnvironment.loader(required).getAllHarnesses(AveComboboxHarness);
    expect(await needed?.canClear()).toBe(false);
    expect(await frozen?.canClear()).toBe(false);
    await expect(needed?.clear()).rejects.toThrow('shows no clear button');
    for (const name of used) root.style.removeProperty(tokens[name].cssVar);
    withReset(false);
  });

  it('keeps the value when the chosen option is chosen again', async () => {
    const { fixture } = mount(OptionalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.press('down');
    await combobox.choose('ООО «Альфа Технологии»');
    expect(fixture.componentInstance.payer()).toBe(1);
    expect(await combobox.getText()).toBe('ООО «Альфа Технологии»');
    await combobox.press('down');
    const chosen = document.querySelector('[role="option"][aria-selected="true"]');
    expect(chosen?.textContent.trim()).toBe('ООО «Альфа Технологии»');
  });

  it('searches rich options by their label only, and holds the chosen label as text (ADR 0055)', async () => {
    const { fixture } = mount(RichHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    expect(await combobox.getText()).toBe('Казахстан');
    await combobox.focus();
    await combobox.type('Таш');
    expect(await combobox.getOptions()).toEqual([]);
    await combobox.type('кир');
    expect(await combobox.getOptions()).toEqual(['Киргизия']);
    expect(await combobox.getOptionDescriptions()).toEqual(['Бишкек KG']);
  });

  it('keeps the value and what is typed while the search hides the chosen option', async () => {
    const { fixture } = mount(OptionalHost);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.type('Узбек');
    expect(await combobox.getText()).toBe('Узбек');
    expect(await combobox.getOptions()).toEqual(['АО «Узбекнефтегаз»']);
    expect(fixture.componentInstance.payer()).toBe(1);
    await combobox.type('Альфа');
    const chosen = document.querySelector('[role="option"][aria-selected="true"]');
    expect(chosen?.getAttribute('aria-label')).toBe('ООО «Альфа Технологии»');
    await combobox.type('Узбек');
    await combobox.blur();
    expect(await combobox.getText()).toBe('ООО «Альфа Технологии»');
    expect(fixture.componentInstance.payer()).toBe(1);
  });

  it('asks a server when its list opens and once typing pauses, and names a saved value (ADR 0056)', async () => {
    withTimings(true);
    const { fixture } = mount(ServerHost);
    const host = fixture.componentInstance;
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    expect(await combobox.getText()).toBe('АО «Сохранённый контрагент»');
    await combobox.focus();
    await combobox.press('down');
    expect(host.asked).toEqual(['']);
    host.page.set(serverPage(1));
    await combobox.type('Контр');
    expect(host.asked).toEqual(['']);
    await pause(250);
    expect(host.asked).toEqual(['', 'Контр']);
    // The server's page does not hold the chosen value: it stays, and so does the typed text.
    host.page.set(serverPage(100));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await combobox.getText()).toBe('Контр');
    expect(host.counterparty()).toBe(99);
    expect(await combobox.getOptions()).toHaveLength(30);
    await combobox.choose('Контрагент 105');
    expect(host.counterparty()).toBe(105);
    host.page.set(serverPage(1));
    fixture.detectChanges();
    expect(await combobox.getText()).toBe('Контрагент 105');
    withTimings(false);
  });

  it('shows loading, a failure with a retry, and no results, and says what came of a request', async () => {
    withTimings(true);
    const { fixture } = mount(ServerHost);
    const host = fixture.componentInstance;
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.press('down');
    host.loading.set(true);
    fixture.detectChanges();
    await expect.poll(() => combobox.getListState()).toBe('loading');
    host.loading.set(false);
    host.failed.set(true);
    fixture.detectChanges();
    expect(await combobox.getListState()).toBe('failed');
    const live = () => document.querySelector('.cdk-live-announcer-element')?.textContent ?? '';
    await expect.poll(live).toBe('The list did not load. Press Enter to try again.');
    await combobox.retry();
    expect(host.asked).toEqual(['', '']);
    await combobox.press('enter');
    expect(host.asked).toEqual(['', '', '']);
    host.failed.set(false);
    host.loading.set(true);
    fixture.detectChanges();
    host.loading.set(false);
    fixture.detectChanges();
    expect(await combobox.getListState()).toBe('empty');
    await expect.poll(live).toBe('No results');
    host.loading.set(true);
    fixture.detectChanges();
    host.page.set(serverPage(1));
    host.loading.set(false);
    fixture.detectChanges();
    await expect.poll(live).toBe('Options: 30');
    expect(await combobox.getListState()).toBeNull();
    withTimings(false);
  });

  it('asks for the next page at the end of the list and on Down from its last option', async () => {
    withTimings(true);
    const { fixture } = mount(ServerHost);
    const host = fixture.componentInstance;
    host.page.set(serverPage(1));
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.press('down');
    const active = () => document.querySelector('[role="option"][data-active="true"]')?.getAttribute('aria-label');
    // Without more, End goes to the last option and nothing is asked.
    await combobox.scrollToEnd();
    expect(active()).toBe('Контрагент 30');
    expect(host.pages).toBe(0);
    // Down on the last option asks for the next page and does not wrap; the keyboard goes on to its first option.
    host.more.set(true);
    fixture.detectChanges();
    await combobox.press('down');
    expect(host.pages).toBe(1);
    expect(active()).toBe('Контрагент 30');
    await combobox.press('down');
    expect(host.pages).toBe(1);
    host.page.set([...serverPage(1), ...serverPage(31)]);
    host.loading.set(false);
    fixture.detectChanges();
    await expect.poll(active).toBe('Контрагент 31');
    // Scrolling to the end asks for the page after; without more, nothing.
    await combobox.scrollToEnd();
    await expect.poll(() => host.pages).toBe(2);
    host.page.set([...serverPage(1), ...serverPage(31), ...serverPage(61)]);
    host.loading.set(false);
    host.more.set(false);
    fixture.detectChanges();
    await combobox.scrollToEnd();
    await combobox.press('down');
    expect(host.pages).toBe(2);
    expect(active()).toBe('Контрагент 1');
    withTimings(false);
  });

  it('asks nothing again for the same text, says nothing while closed, and retries only what it asked', async () => {
    withTimings(true);
    const { fixture, element } = mount(ServerHost);
    const host = fixture.componentInstance;
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    // An error before anything was asked: Enter and the button have nothing to send again.
    host.failed.set(true);
    fixture.detectChanges();
    await combobox.focus();
    await combobox.press('enter');
    expect(host.asked).toEqual([]);
    host.failed.set(false);
    fixture.detectChanges();
    await expect(combobox.retry()).rejects.toThrow('offers no retry');
    await combobox.press('down');
    expect(host.asked).toEqual(['']);
    // An empty list that scrolls asks for nothing.
    document.querySelector('.listbox')?.dispatchEvent(new Event('scroll'));
    expect(host.pages).toBe(0);
    await combobox.press('escape');
    await combobox.press('down');
    expect(host.asked).toEqual(['']);
    await combobox.press('escape');
    // A request that ends while the list is closed is not announced.
    host.loading.set(true);
    fixture.detectChanges();
    const live = () => document.querySelector('.cdk-live-announcer-element')?.textContent ?? '';
    const before = live();
    host.loading.set(false);
    fixture.detectChanges();
    await pause(150);
    expect(live()).toBe(before);
    expect(element.querySelector('input')?.value).toBe('АО «Сохранённый контрагент»');
    withTimings(false);
  });

  it('asks for the next page itself while its options do not fill the list', async () => {
    withTimings(true);
    const { fixture } = mount(ServerHost);
    const host = fixture.componentInstance;
    host.page.set(serverPage(1).slice(0, 3));
    host.more.set(true);
    const combobox = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveComboboxHarness);
    await combobox.focus();
    await combobox.press('down');
    await expect.poll(() => host.pages).toBe(1);
    withTimings(false);
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
