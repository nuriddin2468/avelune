import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveInput } from '@avelune/ui/input';
import { AveSelect, type AveOption, type AveSelectSize } from '@avelune/ui/select';
import { kinds } from './fixtures/options';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveSelectSize[];

type View = 'sizes' | 'states' | 'long' | 'compact';

const longKinds: readonly AveOption<string>[] = [
  { value: 'framework', label: 'Рамочный договор на поставку серверного оборудования и программного обеспечения' },
  { value: 'uz', label: 'Davlat xaridlari toʻgʻrisidagi qonun asosida tuzilgan shartnoma' },
  { value: 'short', label: 'Заём' },
];

/** The frame the stories draw selects in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-select-stories',
  imports: [AveInput, AveSelect],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="stack">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-select [label]="'Kind, ' + size" placeholder="Choose a kind" [options]="kinds" [size]="size" />
            </div>
          }
        </div>
      }
      @case ('states') {
        <div class="grid" lang="ru">
          <div class="field">
            <span class="label" id="empty">Empty</span>
            <ave-select label="Empty" placeholder="Выберите вид" [options]="kinds" />
          </div>
          <div class="field">
            <span class="label">Chosen</span>
            <ave-select label="Chosen" [options]="kinds" value="services" />
          </div>
          <div class="field">
            <span class="label">Focused</span>
            <ave-select label="Focused" data-focus-target [options]="kinds" value="supply" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-select label="Readonly" [options]="kinds" value="lease" readonly />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-select label="Disabled" [options]="kinds" value="works" disabled />
          </div>
        </div>
      }
      @case ('compact') {
        <div class="stack" data-density="compact">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-select [label]="'Kind, ' + size" [options]="kinds" value="supply" [size]="size" />
            </div>
          }
        </div>
      }
      @default {
        <div class="stack narrow room" lang="ru">
          <ave-select label="Вид договора" [options]="longKinds" value="framework" />
          <ave-select label="Shartnoma turi" lang="uz-Latn" [options]="longKinds" value="uz" />
        </div>
      }
    }
  `,
  styleUrl: './select.stories.css',
})
class SelectStories {
  readonly view = input<View>('states');
  protected readonly sizes = sizes;
  protected readonly kinds = kinds;
  protected readonly longKinds = longKinds;
}

/** Signal Forms and Reactive Forms: one required choice each, invalid once left empty. */
@Component({
  selector: 'ave-select-forms',
  imports: [AveSelect, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow">
      <div class="field">
        <span class="label">Kind (Signal Forms)</span>
        <ave-select
          label="Kind (Signal Forms)"
          placeholder="Choose a kind"
          [options]="kinds"
          [formField]="contract.kind"
        />
      </div>
      <div class="field">
        <span class="label">Kind (Reactive Forms)</span>
        <ave-select label="Kind (Reactive Forms)" placeholder="Choose a kind" [options]="kinds" [formControl]="kind" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().kind ?? 'nothing' }} · Reactive Forms: {{ kind.value ?? 'nothing' }}
    </p>
  `,
  styleUrl: './select.stories.css',
})
class SelectForms {
  protected readonly kinds = kinds;
  protected readonly model = signal<{ kind: string | null }>({ kind: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.kind);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly kind = new FormControl<string | null>(null, { validators: [Validators.required] });
}

/** Pads the Default and Open stories; styled with tokens only. */
@Component({
  selector: 'ave-select-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './select.stories.css',
})
class SelectStoryFrame {}

/** The arguments of the Default story. */
interface SelectArgs {
  readonly size: AveSelectSize;
  readonly placeholder: string;
}

type Story = StoryObj<SelectArgs>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-select-stories [view]="view" />`,
    moduleMetadata: { imports: [SelectStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

function box(control: Element) {
  const style = getComputedStyle(control);
  return {
    height: control.getBoundingClientRect().height,
    border: style.borderTopWidth,
    radius: style.borderTopLeftRadius,
    padding: style.paddingInlineStart,
    fontSize: style.fontSize,
  };
}

// No `component`: Storybook instantiates a meta's component outside an injection context to read its defaults, and a
// `model()` throws there (NG0203). The arguments are declared here instead.
const meta: Meta<SelectArgs> = {
  title: 'Components/Select',
  args: { size: 'md', placeholder: 'Выберите вид договора' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [moduleMetadata({ imports: [AveSelect, SelectStoryFrame] })],
  render: (args) => ({
    props: { ...args, kinds },
    template: `<ave-select label="Вид договора" lang="ru" [options]="kinds" [size]="size" [placeholder]="placeholder" />`,
  }),
};
export default meta;

/** One select, with controls. */
export const Default: Story = {
  decorators: [componentWrapperDecorator(SelectStoryFrame)],
  parameters: source(
    '<ave-select [options]="kinds" placeholder="Выберите вид договора" [formField]="contract.kind" />',
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Вид договора' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveTextContent('Выберите вид договора');
  },
};

/** The open list: Down opens it on the chosen option, the arrow keys move, the chosen option has a check. */
export const Open: Story = {
  decorators: [componentWrapperDecorator(SelectStoryFrame)],
  render: () => ({
    props: { kinds },
    template: `<ave-select label="Вид договора" lang="ru" [options]="kinds" value="services" />`,
  }),
  parameters: source('<ave-select [options]="kinds" [formField]="contract.kind" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Вид договора' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = await canvas.findByRole('listbox');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(kinds.length);
    await expect(within(listbox).getByRole('option', { name: 'Оказание услуг' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(within(listbox).getByRole('option', { name: 'Заём' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowDown}');
  },
};

/** Each size next to an Input of that size: the same box. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: source('<ave-select size="sm" [options]="kinds" />'),
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.row')) {
      const input = row.querySelector('input');
      const trigger = row.querySelector('.trigger');
      if (input === null || trigger === null) throw new Error('No controls');
      await expect(box(trigger), row.getAttribute('data-row') ?? '').toEqual(box(input));
    }
  },
};

/** Empty, chosen, focused, readonly, disabled: one size in every state. Invalid is in the Forms story. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: source('<ave-select [options]="kinds" readonly />', '<ave-select [options]="kinds" disabled />'),
  play: async ({ canvasElement }) => {
    const triggers = [...canvasElement.querySelectorAll('.trigger')];
    for (const trigger of triggers) await expect(trigger.getBoundingClientRect().height).toBe(36);
    const focused = canvasElement.querySelector('[data-focus-target] .trigger');
    if (!(focused instanceof HTMLElement)) throw new Error('No trigger');
    focused.focus();
    await expect(focused.matches(':focus-visible')).toBe(true);
    await expect(within(canvasElement).getByRole('combobox', { name: 'Disabled' })).toBeDisabled();
  },
};

/** Both form APIs: a required choice, invalid once it is left empty. */
export const Forms: Story = {
  render: () => ({ template: '<ave-select-forms />', moduleMetadata: { imports: [SelectForms] } }),
  parameters: source(
    '<ave-select [options]="kinds" [formField]="contract.kind" />',
    '<ave-select [options]="kinds" [formControl]="kind" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('combobox', { name: 'Kind (Signal Forms)' });
    const reactive = canvas.getByRole('combobox', { name: 'Kind (Reactive Forms)' });
    await expect(signalForms).toHaveAttribute('aria-required', 'true');
    signalForms.focus();
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(signalForms).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(reactive).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.click(reactive);
    await userEvent.click(await canvas.findByRole('option', { name: 'Подряд' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: works');
    await waitFor(() => expect(reactive).not.toHaveAttribute('aria-invalid'));
    reactive.blur();
  },
};

/** A long label truncates in the trigger, which keeps its height; the list shows it in full. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: source('<ave-select [options]="kinds" />'),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    for (const trigger of canvasElement.querySelectorAll('.trigger')) {
      await expect(trigger.getBoundingClientRect().height).toBe(36);
    }
    const [first] = canvasElement.querySelectorAll<HTMLElement>('.trigger');
    first?.focus();
    await userEvent.keyboard('{ArrowDown}');
    const option = await within(canvasElement).findByRole('option', { name: longKinds[0]?.label ?? '' });
    await expect(option.getBoundingClientRect().height).toBeGreaterThan(36);
  },
};

/** Compact density: every size one step down, next to its Input. */
export const Compact: Story = {
  render: frame('compact'),
  parameters: source('<div data-density="compact">', '  <ave-select [options]="kinds" />', '</div>'),
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      const trigger = canvasElement.querySelector(`[data-row="${size}"] .trigger`);
      await expect(trigger?.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};
