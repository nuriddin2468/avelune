import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveCombobox, type AveSelectSize } from '@avelune/ui/select';
import { counterparties } from './fixtures/options';

type View = 'states' | 'long';

/** The frame the stories draw comboboxes in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-combobox-stories',
  imports: [AveCombobox],
  template: `
    @switch (view()) {
      @case ('long') {
        <div class="stack narrow room" lang="ru">
          <ave-combobox label="Контрагент" [options]="counterparties" [value]="6" />
          <ave-combobox label="Kontragent" lang="uz-Latn" [options]="counterparties" [value]="8" />
        </div>
      }
      @default {
        <div class="grid" lang="ru">
          <div class="field">
            <span class="label">Empty</span>
            <ave-combobox label="Empty" placeholder="Начните вводить название" [options]="counterparties" />
          </div>
          <div class="field">
            <span class="label">Chosen</span>
            <ave-combobox label="Chosen" [options]="counterparties" [value]="3" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-combobox label="Readonly" [options]="counterparties" [value]="1" readonly />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-combobox label="Disabled" [options]="counterparties" [value]="2" disabled />
          </div>
        </div>
      }
    }
  `,
  styleUrl: './select.stories.css',
})
class ComboboxStories {
  readonly view = input<View>('states');
  protected readonly counterparties = counterparties;
}

/** Signal Forms and Reactive Forms: one required counterparty each. */
@Component({
  selector: 'ave-combobox-forms',
  imports: [AveCombobox, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow room">
      <div class="field">
        <span class="label">Counterparty (Signal Forms)</span>
        <ave-combobox
          label="Counterparty (Signal Forms)"
          [options]="counterparties"
          [formField]="contract.counterparty"
        />
      </div>
      <div class="field">
        <span class="label">Counterparty (Reactive Forms)</span>
        <ave-combobox label="Counterparty (Reactive Forms)" [options]="counterparties" [formControl]="counterparty" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().counterparty ?? 'nothing' }} · Reactive Forms: {{ counterparty.value ?? 'nothing' }}
    </p>
  `,
  styleUrl: './select.stories.css',
})
class ComboboxForms {
  protected readonly counterparties = counterparties;
  protected readonly model = signal<{ counterparty: number | null }>({ counterparty: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.counterparty);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly counterparty = new FormControl<number | null>(null, { validators: [Validators.required] });
}

/** Clearing (ADR 0052): an optional combobox with a value shows the clear button inside its end; a required one does not. */
@Component({
  selector: 'ave-combobox-clearing',
  imports: [AveCombobox, FormField],
  template: `
    <div class="grid" lang="ru">
      <div class="field">
        <span class="label">Можно очистить</span>
        <ave-combobox
          label="Плательщик"
          placeholder="Начните вводить название"
          [options]="counterparties"
          [(value)]="payer"
        />
      </div>
      <div class="field">
        <span class="label">Обязательный</span>
        <ave-combobox
          label="Контрагент (обязательный)"
          [options]="counterparties"
          [formField]="contract.counterparty"
        />
      </div>
    </div>
    <p class="status" role="status">Плательщик: {{ payer() ?? 'не выбран' }}</p>
  `,
  styleUrl: './select.stories.css',
})
class ComboboxClearing {
  protected readonly counterparties = counterparties;
  protected readonly payer = signal<number | null>(6);
  protected readonly model = signal<{ counterparty: number | null }>({ counterparty: 3 });
  protected readonly contract = form(this.model, (path) => {
    required(path.counterparty);
  });
}

/** Pads the single-combobox stories. */
@Component({
  selector: 'ave-combobox-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './select.stories.css',
})
class ComboboxStoryFrame {}

/** The arguments of the Default story. */
interface ComboboxArgs {
  readonly size: AveSelectSize;
  readonly placeholder: string;
}

type Story = StoryObj<ComboboxArgs>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-combobox-stories [view]="view" />`,
    moduleMetadata: { imports: [ComboboxStories] },
  });
}

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

// No `component`: Storybook instantiates a meta's component outside an injection context, where `model()` throws.
const meta: Meta<ComboboxArgs> = {
  title: 'Components/Combobox',
  args: { size: 'md', placeholder: 'Начните вводить название' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [
    moduleMetadata({ imports: [AveCombobox, ComboboxStoryFrame] }),
    componentWrapperDecorator(ComboboxStoryFrame),
  ],
  render: (args) => ({
    props: { ...args, counterparties },
    template: `<ave-combobox label="Контрагент" lang="ru" [options]="counterparties" [size]="size" [placeholder]="placeholder" />`,
  }),
};
export default meta;

/** One combobox, with controls. */
export const Default: Story = {
  parameters: source('<ave-combobox [options]="counterparties" [formField]="contract.counterparty" />'),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Контрагент' });
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  },
};

/** Typing filters the list: "узбек" shows the two organisations whose names contain it in Cyrillic. */
export const Filtering: Story = {
  parameters: source('<ave-combobox [options]="counterparties" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Контрагент' });
    await userEvent.type(input, 'узбек');
    const listbox = await canvas.findByRole('listbox');
    await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(2));
    await userEvent.keyboard('{ArrowDown}');
  },
};

/** "o'zbek", typed with an ASCII apostrophe, finds "Oʻzbekiston". */
export const UzbekApostrophes: Story = {
  name: 'Uzbek apostrophes',
  parameters: source('<ave-combobox [options]="counterparties" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox', { name: 'Контрагент' }), "o'zbekiston");
    const listbox = await canvas.findByRole('listbox');
    await waitFor(() =>
      expect(
        within(listbox)
          .getAllByRole('option')
          .map((option) => option.textContent.trim()),
      ).toEqual(['Oʻzbekiston temir yoʻllari', 'Oʻzbekiston milliy banki']),
    );
  },
};

/** Nothing matches: the list says so, in the application's language. */
export const NoResults: Story = {
  name: 'No results',
  parameters: source('<ave-combobox [options]="counterparties" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox', { name: 'Контрагент' }), 'Омега');
    await expect(await canvas.findByRole('status')).toHaveTextContent('No results');
  },
};

/** Empty, chosen, readonly, disabled. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: source(
    '<ave-combobox [options]="counterparties" readonly />',
    '<ave-combobox [options]="counterparties" disabled />',
  ),
  play: async ({ canvasElement }) => {
    for (const input of canvasElement.querySelectorAll('input'))
      await expect(input.getBoundingClientRect().height).toBe(36);
    await expect(within(canvasElement).getByRole('combobox', { name: 'Chosen' })).toHaveValue('АО «Узбекнефтегаз»');
  },
};

/** Both form APIs: a required counterparty, invalid once left empty. */
export const Forms: Story = {
  render: () => ({ template: '<ave-combobox-forms />', moduleMetadata: { imports: [ComboboxForms] } }),
  decorators: [],
  parameters: source(
    '<ave-combobox [options]="counterparties" [formField]="contract.counterparty" />',
    '<ave-combobox [options]="counterparties" [formControl]="counterparty" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('combobox', { name: 'Counterparty (Signal Forms)' });
    const reactive = canvas.getByRole('combobox', { name: 'Counterparty (Reactive Forms)' });
    signalForms.focus();
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(signalForms).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(reactive).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.type(reactive, 'Гамма');
    await userEvent.click(await canvas.findByRole('option', { name: 'ООО «Гамма Консалтинг»' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: 9');
    reactive.blur();
  },
};

/** Long names truncate in the input, which keeps its height; the list shows them in full. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  decorators: [],
  parameters: source('<ave-combobox [options]="counterparties" />'),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
  },
};

/**
 * Clearing (ADR 0052): the button empties an optional combobox and leaves focus in it; deleting the text and leaving
 * does the same on the keyboard. A long label stops before the button.
 */
export const Clearing: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-combobox-clearing />', moduleMetadata: { imports: [ComboboxClearing] } }),
  parameters: source('<ave-combobox [options]="counterparties" [formField]="contract.payer" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Плательщик' });
    const clear = canvas.getByRole('button', { name: 'Очистить Плательщик' });
    await expect(canvas.getAllByRole('button', { name: /^Очистить/ })).toHaveLength(1);
    const style = getComputedStyle(input);
    const textEnd = input.getBoundingClientRect().right - Number.parseFloat(style.paddingInlineEnd);
    await expect(clear.getBoundingClientRect().left - textEnd).toBe(4);
    await userEvent.click(clear);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('status')).toHaveTextContent('Плательщик: не выбран');
    await userEvent.type(input, 'Гамма');
    await userEvent.click(await canvas.findByRole('option', { name: 'ООО «Гамма Консалтинг»' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Плательщик: 9');
    await userEvent.clear(input);
    await userEvent.keyboard('{Escape}');
    input.blur();
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Плательщик: не выбран'));
    await userEvent.type(input, 'документооборот');
    await userEvent.click(await canvas.findByRole('option', { name: /документооборота/ }));
    input.blur();
    await expect(canvas.getByRole('button', { name: 'Очистить Плательщик' })).toBeVisible();
  },
};
