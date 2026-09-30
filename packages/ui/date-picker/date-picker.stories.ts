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
import { AveDatePicker, type AveDatePickerSize } from '@avelune/ui/date-picker';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveDatePickerSize[];

type View = 'sizes' | 'states' | 'compact';

/** The frame the stories draw date fields in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-date-picker-stories',
  imports: [AveDatePicker, AveInput],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="stack">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-date-picker [label]="'Signed on, ' + size" [size]="size" value="2026-03-18" />
            </div>
          }
        </div>
      }
      @case ('compact') {
        <div class="stack" data-density="compact">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-date-picker [label]="'Signed on, ' + size" [size]="size" value="2026-03-18" />
            </div>
          }
        </div>
      }
      @default {
        <div class="grid">
          <div class="field">
            <span class="label">Empty</span>
            <ave-date-picker label="Empty" />
          </div>
          <div class="field">
            <span class="label">Filled</span>
            <ave-date-picker label="Filled" value="2026-03-18" />
          </div>
          <div class="field">
            <span class="label">Focused</span>
            <ave-date-picker label="Focused" data-focus-target value="2026-03-18" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-date-picker label="Readonly" value="2026-03-18" readonly />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-date-picker label="Disabled" value="2026-03-18" disabled />
          </div>
        </div>
      }
    }
  `,
  styleUrl: './date-picker.stories.css',
})
class DatePickerStories {
  readonly view = input<View>('states');
  protected readonly sizes = sizes;
}

/** Signal Forms and Reactive Forms: one required date each. */
@Component({
  selector: 'ave-date-picker-forms',
  imports: [AveDatePicker, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow room">
      <div class="field">
        <span class="label">Signed on (Signal Forms)</span>
        <ave-date-picker label="Signed on (Signal Forms)" [formField]="contract.signedOn" />
      </div>
      <div class="field">
        <span class="label">Signed on (Reactive Forms)</span>
        <ave-date-picker label="Signed on (Reactive Forms)" [formControl]="signedOn" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().signedOn ?? 'nothing' }} · Reactive Forms: {{ signedOn.value ?? 'nothing' }}
    </p>
  `,
  styleUrl: './date-picker.stories.css',
})
class DatePickerForms {
  protected readonly model = signal<{ signedOn: string | null }>({ signedOn: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.signedOn);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly signedOn = new FormControl<string | null>(null, { validators: [Validators.required] });
}

/** A long Russian label, hint and error around a required date, in a 320px column; the error shows at once. */
@Component({
  selector: 'ave-date-picker-long',
  imports: [AveDatePicker, AveError, AveFormField, AveHint, FormField],
  template: `
    <div class="narrow">
      <ave-form-field label="Дата подписания договора обеими сторонами в соответствии с протоколом разногласий">
        <ave-date-picker [formField]="contract.signedOn" />
        <p aveHint>Как в экземпляре, подписанном последней из сторон; не раньше даты регистрации контрагента.</p>
        <p aveError>Укажите дату подписания договора, например 18.03.2026.</p>
      </ave-form-field>
    </div>
  `,
  styleUrl: './date-picker.stories.css',
})
class DatePickerLong {
  protected readonly model = signal<{ signedOn: string | null }>({ signedOn: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.signedOn);
  });

  constructor() {
    this.contract.signedOn().markAsTouched();
  }
}

/**
 * Clearing (ADR 0052): an optional date field with a date shows the clear button before the calendar button; a
 * required or a readonly one does not.
 */
@Component({
  selector: 'ave-date-picker-clearing',
  imports: [AveDatePicker, FormField],
  template: `
    <div class="grid">
      <div class="field">
        <span class="label">Можно очистить</span>
        <ave-date-picker label="Дата оплаты" [(value)]="paidOn" />
      </div>
      <div class="field">
        <span class="label">Обязательная</span>
        <ave-date-picker label="Дата подписания (обязательная)" [formField]="contract.signedOn" />
      </div>
      <div class="field">
        <span class="label">Только чтение</span>
        <ave-date-picker label="Дата регистрации (только чтение)" value="2026-03-02" readonly />
      </div>
    </div>
    <p class="status" role="status">Дата оплаты: {{ paidOn() ?? 'не указана' }}</p>
  `,
  styleUrl: './date-picker.stories.css',
})
class DatePickerClearing {
  protected readonly paidOn = signal<string | null>('2026-03-18');
  protected readonly model = signal<{ signedOn: string | null }>({ signedOn: '2026-03-10' });
  protected readonly contract = form(this.model, (path) => {
    required(path.signedOn);
  });
}

/** Pads the single-field stories, with room for the calendar. */
@Component({
  selector: 'ave-date-picker-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './date-picker.stories.css',
})
class DatePickerStoryFrame {}

/** The arguments of the Default story. */
interface DatePickerArgs {
  readonly size: AveDatePickerSize;
}

type Story = StoryObj<DatePickerArgs>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-date-picker-stories [view]="view" />`,
    moduleMetadata: { imports: [DatePickerStories] },
  });
}

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

/** Opens the calendar with its button (the one with a dialog popup) and waits for the day that takes focus. */
async function openCalendar(canvasElement: HTMLElement): Promise<HTMLElement> {
  const canvas = within(canvasElement);
  await userEvent.click(canvasElement.querySelector('button[aria-haspopup="dialog"]') ?? canvasElement);
  const dialog = await canvas.findByRole('dialog');
  await waitFor(() => expect(dialog.querySelector('[data-date]:focus')).not.toBeNull());
  return dialog;
}

const meta: Meta<DatePickerArgs> = {
  title: 'Components/DatePicker',
  component: AveDatePicker,
  args: { size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [moduleMetadata({ imports: [AveDatePicker, DatePickerStoryFrame] })],
  render: (args) => ({
    props: args,
    template: `<ave-date-picker label="Дата подписания" [size]="size" value="2026-03-18" />`,
  }),
};
export default meta;

/** One date field in Russian, with controls. */
export const Default: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(DatePickerStoryFrame)],
  parameters: { docs: { source: { code: '<ave-date-picker [formField]="contract.signedOn" />', language: 'html' } } },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Дата подписания' });
    await expect(input).toHaveValue('18.03.2026');
    await expect(input).toHaveAttribute('placeholder', 'дд.мм.гггг');
  },
};

/** The calendar in Russian: Monday first, today marked, the chosen day filled, focus on it. */
export const Open: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru'), componentWrapperDecorator(DatePickerStoryFrame)],
  parameters: { docs: { source: { code: '<ave-date-picker [formField]="contract.signedOn" />', language: 'html' } } },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Март 2026 г.');
    const [monday] = within(dialog).getAllByRole('columnheader');
    await expect(monday).toHaveAttribute('abbr', 'понедельник');
    await expect(monday).toHaveTextContent('Пн');
    await expect(dialog.querySelector('[data-date]:focus')).toHaveAttribute('data-date', '2026-03-18');
    await expect(within(dialog).getByRole('gridcell', { name: '18 марта 2026 г.' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};

/** Uzbek in Latin script, written by the kit: Chromium has no data for it (ADR 0048). */
export const UzbekLatin: Story = {
  name: 'Uzbek (Latin)',
  decorators: [locale('uz-Latn'), componentWrapperDecorator(DatePickerStoryFrame)],
  render: () => ({ template: `<ave-date-picker label="Imzolangan sana" value="2026-03-18" />` }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toHaveValue('18/03/2026');
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Mart, 2026');
    await expect(within(dialog).getByRole('gridcell', { name: '18-mart, 2026' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};

/** Uzbek in Cyrillic script. */
export const UzbekCyrillic: Story = {
  name: 'Uzbek (Cyrillic)',
  decorators: [locale('uz-Cyrl'), componentWrapperDecorator(DatePickerStoryFrame)],
  render: () => ({ template: `<ave-date-picker label="Имзоланган сана" value="2026-03-18" />` }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toHaveAttribute('placeholder', 'кк/оо/йййй');
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Март, 2026');
  },
};

/** English in the US: month first, Sunday first. */
export const English: Story = {
  decorators: [locale('en-US'), componentWrapperDecorator(DatePickerStoryFrame)],
  render: () => ({ template: `<ave-date-picker label="Signed on" value="2026-03-18" />` }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox')).toHaveValue('03/18/2026');
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Sunday');
  },
};

/** Bounds: the days outside them cannot be chosen. */
export const Bounds: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(DatePickerStoryFrame)],
  render: () => ({
    template: `<ave-date-picker label="Срок исполнения" value="2026-03-18" minDate="2026-03-10" maxDate="2026-03-25" />`,
  }),
  parameters: {
    docs: {
      source: {
        code: '<ave-date-picker minDate="2026-03-10" maxDate="2026-03-25" [formField]="contract.due" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    await expect(within(dialog).getByRole('gridcell', { name: '9 марта 2026 г.' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(within(dialog).getByRole('gridcell', { name: '10 марта 2026 г.' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/** Empty, filled, focused, readonly, disabled. Invalid is in the Forms story. */
export const States: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru')],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<ave-date-picker readonly />
<ave-date-picker disabled />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const input of canvasElement.querySelectorAll('input'))
      await expect(input.getBoundingClientRect().height).toBe(36);
    const focused = canvasElement.querySelector<HTMLInputElement>('[data-focus-target] input');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Both form APIs: a required date, invalid once left empty; a typed date is read on leaving. */
export const Forms: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-date-picker-forms />', moduleMetadata: { imports: [DatePickerForms] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-date-picker [formField]="contract.signedOn" />
<ave-date-picker [formControl]="signedOn" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('textbox', { name: 'Signed on (Signal Forms)' });
    const reactive = canvas.getByRole('textbox', { name: 'Signed on (Reactive Forms)' });
    await userEvent.click(signalForms);
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(signalForms).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.type(reactive, '5.3.2026{Enter}');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: 2026-03-05'));
    await expect(reactive).toHaveValue('05.03.2026');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A long Russian label, hint and error wrap in a 320px column; the field keeps its box. */
export const LongText: Story = {
  name: 'Long text',
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-date-picker-long />', moduleMetadata: { imports: [DatePickerLong] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-form-field label="Дата подписания договора обеими сторонами…">
  <ave-date-picker [formField]="contract.signedOn" />
  <p aveHint>…</p>
  <p aveError>…</p>
</ave-form-field>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    const input = within(canvasElement).getByRole('textbox', { name: /^Дата подписания договора/ });
    await expect(input.getBoundingClientRect().height).toBe(36);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(/Как в экземпляре.*Укажите дату подписания/);
  },
};

/** Each size next to an Input of that size: the same box. */
export const Sizes: Story = {
  decorators: [locale('ru')],
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<input aveInput type="text" size="sm" />
<ave-date-picker size="sm" [formField]="contract.signedOn" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.row')) {
      const [input, field] = [...row.querySelectorAll('input')];
      await expect(field?.getBoundingClientRect().height).toBe(input?.getBoundingClientRect().height);
      await expect(getComputedStyle(field ?? row).borderTopLeftRadius).toBe(
        getComputedStyle(input ?? row).borderTopLeftRadius,
      );
    }
  },
};

/** Compact density: every size one step down. */
export const Compact: Story = {
  decorators: [locale('ru')],
  render: frame('compact'),
  parameters: {
    docs: {
      source: {
        code: `<div data-density="compact">
  <ave-date-picker [formField]="contract.signedOn" />
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      const field = canvasElement.querySelector(`[data-row="${size}"] ave-date-picker input`);
      await expect(field?.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};

/**
 * Clearing (ADR 0052): the button empties an optional date field and leaves focus in its input; deleting the date and
 * pressing Enter does the same on the keyboard.
 */
export const Clearing: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-date-picker-clearing />', moduleMetadata: { imports: [DatePickerClearing] } }),
  parameters: { docs: { source: { code: '<ave-date-picker [formField]="payment.paidOn" />', language: 'html' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Дата оплаты' });
    const clear = canvas.getByRole('button', { name: 'Очистить Дата оплаты' });
    await expect(canvas.getAllByRole('button', { name: /^Очистить/ })).toHaveLength(1);
    const opener = canvas.getAllByRole('button', { name: 'Выбрать дату' })[0];
    await expect(clear.getBoundingClientRect().right).toBe(opener?.getBoundingClientRect().left);
    await userEvent.click(clear);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('status')).toHaveTextContent('Дата оплаты: не указана');
    await userEvent.type(input, '20.03.2026{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Дата оплаты: 2026-03-20');
    await userEvent.clear(input);
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Дата оплаты: не указана');
    await userEvent.type(input, '18.03.2026{Enter}');
    input.blur();
    await expect(canvas.getByRole('button', { name: 'Очистить Дата оплаты' })).toBeVisible();
  },
};

/** The heading opens the twelve months of the year: the chosen month filled, this month bordered (ADR 0053). */
export const Months: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(DatePickerStoryFrame)],
  render: () => ({ template: `<ave-date-picker label="Дата регистрации" value="2026-03-18" />` }),
  parameters: {
    docs: { source: { code: '<ave-date-picker [formField]="company.registeredOn" />', language: 'html' } },
  },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    const heading = within(dialog).getByRole('button', { name: 'Март 2026 г.' });
    await expect(heading).toHaveAccessibleDescription('Выбрать месяц');
    await userEvent.click(heading);
    await waitFor(() => expect(dialog.querySelector('[data-month]:focus')).toHaveAttribute('data-month', '2026-03'));
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('2026');
    await expect(within(dialog).getByRole('gridcell', { name: 'Март 2026 г.' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(within(dialog).getByRole('button', { name: 'Предыдущий год' })).toBeInTheDocument();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Май 2026 г.');
    await waitFor(() => expect(dialog.querySelector('[data-date]:focus')).toHaveAttribute('data-date', '2026-05-18'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Май 2026 г.' }));
    await waitFor(() => expect(dialog.querySelector('[data-month]:focus')).not.toBeNull());
  },
};

/**
 * From the months, the heading opens twelve years; the arrows move past the page's edges. Uzbek in Latin script, and
 * bounds from 2019 to 2030: the years outside them cannot be chosen.
 */
export const Years: Story = {
  decorators: [locale('uz-Latn'), componentWrapperDecorator(DatePickerStoryFrame)],
  render: () => ({
    template: `<ave-date-picker label="Roʻyxatdan oʻtgan sana" value="2026-03-18" minDate="2019-06-01" maxDate="2030-12-31" />`,
  }),
  parameters: {
    docs: {
      source: {
        code: '<ave-date-picker minDate="2019-06-01" maxDate="2030-12-31" [formField]="company.registeredOn" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await openCalendar(canvasElement);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mart, 2026' }));
    await userEvent.click(await within(dialog).findByRole('button', { name: '2026' }));
    await waitFor(() => expect(dialog.querySelector('[data-year]:focus')).toHaveAttribute('data-year', '2026'));
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('2016–2027');
    await expect(within(dialog).getByRole('gridcell', { name: '2018' })).toHaveAttribute('aria-disabled', 'true');
    await expect(within(dialog).getByRole('gridcell', { name: '2019' })).not.toHaveAttribute('aria-disabled', 'true');
    await expect(within(dialog).getByRole('button', { name: 'Keyingi yillar' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog.querySelector('[data-date]:focus')).toHaveAttribute('data-date', '2026-03-18'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mart, 2026' }));
    await userEvent.click(await within(dialog).findByRole('button', { name: '2026' }));
    await waitFor(() => expect(dialog.querySelector('[data-year]:focus')).not.toBeNull());
  },
};
