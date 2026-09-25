import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, readonly, required } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AVE_FIELD, type AveControlState, type AveFieldContext } from '@avelune/ui/forms';
import { AveInput } from '@avelune/ui/input';
import { AveTextarea, type AveTextareaSize } from '@avelune/ui/textarea';
import { AveTextareaHarness } from '@avelune/ui/textarea/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-textarea-signal',
  imports: [AveTextarea, FormField],
  template: `<textarea aveTextarea aria-label="Subject" [formField]="contract.subject"></textarea>`,
})
class SignalHost {
  readonly model = signal({ subject: '', locked: false, frozen: false });
  // `context.valueOf`, not a destructured `valueOf`: angular-eslint 22.5's reactive-context-must-read-signal looks call
  // names up in a plain object and crashes on Object.prototype.valueOf.
  readonly contract = form(this.model, (path) => {
    required(path.subject);
    disabled(path.subject, { when: (context) => context.valueOf(path.locked) });
    readonly(path.subject, { when: (context) => context.valueOf(path.frozen) });
  });
}

@Component({
  selector: 'ave-textarea-reactive',
  imports: [AveTextarea, ReactiveFormsModule],
  template: `<textarea aveTextarea aria-label="Comment" [formControl]="comment"></textarea>`,
})
class ReactiveHost {
  readonly comment = new FormControl('', {
    nonNullable: true,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    validators: [Validators.required, Validators.minLength(10)],
  });
}

@Component({
  selector: 'ave-textarea-plain',
  imports: [AveInput, AveTextarea],
  template: `
    <input aveInput type="text" aria-label="Number" [size]="size()" />
    <textarea aveTextarea aria-label="One line" rows="1" [size]="size()"></textarea>
    <textarea aveTextarea aria-label="Default" placeholder="What the contract is about" [size]="size()"></textarea>
    <textarea aveTextarea aria-label="Note" aria-invalid="true" aria-describedby="own-hint" readonly></textarea>
    <textarea aveTextarea aria-label="Archived" disabled></textarea>
  `,
})
class PlainHost {
  readonly size = signal<AveTextareaSize>('md');
}

@Component({
  selector: 'ave-textarea-rows',
  imports: [AveTextarea],
  template: `
    <textarea aveTextarea aria-label="Five" rows="5"></textarea>
    <textarea aveTextarea aria-label="Zero" rows="0"></textarea>
    <textarea aveTextarea aria-label="Words" rows="many"></textarea>
    <textarea aveTextarea aria-label="Fraction" rows="2.7"></textarea>
  `,
})
class RowsHost {}

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
  selector: 'ave-textarea-in-field',
  imports: [AveTextarea],
  template: `<textarea aveTextarea aria-label="Subject" aria-describedby="own"></textarea>`,
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
  'color.border.strong',
  'color.danger.border',
] as const satisfies readonly TokenName[];

/** The line height of `font.body-md`, which tokens.css also emits on its own. */
const lineHeight = tokens['font.body-md'].value.lineHeight;

const root = document.documentElement;

/** The kit's reset (`reset.css`, ADR 0030) sizes every box by its border; a textarea is `content-box` without it. */
const reset = document.createElement('style');
reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', `${String(lineHeight)}px`);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
  reset.remove();
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

/** What a textarea shares with an input of its size (brief §8.2). */
function box(control: Element) {
  const style = getComputedStyle(control);
  return {
    border: style.borderTopWidth,
    radius: style.borderTopLeftRadius,
    padding: style.paddingInlineStart,
    fontSize: style.fontSize,
  };
}

describe('AveTextarea', () => {
  it.each(['sm', 'md', 'lg'] as const)(
    'has the box of an Input of size %s, one row as tall as it, and 20px more per row',
    async (size) => {
      const { fixture, element } = mount(PlainHost);
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = element.querySelector('input');
      const [oneLine, three] = [...element.querySelectorAll('textarea')];
      if (input === null || oneLine === undefined || three === undefined) throw new Error('No controls');
      const height = tokens[`control.height.${size}`].value;
      expect(box(oneLine)).toEqual(box(input));
      expect(oneLine.getBoundingClientRect().height).toBe(height);
      expect(three.getBoundingClientRect().height).toBe(height + 2 * lineHeight);
      expect(getComputedStyle(three).borderTopColor).toBe(rgb(tokens['color.border.strong'].css));
      expect(getComputedStyle(three).resize).toBe('block');
    },
  );

  it('shows 3 rows by default, the rows the template asks for, and 3 for anything that is not a row count', async () => {
    const { fixture } = mount(RowsHost);
    const rows = await Promise.all(
      (await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveTextareaHarness)).map((textarea) =>
        textarea.getRows(),
      ),
    );
    expect(rows).toEqual([5, 3, 3, 2]);
    const { fixture: plain } = mount(PlainHost);
    const [, defaults] = await TestbedHarnessEnvironment.loader(plain).getAllHarnesses(AveTextareaHarness);
    expect(await defaults?.getRows()).toBe(3);
  });

  it('shows a Signal Forms field: required, invalid once touched, disabled and readonly from the schema', async () => {
    const { fixture } = mount(SignalHost);
    const textarea = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveTextareaHarness);
    expect(await textarea.isRequired()).toBe(true);
    expect(await textarea.isInvalid()).toBe(false);
    await textarea.focus();
    await textarea.blur();
    expect(await textarea.isInvalid()).toBe(true);
    await textarea.setValue('Поставка оборудования\nдля трёх филиалов');
    expect(fixture.componentInstance.model().subject).toBe('Поставка оборудования\nдля трёх филиалов');
    expect(await textarea.isInvalid()).toBe(false);

    fixture.componentInstance.model.update((model) => ({ ...model, frozen: true }));
    expect(await textarea.isReadonly()).toBe(true);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await textarea.isDisabled()).toBe(true);
  });

  it('shows a Reactive Forms control: invalid once touched, then valid, then disabled without a handle', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const textarea = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveTextareaHarness);
    await textarea.setValue('Коротко');
    expect(await textarea.isInvalid()).toBe(false);
    await textarea.blur();
    expect(await textarea.isInvalid()).toBe(true);
    await textarea.setValue('Согласовать с юридическим отделом');
    expect(fixture.componentInstance.comment.value).toBe('Согласовать с юридическим отделом');
    expect(await textarea.isInvalid()).toBe(false);
    fixture.componentInstance.comment.disable();
    expect(await textarea.isDisabled()).toBe(true);
    const style = getComputedStyle(element.querySelector('textarea') ?? element);
    expect(style.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.resize).toBe('none');
  });

  it("leaves an unbound textarea's ARIA to the application and shows its own states", async () => {
    const { element, fixture } = mount(PlainHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const [, withPlaceholder, note, archived] = await loader.getAllHarnesses(AveTextareaHarness);
    expect(await withPlaceholder?.getPlaceholder()).toBe('What the contract is about');
    expect(await note?.isInvalid()).toBe(true);
    expect(await note?.getDescribedBy()).toEqual(['own-hint']);
    expect(await note?.isReadonly()).toBe(true);
    expect(await archived?.isDisabled()).toBe(true);
    expect(await archived?.getDescribedBy()).toEqual([]);
    const readonlyTextarea = element.querySelectorAll('textarea')[2];
    expect(readonlyTextarea === undefined ? '' : getComputedStyle(readonlyTextarea).borderTopStyle).toBe('dashed');
    expect(readonlyTextarea === undefined ? '' : getComputedStyle(readonlyTextarea).borderTopColor).toBe(
      rgb(tokens['color.danger.border'].css),
    );
    expect(await loader.getAllHarnesses(AveTextareaHarness.with({ placeholder: /contract/ }))).toHaveLength(1);
  });

  it('takes the id of its form field, registers its state, and adds the field to its description', () => {
    const field = new FakeField();
    TestBed.configureTestingModule({ providers: [{ provide: AVE_FIELD, useValue: field }] });
    const { element } = mount(InField);
    const textarea = element.querySelector('textarea');
    expect(textarea?.id).toBe('field-control');
    expect(textarea?.getAttribute('aria-describedby')).toBe('own field-hint');
    expect(field.registered?.id).toBe('field-control');
    expect(field.registered?.state.bound).toBe(false);
  });
});

describe('AveTextareaHarness', () => {
  it('filters by value, reads the size and focus, and rejects a size it does not know', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.componentInstance.comment.setValue('Согласовать с юридическим отделом');
    const textarea = await loader.getHarness(AveTextareaHarness.with({ value: /юридическим/ }));
    expect(await textarea.getSize()).toBe('md');
    await textarea.focus();
    expect(await textarea.isFocused()).toBe(true);
    await textarea.setValue('');
    expect(fixture.componentInstance.comment.value).toBe('');
    element.querySelector('textarea')?.setAttribute('data-size', 'xl');
    await expect(textarea.getSize()).rejects.toThrow('unexpected data-size "xl"');
  });
});
