import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, minLength } from '@angular/forms/signals';
import { AveMultiselect, type AveOption } from '@avelune/ui/select';
import { AveMultiselectHarness } from '@avelune/ui/select/testing';
import { AveOptionTemplate } from '@avelune/ui/select';
import { employees } from './fixtures/rich';
import { describe, expect, it } from 'vitest';

const approvers: readonly AveOption<string>[] = [
  { value: 'legal', label: 'Юридический отдел' },
  { value: 'finance', label: 'Финансовый отдел' },
  { value: 'security', label: 'Служба безопасности' },
];

@Component({
  selector: 'ave-multiselect-signal',
  imports: [AveMultiselect, FormField],
  template: `<ave-multiselect
    label="Approvers"
    placeholder="Choose approvers"
    [options]="approvers"
    [formField]="contract.approvers"
  />`,
})
class SignalHost {
  readonly approvers = approvers;
  readonly model = signal<{ approvers: string[] }>({ approvers: [] });
  readonly contract = form(this.model, (path) => {
    minLength(path.approvers, 1);
  });
}

@Component({
  selector: 'ave-multiselect-reactive',
  imports: [AveMultiselect, ReactiveFormsModule],
  template: `<ave-multiselect label="Approvers" [options]="approvers" [formControl]="chosen" />`,
})
class ReactiveHost {
  approvers = approvers;
  readonly chosen = new FormControl<string[] | null>(['security']);
}

@Component({
  selector: 'ave-multiselect-rich',
  imports: [AveMultiselect, AveOptionTemplate],
  template: `
    <ave-multiselect label="People" [options]="employees" [value]="[1, 3]" />
    <ave-multiselect label="Drawn" [options]="employees">
      <ng-template aveOption [aveOptionOf]="employees" let-option
        ><b class="drawn">{{ option.value }}</b></ng-template
      >
    </ave-multiselect>
  `,
})
class RichHost {
  readonly employees = employees;
}

@Component({
  selector: 'ave-multiselect-chosen',
  imports: [AveMultiselect],
  template: `<ave-multiselect
    label="Approvers"
    [options]="approvers"
    [chosenOptions]="saved"
    [value]="['accounting', 'legal']"
  />`,
})
class ChosenHost {
  readonly approvers = approvers;
  readonly saved: readonly AveOption<string>[] = [{ value: 'accounting', label: 'Бухгалтерия (архив)' }];
}

const regions: readonly AveOption<string>[] = [
  { value: 'tashkent', label: 'Ташкент' },
  { value: 'samarkand', label: 'Самаркандская область' },
  { value: 'bukhara', label: 'Бухарская область' },
  { value: 'fergana', label: 'Fargʻona viloyati' },
  { value: 'andijan', label: 'Андижанская область' },
];

@Component({
  selector: 'ave-multiselect-search',
  imports: [AveMultiselect],
  template: `<ave-multiselect
    label="Regions"
    search="local"
    placeholder="Регион"
    [options]="regions"
    [(value)]="chosen"
  />`,
})
class SearchHost {
  readonly regions = regions;
  readonly chosen = signal<string[]>(['tashkent']);
}

@Component({
  selector: 'ave-multiselect-server',
  imports: [AveMultiselect],
  template: `
    <ave-multiselect
      label="Counterparties"
      search="server"
      [options]="page()"
      [loading]="loading()"
      [error]="failed()"
      [hasMore]="more()"
      [(value)]="chosen"
      (query)="asked.push($event)"
      (loadMore)="pages = pages + 1"
    />
  `,
})
class ServerHost {
  readonly page = signal<readonly AveOption<number>[]>([]);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly more = signal(false);
  readonly chosen = signal<number[]>([]);
  readonly asked: string[] = [];
  pages = 0;
}

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

describe('AveMultiselect', () => {
  it('toggles options while the list stays open, in the order of the list, and names them in the trigger', async () => {
    const { fixture } = mount(SignalHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveMultiselectHarness.with({ text: 'Choose approvers' }),
    );
    expect(await select.isEmpty()).toBe(true);
    expect(await select.isRequired()).toBe(true);
    await select.toggle('Служба безопасности');
    await select.toggle('Юридический отдел');
    expect(await select.isOpen()).toBe(true);
    expect(fixture.componentInstance.model().approvers).toEqual(['legal', 'security']);
    expect(await select.getChosen()).toEqual(['Юридический отдел', 'Служба безопасности']);
    await select.close();
    expect(await select.getText()).toBe('Юридический отдел, Служба безопасности');
    await select.toggle('Юридический отдел');
    expect(fixture.componentInstance.model().approvers).toEqual(['security']);
  });

  it('needs one option chosen with minLength(path, 1), and says so as required', async () => {
    const { fixture } = mount(SignalHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    expect(fixture.componentInstance.contract.approvers().invalid()).toBe(true);
    expect(await select.isRequired()).toBe(true);
    await select.toggle('Юридический отдел');
    expect(fixture.componentInstance.contract.approvers().invalid()).toBe(false);
  });

  it('clears every chosen option with its button or Delete, unless one is required (ADR 0052)', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    expect(await select.canClear()).toBe(true);
    const clear = element.querySelector('.clear');
    const names = (clear?.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id));
    expect(names.map((name) => name?.textContent)).toEqual(['Clear', 'Approvers']);
    await select.toggle('Финансовый отдел');
    await select.clear();
    expect(fixture.componentInstance.chosen.value).toEqual([]);
    expect(await select.isOpen()).toBe(false);
    expect(await select.isEmpty()).toBe(true);
    expect(await select.canClear()).toBe(false);
    expect(document.activeElement).toBe(element.querySelector('.trigger'));
    await select.toggle('Юридический отдел');
    await select.close();
    await select.press('backspace');
    expect(fixture.componentInstance.chosen.value).toEqual([]);
    await select.press('delete');
    expect(fixture.componentInstance.chosen.value).toEqual([]);
    const { fixture: required } = mount(SignalHost);
    const needed = await TestbedHarnessEnvironment.loader(required).getHarness(AveMultiselectHarness);
    await needed.toggle('Юридический отдел');
    expect(await needed.canClear()).toBe(false);
    await needed.close();
    await needed.press('delete');
    expect(required.componentInstance.model().approvers).toEqual(['legal']);
  });

  it('draws rich options and templates, and names the chosen labels in the trigger (ADR 0055)', async () => {
    const { fixture } = mount(RichHost);
    const [people, drawn] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveMultiselectHarness);
    if (people === undefined || drawn === undefined) throw new Error('No multiselects');
    expect(await people.getText()).toBe('Каримов Алишер, Рахимов Бахтиёр');
    expect(await people.getChosen()).toEqual(['Каримов Алишер', 'Рахимов Бахтиёр']);
    expect((await people.getOptionDescriptions())[1]).toBe('Финансовый отдел');
    await people.close();
    expect(await drawn.getOptions()).toEqual(employees.map((employee) => employee.label));
    expect([...document.querySelectorAll('.drawn')].map((cell) => cell.textContent)).toEqual(['1', '2', '3', '4']);
  });

  it('keeps the chosen values when the options change without them', async () => {
    const { fixture } = mount(ReactiveHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    await select.open();
    fixture.componentInstance.approvers = approvers.slice(0, 2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.chosen.value).toEqual(['security']);
    await select.toggle('Юридический отдел');
    expect(fixture.componentInstance.chosen.value).toEqual(['legal', 'security']);
    await select.close();
    // The hidden value is named from the choice made before the options changed.
    expect(await select.getText()).toBe('Юридический отдел, Служба безопасности');
    await select.toggle('Юридический отдел');
    expect(fixture.componentInstance.chosen.value).toEqual(['security']);
  });

  it('names chosen values the options do not hold from chosenOptions (ADR 0056)', async () => {
    const { fixture } = mount(ChosenHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    expect(await select.getText()).toBe('Юридический отдел, Бухгалтерия (архив)');
  });

  it('searches its options from an input over the same list, and keeps the chosen labels (ADR 0057)', async () => {
    const { fixture, element } = mount(SearchHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    expect(await select.isSearchable()).toBe(true);
    expect(await select.getText()).toBe('Ташкент');
    const input = element.querySelector('input');
    input?.focus();
    // Focus selects the chosen labels, so typing starts a search.
    expect([input?.selectionStart, input?.selectionEnd]).toEqual([0, 'Ташкент'.length]);
    await select.search('област');
    expect(await select.isOpen()).toBe(true);
    expect(await select.getOptions()).toEqual(['Самаркандская область', 'Бухарская область', 'Андижанская область']);
    await select.toggle('Бухарская область');
    // The search and the list stay; the choice hidden by the search stays chosen, in the order of the options.
    expect(await select.getText()).toBe('област');
    expect(await select.isOpen()).toBe(true);
    expect(fixture.componentInstance.chosen()).toEqual(['tashkent', 'bukhara']);
    await select.search("farg'ona");
    expect(await select.getOptions()).toEqual(['Fargʻona viloyati']);
    await select.press('down');
    await select.press('enter');
    expect(fixture.componentInstance.chosen()).toEqual(['tashkent', 'bukhara', 'fergana']);
    await select.close();
    expect(await select.getText()).toBe('Ташкент, Бухарская область, Fargʻona viloyati');
    // A click in the still focused input selects the chosen labels again.
    input?.setSelectionRange(3, 3);
    input?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect([input?.selectionStart, input?.selectionEnd]).toEqual([0, input?.value.length]);
    await select.search('Ташкент');
    await select.toggle('Ташкент');
    await select.blur();
    expect(await select.getText()).toBe('Бухарская область, Fargʻona viloyati');
    await select.search('');
    expect(await select.getOptions()).toHaveLength(5);
    await select.search('Нукус');
    expect(await select.getOptions()).toEqual([]);
    expect(document.querySelector('.popup .empty')?.getAttribute('role')).toBe('status');
  });

  it('asks a server from its input, and keeps the choices its pages do not hold (ADR 0056, 0057)', async () => {
    const { fixture } = mount(ServerHost);
    const host = fixture.componentInstance;
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    await select.open();
    expect(host.asked).toEqual(['']);
    host.page.set([
      { value: 1, label: 'ООО «Альфа»' },
      { value: 2, label: 'АО «Бета»' },
    ]);
    fixture.detectChanges();
    await select.toggle('ООО «Альфа»');
    host.page.set([{ value: 3, label: 'ЧП «Гамма»' }]);
    fixture.detectChanges();
    await select.toggle('ЧП «Гамма»');
    expect(host.chosen()).toEqual([3, 1]);
    await select.close();
    expect(await select.getText()).toBe('ЧП «Гамма», ООО «Альфа»');
    // A search that failed: no options, so Enter tries again; with an option active it would check it.
    host.page.set([]);
    host.failed.set(true);
    fixture.detectChanges();
    await select.open();
    expect(document.querySelector('.popup .failed')).not.toBeNull();
    await select.press('enter');
    expect(host.asked.length).toBeGreaterThan(1);
    expect(host.chosen()).toEqual([3, 1]);
    const scrolling = document.querySelector('.listbox');
    scrolling?.dispatchEvent(new Event('scroll'));
    expect(host.pages).toBe(0);
    document.querySelector<HTMLButtonElement>('.popup .failed button')?.click();
    expect(host.asked.length).toBeGreaterThan(2);
  });

  it('keeps focus on the trigger when an option is pressed', async () => {
    const { fixture } = mount(SignalHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    await select.open();
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    document.querySelector('[role="option"]')?.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
  });

  it('binds a Reactive Forms array, marks it touched, and reads null as nothing chosen', async () => {
    const { fixture } = mount(ReactiveHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMultiselectHarness);
    expect(await select.getText()).toBe('Служба безопасности');
    await select.toggle('Финансовый отдел');
    expect(fixture.componentInstance.chosen.value).toEqual(['finance', 'security']);
    await select.close();
    await select.focus();
    await select.blur();
    expect(fixture.componentInstance.chosen.touched).toBe(true);
    fixture.componentInstance.chosen.setValue(null);
    expect(await select.isEmpty()).toBe(true);
    fixture.componentInstance.chosen.disable();
    expect(await select.isDisabled()).toBe(true);
  });
});
