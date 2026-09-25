import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveDateRangePicker, type AveDatePickerSize, type AveDateRange } from '@avelune/ui/date-picker';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveDatePickerSize[];

type View = 'sizes' | 'states' | 'compact' | 'narrow';

/** The frame the stories draw range fields in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-date-range-picker-stories',
  imports: [AveDateRangePicker, AveInput],
  template: `
    @switch (view()) {
      @case ('states') {
        <div class="stack wide">
          <div class="field">
            <span class="label">Empty</span>
            <ave-date-range-picker label="Empty" />
          </div>
          <div class="field">
            <span class="label">Filled</span>
            <ave-date-range-picker label="Filled" [value]="period" />
          </div>
          <div class="field">
            <span class="label">Focused</span>
            <ave-date-range-picker label="Focused" data-focus-target [value]="period" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-date-range-picker label="Readonly" readonly [value]="period" />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-date-range-picker label="Disabled" disabled [value]="period" />
          </div>
        </div>
      }
      @case ('narrow') {
        <div class="narrower">
          <ave-date-range-picker label="Срок действия" [value]="longPeriod" />
        </div>
      }
      @default {
        <div class="stack wide" [attr.data-density]="view() === 'compact' ? 'compact' : null">
          @for (size of sizes; track size) {
            <div class="pair" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-date-range-picker [label]="'Term, ' + size" [size]="size" [value]="period" />
            </div>
          }
        </div>
      }
    }
  `,
  styleUrl: './date-picker.stories.css',
})
class DateRangeStories {
  readonly view = input<View>('states');
  protected readonly sizes = sizes;
  protected readonly period: AveDateRange = { start: '2026-03-09', end: '2026-03-20' };
  protected readonly longPeriod: AveDateRange = { start: '2026-03-09', end: '2026-12-31' };
}

/** Signal Forms and Reactive Forms: one required period each. */
@Component({
  selector: 'ave-date-range-picker-forms',
  imports: [AveDateRangePicker, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow room">
      <div class="field">
        <span class="label">Period (Signal Forms)</span>
        <ave-date-range-picker label="Period (Signal Forms)" [formField]="contract.period" />
      </div>
      <div class="field">
        <span class="label">Period (Reactive Forms)</span>
        <ave-date-range-picker label="Period (Reactive Forms)" [formControl]="period" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().period?.start ?? '…' }} – {{ model().period?.end ?? '…' }} · Reactive Forms:
      {{ period.value?.start ?? '…' }} – {{ period.value?.end ?? '…' }}
    </p>
  `,
  styleUrl: './date-picker.stories.css',
})
class DateRangeForms {
  protected readonly model = signal<{ period: AveDateRange | null }>({ period: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.period);
  });
  protected readonly period = new FormControl<AveDateRange | null>({ start: '2026-03-02', end: '2026-03-27' });
}

/**
 * Long Uzbek labels, hints and an error around two periods in a 320px column: a filled one, and a required one left
 * empty, whose error shows at once.
 */
@Component({
  selector: 'ave-date-range-picker-long',
  imports: [AveDateRangePicker, AveError, AveFormField, AveHint, FormField],
  template: `
    <div class="stack narrow" lang="uz-Latn">
      <ave-form-field label="Shartnomaning amal qilish muddati (majburiyatlar toʻliq bajarilgunga qadar)">
        <ave-date-range-picker [formField]="contract.term" />
        <p aveHint>Kuchga kirgan kundan boshlab majburiyatlar toʻliq bajarilgunga qadar.</p>
      </ave-form-field>
      <ave-form-field label="Sinov muddati">
        <ave-date-range-picker [formField]="contract.probation" />
        <p aveError>Sinov muddatini kiriting, masalan 01/04/2026&nbsp;– 30/06/2026.</p>
      </ave-form-field>
    </div>
  `,
  styleUrl: './date-picker.stories.css',
})
class DateRangeLong {
  protected readonly model = signal<{ term: AveDateRange | null; probation: AveDateRange | null }>({
    term: { start: '2026-03-09', end: '2026-12-31' },
    probation: null,
  });
  protected readonly contract = form(this.model, (path) => {
    required(path.probation);
  });

  constructor() {
    this.contract.probation().markAsTouched();
  }
}

/** Pads the single-field stories, with room for the calendar. */
@Component({
  selector: 'ave-date-range-picker-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './date-picker.stories.css',
})
class DateRangeStoryFrame {}

type Story = StoryObj;

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-date-range-picker-stories [view]="view" />`,
    moduleMetadata: { imports: [DateRangeStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

// No `component`: Storybook instantiates a meta's component outside an injection context, where `model()` throws.
const meta: Meta = {
  title: 'Components/DateRangePicker',
  decorators: [moduleMetadata({ imports: [AveDateRangePicker, DateRangeStoryFrame] })],
  render: () => ({
    props: { period: { start: '2026-03-09', end: '2026-03-20' } },
    template: `<ave-date-range-picker label="Срок действия" [value]="period" />`,
  }),
};
export default meta;

/** One range field in Russian. */
export const Default: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(DateRangeStoryFrame)],
  parameters: source('<ave-date-range-picker [formField]="contract.period" />'),
  play: async ({ canvasElement }) => {
    const [start, end] = within(canvasElement).getAllByRole('textbox');
    await expect(start).toHaveValue('09.03.2026');
    await expect(end).toHaveValue('20.03.2026');
    await expect(start).toHaveAccessibleName('Срок действия Дата начала');
    await expect(end).toHaveAccessibleName('Срок действия Дата окончания');
  },
};

/** The calendar marks the range: its ends filled, the days between tinted. */
export const Open: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru'), componentWrapperDecorator(DateRangeStoryFrame)],
  parameters: source('<ave-date-range-picker [formField]="contract.period" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Выбрать дату' }));
    const dialog = await canvas.findByRole('dialog');
    await waitFor(() => expect(dialog.querySelector('[data-date]:focus')).not.toBeNull());
    await expect(dialog.querySelectorAll('[data-range="between"]')).toHaveLength(10);
    await expect(dialog.querySelector('[data-range="start"]')).toHaveAttribute('data-date', '2026-03-09');
  },
};

/** Choosing a range: the first day sets the start, the second the end, and the calendar closes. */
export const Choosing: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(DateRangeStoryFrame)],
  render: () => ({ template: `<ave-date-range-picker label="Срок действия" />` }),
  parameters: source('<ave-date-range-picker [formField]="contract.period" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getAllByRole('textbox')[0] ?? canvasElement, '02.03.2026');
    await userEvent.click(canvas.getByRole('button', { name: 'Выбрать дату' }));
    const dialog = await canvas.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('gridcell', { name: '13 марта 2026 г.' }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await expect(canvas.getAllByRole('textbox')[1]).toHaveValue('13.03.2026');
  },
};

/** Empty, filled, focused, readonly, disabled. Invalid is in the Forms and Long text stories. */
export const States: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru')],
  render: frame('states'),
  parameters: source('<ave-date-range-picker readonly />', '<ave-date-range-picker disabled />'),
  play: async ({ canvasElement }) => {
    for (const input of canvasElement.querySelectorAll('input'))
      await expect(input.getBoundingClientRect().height).toBe(36);
    const disabled = canvasElement.querySelectorAll<HTMLInputElement>('[label="Disabled"] input');
    for (const input of disabled) await expect(input).toBeDisabled();
    const focused = canvasElement.querySelector<HTMLInputElement>('[data-focus-target] input');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Both form APIs: a required period, invalid once left empty. */
export const Forms: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-date-range-picker-forms />', moduleMetadata: { imports: [DateRangeForms] } }),
  parameters: source(
    '<ave-date-range-picker [formField]="contract.period" />',
    '<ave-date-range-picker [formControl]="period" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalStart = canvas.getByRole('textbox', { name: 'Period (Signal Forms) Дата начала' });
    await userEvent.click(signalStart);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(signalStart).toHaveAttribute('aria-invalid', 'true'));
    await expect(canvas.getByRole('textbox', { name: 'Period (Signal Forms) Дата окончания' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: 2026-03-02 – 2026-03-27');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Long Uzbek labels, a hint and an error wrap in a 320px column; the dates fit their inputs. */
export const LongText: Story = {
  name: 'Long text',
  decorators: [locale('uz-Latn')],
  render: () => ({ template: '<ave-date-range-picker-long />', moduleMetadata: { imports: [DateRangeLong] } }),
  parameters: source(
    '<ave-form-field label="Shartnomaning amal qilish muddati (…)">',
    '  <ave-date-range-picker [formField]="contract.term" />',
    '  <p aveHint>…</p>',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    const inputs = [...canvasElement.querySelectorAll('input')];
    await expect(inputs.map((input) => input.value)).toEqual(['09/03/2026', '31/12/2026', '', '']);
    for (const input of inputs) {
      await expect(input.getBoundingClientRect().height).toBe(36);
      await expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
    }
    await expect(inputs[2]).toHaveAccessibleName('Sinov muddati Boshlanish sanasi');
    await expect(inputs[3]).toHaveAttribute('aria-invalid', 'true');
    await expect(inputs[3]).toHaveAccessibleDescription(/^Sinov muddatini kiriting/);
  },
};

/** Narrower than 320px, the end input goes under the start input, and the dash is left out. */
export const Narrow: Story = {
  decorators: [locale('ru')],
  render: frame('narrow'),
  play: async ({ canvasElement }) => {
    const [start, end] = within(canvasElement).getAllByRole('textbox');
    if (start === undefined || end === undefined) throw new Error('No inputs');
    await expect(end.getBoundingClientRect().top).toBeGreaterThan(start.getBoundingClientRect().bottom);
    await expect(end.getBoundingClientRect().width).toBe(start.getBoundingClientRect().width);
    await expect(end.scrollWidth).toBeLessThanOrEqual(end.clientWidth);
  },
};

/** Each size under an Input of that size: the same box for both inputs. */
export const Sizes: Story = {
  decorators: [locale('ru')],
  render: frame('sizes'),
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.pair')) {
      const [input, ...range] = [...row.querySelectorAll('input')];
      for (const field of range) {
        await expect(field.getBoundingClientRect().height).toBe(input?.getBoundingClientRect().height);
        await expect(getComputedStyle(field).borderTopLeftRadius).toBe(
          getComputedStyle(input ?? row).borderTopLeftRadius,
        );
      }
    }
  },
};

/** Compact density: every size one step down. */
export const Compact: Story = {
  decorators: [locale('ru')],
  render: frame('compact'),
  parameters: source('<div data-density="compact">', '  <ave-date-range-picker />', '</div>'),
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      for (const field of canvasElement.querySelectorAll(`[data-row="${size}"] ave-date-range-picker input`))
        await expect(field.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};
