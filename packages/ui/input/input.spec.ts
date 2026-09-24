import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, readonly, required } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton } from '@avelune/ui/button';
import { AVE_FIELD, type AveControlState, type AveFieldContext } from '@avelune/ui/forms';
import { AveInput, type AveInputSize } from '@avelune/ui/input';
import { AveInputHarness } from '@avelune/ui/input/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-input-signal',
  imports: [AveInput, FormField],
  template: `<input aveInput type="text" aria-label="Contract number" [formField]="contract.number" />`,
})
class SignalHost {
  readonly model = signal({ number: '', locked: false, frozen: false });
  // `context.valueOf`, not a destructured `valueOf`: angular-eslint 22.5's reactive-context-must-read-signal looks call
  // names up in a plain object and crashes on Object.prototype.valueOf.
  readonly contract = form(this.model, (path) => {
    required(path.number);
    disabled(path.number, { when: (context) => context.valueOf(path.locked) });
    readonly(path.number, { when: (context) => context.valueOf(path.frozen) });
  });
}

@Component({
  selector: 'ave-input-reactive',
  imports: [AveInput, ReactiveFormsModule],
  template: `<input aveInput type="email" aria-label="Email" [formControl]="email" />`,
})
class ReactiveHost {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
}

@Component({
  selector: 'ave-input-plain',
  imports: [AveInput, AveButton],
  template: `
    <div class="row">
      <input aveInput type="search" aria-label="Search" placeholder="Search documents" [size]="size()" required />
      <button aveButton type="button" [size]="size()">Search</button>
    </div>
    <input aveInput type="text" aria-label="Note" aria-invalid="true" aria-describedby="own-hint" readonly />
    <input aveInput type="text" aria-label="Archived" disabled />
  `,
})
class PlainHost {
  readonly size = signal<AveInputSize>('md');
}

@Component({
  selector: 'ave-input-checkbox',
  imports: [AveInput],
  template: `<input aveInput type="checkbox" aria-label="Wrong" />`,
})
class WrongType {}

/** A stand-in for `<ave-form-field>`: what it offers the control inside it. */
class FakeField implements AveFieldContext {
  readonly defaultId = 'field-control';
  readonly describedBy = signal<readonly string[]>(['field-hint']);
  registered: { id: string; state: AveControlState } | null = null;

  register(id: string, state: AveControlState): void {
    this.registered = { id, state };
  }
}

@Component({
  selector: 'ave-input-in-field',
  imports: [AveInput],
  template: `
    <input aveInput type="text" aria-label="Title" aria-describedby="own" />
    <input aveInput type="text" aria-label="Named" id="named" />
  `,
})
class InField {}

const used = [
  'control.height.sm',
  'control.height.md',
  'control.height.lg',
  'control.padding-inline.sm',
  'control.padding-inline.md',
  'control.padding-inline.lg',
  'border-width.default',
  'radius.md',
  'font.body-md',
  'font.label-md',
  'color.border.strong',
  'color.danger.border',
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

describe('AveInput', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'has the box of a Button of size %s: height, border, radius, padding and font size',
    async (size) => {
      const { fixture, element } = mount(PlainHost);
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = element.querySelector('input');
      const button = element.querySelector('button');
      if (input === null || button === null) throw new Error('No controls');
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
      expect(box(input)).toEqual(box(button));
      expect(box(input).height).toBe(tokens[`control.height.${size}`].value);
      expect(getComputedStyle(input).borderTopColor).toBe(rgb(tokens['color.border.strong'].css));
    },
  );

  it('shows a Signal Forms field: required, invalid once touched, disabled and readonly from the schema', async () => {
    const { fixture } = mount(SignalHost);
    const input = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveInputHarness);
    expect(await input.isRequired()).toBe(true);
    expect(await input.isInvalid()).toBe(false);
    await input.focus();
    await input.blur();
    expect(await input.isInvalid()).toBe(true);
    await input.setValue('ДК-2026/114');
    expect(fixture.componentInstance.model().number).toBe('ДК-2026/114');
    expect(await input.isInvalid()).toBe(false);

    fixture.componentInstance.model.update((model) => ({ ...model, frozen: true }));
    expect(await input.isReadonly()).toBe(true);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await input.isDisabled()).toBe(true);
  });

  it('shows a Reactive Forms control: invalid once touched, then valid, then disabled', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const input = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveInputHarness);
    await input.setValue('not an address');
    expect(await input.isInvalid()).toBe(false);
    await input.blur();
    expect(await input.isInvalid()).toBe(true);
    await input.setValue('bekzod@example.uz');
    expect(fixture.componentInstance.email.value).toBe('bekzod@example.uz');
    expect(await input.isInvalid()).toBe(false);
    fixture.componentInstance.email.disable();
    expect(await input.isDisabled()).toBe(true);
    expect(getComputedStyle(element.querySelector('input') ?? element).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('marks a Reactive Forms control invalid when the form marks it touched', async () => {
    const { fixture } = mount(ReactiveHost);
    const input = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveInputHarness);
    fixture.componentInstance.email.markAsTouched();
    expect(await input.isInvalid()).toBe(true);
  });

  it("leaves an unbound input's ARIA to the application and shows its own states", async () => {
    const { element, fixture } = mount(PlainHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const [search, note, archived] = await loader.getAllHarnesses(AveInputHarness);
    expect(await search?.getPlaceholder()).toBe('Search documents');
    expect(await search?.isRequired()).toBe(true);
    expect(await note?.isInvalid()).toBe(true);
    expect(await note?.getDescribedBy()).toEqual(['own-hint']);
    expect(await note?.isReadonly()).toBe(true);
    expect(await archived?.isDisabled()).toBe(true);
    expect(await archived?.getDescribedBy()).toEqual([]);
    const [, readonlyInput] = [...element.querySelectorAll('input')];
    expect(readonlyInput === undefined ? '' : getComputedStyle(readonlyInput).borderTopStyle).toBe('dashed');
    expect(readonlyInput === undefined ? '' : getComputedStyle(readonlyInput).borderTopColor).toBe(
      rgb(tokens['color.danger.border'].css),
    );
    expect(await loader.getAllHarnesses(AveInputHarness.with({ placeholder: /documents/ }))).toHaveLength(1);
  });

  it('takes the id of its form field, registers its state, and adds the field to its description', async () => {
    const field = new FakeField();
    TestBed.configureTestingModule({ providers: [{ provide: AVE_FIELD, useValue: field }] });
    const { element, fixture } = mount(InField);
    const [title, named] = [...element.querySelectorAll('input')];
    expect(title?.id).toBe('field-control');
    expect(title?.getAttribute('aria-describedby')).toBe('own field-hint');
    expect(named?.id).toBe('named');
    expect(field.registered?.id).toBe('named');
    expect(field.registered?.state.bound).toBe(false);
    field.describedBy.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(named?.hasAttribute('aria-describedby')).toBe(false);
    expect(title?.getAttribute('aria-describedby')).toBe('own');
  });

  it('throws in development for a type that is not text', () => {
    expect(() => TestBed.createComponent(WrongType)).toThrow(
      '<input aveInput type="checkbox">: aveInput is for text. Use aveCheckbox for a checkbox',
    );
  });
});

describe('AveInputHarness', () => {
  it('filters by value, reads the size and focus, and rejects a size it does not know', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.componentInstance.email.setValue('nodira@example.uz');
    const input = await loader.getHarness(AveInputHarness.with({ value: 'nodira@example.uz' }));
    expect(await input.getSize()).toBe('md');
    await input.focus();
    expect(await input.isFocused()).toBe(true);
    await input.setValue('');
    expect(fixture.componentInstance.email.value).toBe('');
    element.querySelector('input')?.setAttribute('data-size', 'xl');
    await expect(input.getSize()).rejects.toThrow('unexpected data-size "xl"');
  });
});
