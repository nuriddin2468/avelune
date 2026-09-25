import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, readonly, required } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AVE_FIELD, type AveControlState, type AveFieldContext } from '@avelune/ui/forms';
import { AveInput } from '@avelune/ui/input';
import { AveSelect, type AveOption, type AveSelectSize } from '@avelune/ui/select';
import { AveSelectHarness } from '@avelune/ui/select/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

type Kind = 'supply' | 'services' | 'lease' | 'loan';

const kinds: readonly AveOption<Kind>[] = [
  { value: 'supply', label: 'Поставка' },
  { value: 'services', label: 'Оказание услуг' },
  { value: 'lease', label: 'Аренда', disabled: true },
  { value: 'loan', label: 'Заём' },
];

@Component({
  selector: 'ave-select-signal',
  imports: [AveSelect, FormField],
  template: `<ave-select label="Kind" placeholder="Choose a kind" [options]="kinds" [formField]="contract.kind" />`,
})
class SignalHost {
  readonly kinds = kinds;
  readonly model = signal<{ kind: Kind | null; locked: boolean; frozen: boolean }>({
    kind: null,
    locked: false,
    frozen: false,
  });
  // `context.valueOf`: see the angular-eslint note in the input specs.
  readonly contract = form(this.model, (path) => {
    required(path.kind);
    disabled(path.kind, { when: (context) => context.valueOf(path.locked) });
    readonly(path.kind, { when: (context) => context.valueOf(path.frozen) });
  });
}

@Component({
  selector: 'ave-select-reactive',
  imports: [AveSelect, ReactiveFormsModule],
  template: `<ave-select label="Kind" [options]="kinds" [formControl]="kind" />`,
})
class ReactiveHost {
  readonly kinds = kinds;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly kind = new FormControl<Kind | null>('services', { validators: [Validators.required] });
}

@Component({
  selector: 'ave-select-plain',
  imports: [AveInput, AveSelect],
  template: `
    <input aveInput type="text" aria-label="Number" [size]="size()" />
    <ave-select label="Kind" placeholder="Choose" [options]="kinds" [size]="size()" [(value)]="kind" />
    <ave-select label="Off" [options]="kinds" disabled />
    <ave-select label="Nothing" [options]="[]" />
  `,
})
class PlainHost {
  readonly kinds = kinds;
  readonly size = signal<AveSelectSize>('md');
  readonly kind = signal<Kind | null>(null);
}

/** A stand-in for `<ave-form-field>`. */
class FakeField implements AveFieldContext {
  readonly defaultId = 'field-control';
  readonly describedBy = signal<readonly string[]>(['field-hint']);
  registered: { control: HTMLElement; state: AveControlState } | null = null;

  register(control: HTMLElement, state: AveControlState): void {
    this.registered = { control, state };
  }
}

@Component({
  selector: 'ave-select-in-field',
  imports: [AveSelect],
  template: `<ave-select [options]="kinds" />`,
})
class InField {
  readonly kinds = kinds;
}

const used = [
  'control.height.sm',
  'control.height.md',
  'control.height.lg',
  'control.padding-inline.sm',
  'control.padding-inline.md',
  'control.padding-inline.lg',
  'border-width.default',
  'radius.md',
  'radius.lg',
  'space.1',
  'space.2',
  'font.body-md',
  'color.border.strong',
  'color.danger.border',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  reset.remove();
});

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

describe('AveSelect', () => {
  it.each(['sm', 'md', 'lg'] as const)('has the box of an Input of size %s', async (size) => {
    const { fixture, element } = mount(PlainHost);
    fixture.componentInstance.size.set(size);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = element.querySelector('input');
    const trigger = element.querySelector('.trigger');
    if (input === null || trigger === null) throw new Error('No controls');
    const box = (control: Element) => {
      const style = getComputedStyle(control);
      return {
        height: control.getBoundingClientRect().height,
        border: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
        padding: style.paddingInlineStart,
        fontSize: style.fontSize,
      };
    };
    expect(box(trigger)).toEqual(box(input));
  });

  it('opens a listbox, moves with the arrow keys, chooses with Enter and closes', async () => {
    const { fixture } = mount(PlainHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSelectHarness.with({ text: 'Choose' }),
    );
    expect(await select.isEmpty()).toBe(true);
    await select.focus();
    await select.press('down');
    expect(await select.isOpen()).toBe(true);
    expect(await select.getOptions()).toEqual(['Поставка', 'Оказание услуг', 'Аренда', 'Заём']);
    const first = await select.getActiveOption();
    await select.press('down');
    const second = await select.getActiveOption();
    expect([first, second]).toEqual(['Поставка', 'Оказание услуг']);
    await select.press('enter');
    expect(fixture.componentInstance.kind()).toBe('services');
    expect(await select.isOpen()).toBe(false);
    expect(await select.getText()).toBe('Оказание услуг');
    expect(await select.isEmpty()).toBe(false);
  });

  it('chooses with a click, skips a disabled option, and closes on Escape', async () => {
    const { fixture } = mount(PlainHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSelectHarness.with({ text: 'Choose' }),
    );
    await select.choose('Аренда');
    expect(fixture.componentInstance.kind()).toBeNull();
    await select.choose('Заём');
    expect(fixture.componentInstance.kind()).toBe('loan');
    await select.open();
    await select.open();
    expect(await select.isOpen()).toBe(true);
    await select.close();
    expect(await select.isOpen()).toBe(false);
    await expect(select.choose('Кредит')).rejects.toThrow('no option matches Кредит');
  });

  it('follows Home, End and the arrow keys, and has no active option in an empty list', async () => {
    const { fixture } = mount(PlainHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const select = await loader.getHarness(AveSelectHarness.with({ text: 'Choose' }));
    await select.focus();
    await select.press('down');
    await select.press('end');
    expect(await select.getActiveOption()).toBe('Заём');
    await select.press('up');
    expect(await select.getActiveOption()).not.toBe('Заём');
    await select.press('home');
    expect(await select.getActiveOption()).toBe('Поставка');
    await select.press('escape');
    expect(await select.isOpen()).toBe(false);
    const [, , nothing] = await loader.getAllHarnesses(AveSelectHarness);
    expect(await nothing?.getOptions()).toEqual([]);
    expect(await nothing?.getActiveOption()).toBeNull();
  });

  it('keeps the list in the page while it plays its exit, and keeps it when it opens again meanwhile', async () => {
    // The exit of the motion catalog (motion.css is a global stylesheet, not loaded here), shortened.
    const motion = document.createElement('style');
    motion.textContent = '@keyframes out { to { opacity: 0; } } .ave-motion-popover-exit { animation: out 200ms; }';
    document.head.append(motion);
    const { fixture } = mount(PlainHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSelectHarness.with({ text: 'Choose' }),
    );
    await select.open();
    const popup = document.querySelector('.popup');
    expect(popup?.classList.contains('ave-motion-popover-enter')).toBe(true);
    await select.close();
    expect(popup?.classList.contains('ave-motion-popover-exit')).toBe(true);
    expect(popup?.isConnected).toBe(true);
    await select.open();
    expect(popup?.classList.contains('ave-motion-popover-exit')).toBe(false);
    await select.close();
    await expect.poll(() => popup?.isConnected, { timeout: 2000 }).toBe(false);
    motion.remove();
  });

  it('keeps focus on the trigger when an option is pressed', async () => {
    const { fixture, element } = mount(PlainHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSelectHarness.with({ text: 'Choose' }),
    );
    await select.focus();
    await select.open();
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    document.querySelector('[role="option"]')?.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(element.querySelector('.trigger'));
  });

  it('binds a Signal Forms field: required, invalid once touched, disabled and readonly from the schema', async () => {
    const { fixture } = mount(SignalHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSelectHarness);
    expect(await select.isRequired()).toBe(true);
    expect(await select.isInvalid()).toBe(false);
    await select.focus();
    await select.blur();
    expect(await select.isInvalid()).toBe(true);
    await select.choose('Поставка');
    expect(fixture.componentInstance.model().kind).toBe('supply');
    expect(await select.isInvalid()).toBe(false);
    fixture.componentInstance.model.update((model) => ({ ...model, kind: 'loan' }));
    expect(await select.getText()).toBe('Заём');
    fixture.componentInstance.model.update((model) => ({ ...model, frozen: true }));
    expect(await select.isReadonly()).toBe(true);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await select.isDisabled()).toBe(true);
  });

  it('binds a Reactive Forms control: its value, touched, and disabled', async () => {
    const { fixture } = mount(ReactiveHost);
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSelectHarness);
    expect(await select.getText()).toBe('Оказание услуг');
    await select.choose('Поставка');
    expect(fixture.componentInstance.kind.value).toBe('supply');
    await select.focus();
    await select.blur();
    expect(fixture.componentInstance.kind.touched).toBe(true);
    fixture.componentInstance.kind.setValue(null);
    expect(await select.isInvalid()).toBe(true);
    fixture.componentInstance.kind.disable();
    expect(await select.isDisabled()).toBe(true);
  });

  it('is disabled by its attribute, and takes the id and description of its field on the trigger', async () => {
    const { fixture } = mount(PlainHost);
    const [, off] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveSelectHarness);
    expect(await off?.isDisabled()).toBe(true);
    expect(await off?.getDescribedBy()).toEqual([]);
    await off?.close();
    expect(await off?.isOpen()).toBe(false);
    const field = new FakeField();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: AVE_FIELD, useValue: field }] });
    const { element, fixture: inField } = mount(InField);
    const trigger = element.querySelector('.trigger');
    expect(
      await (await TestbedHarnessEnvironment.loader(inField).getHarness(AveSelectHarness)).getDescribedBy(),
    ).toEqual(['field-hint']);
    expect(trigger?.id).toBe('field-control');
    expect(trigger?.getAttribute('aria-describedby')).toBe('field-hint');
    expect(field.registered?.control).toBe(trigger);
  });
});
