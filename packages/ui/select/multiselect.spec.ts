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
    await select.toggle('Юридический отдел');
    expect(fixture.componentInstance.chosen.value).toEqual(['security']);
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
