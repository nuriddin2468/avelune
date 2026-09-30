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
import {
  AveDateRangePicker,
  type AveDatePickerSize,
  type AveDateRange,
  type AveDateRangePreset,
} from '@avelune/ui/date-picker';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { today } from './calendar-math';
import { presetPeriod } from './presets';

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

/**
 * Clearing (ADR 0052): an optional range has a wider end input with the clear button before the calendar button, at
 * 320px and wider; a required range keeps two equal inputs.
 */
@Component({
  selector: 'ave-date-range-picker-clearing',
  imports: [AveDateRangePicker, FormField],
  template: `
    <div class="stack narrow">
      <div class="field">
        <span class="label">Можно очистить</span>
        <ave-date-range-picker label="Отпуск" [(value)]="leave" />
      </div>
      <div class="field">
        <span class="label">Можно очистить, пусто</span>
        <ave-date-range-picker label="Командировка" />
      </div>
      <div class="field">
        <span class="label">Обязательный</span>
        <ave-date-range-picker label="Срок действия (обязательный)" [formField]="contract.term" />
      </div>
    </div>
    <p class="status" role="status">Отпуск: {{ leave()?.start ?? '…' }} – {{ leave()?.end ?? '…' }}</p>
  `,
  styleUrl: './date-picker.stories.css',
})
class DateRangeClearing {
  protected readonly leave = signal<AveDateRange | null>({ start: '2026-07-06', end: '2026-07-24' });
  protected readonly model = signal<{ term: AveDateRange | null }>({
    term: { start: '2026-03-09', end: '2026-12-31' },
  });
  protected readonly contract = form(this.model, (path) => {
    required(path.term);
  });
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

const meta: Meta = {
  title: 'Components/DateRangePicker',
  component: AveDateRangePicker,
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
  parameters: {
    docs: { source: { code: '<ave-date-range-picker [formField]="contract.period" />', language: 'html' } },
  },
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
  parameters: {
    docs: { source: { code: '<ave-date-range-picker [formField]="contract.period" />', language: 'html' } },
  },
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
  parameters: {
    docs: { source: { code: '<ave-date-range-picker [formField]="contract.period" />', language: 'html' } },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<ave-date-range-picker readonly />
<ave-date-range-picker disabled />`,
        language: 'html',
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<ave-date-range-picker [formField]="contract.period" />
<ave-date-range-picker [formControl]="period" />`,
        language: 'html',
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<ave-form-field label="Shartnomaning amal qilish muddati (…)">
  <ave-date-range-picker [formField]="contract.term" />
  <p aveHint>…</p>
</ave-form-field>`,
        language: 'html',
      },
    },
  },
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
  parameters: {
    docs: { source: { code: '<ave-date-range-picker label="Срок действия" [value]="term" />', language: 'html' } },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<input aveInput type="text" size="sm" />
<ave-date-range-picker size="sm" [formField]="contract.period" />`,
        language: 'html',
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<div data-density="compact">
  <ave-date-range-picker />
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      for (const field of canvasElement.querySelectorAll(`[data-row="${size}"] ave-date-range-picker input`))
        await expect(field.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};

/**
 * Clearing (ADR 0052): the button empties both dates of an optional range and moves focus to the start input; the end
 * input keeps its width, and both dates show in full in a 320px column.
 */
export const Clearing: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-date-range-picker-clearing />', moduleMetadata: { imports: [DateRangeClearing] } }),
  parameters: { docs: { source: { code: '<ave-date-range-picker [formField]="request.leave" />', language: 'html' } } },
  play: async ({ canvasElement }) => {
    // The dash's column follows the font: measure once the kit's font has replaced the fallback.
    await document.fonts.ready;
    const canvas = within(canvasElement);
    const start = canvas.getByRole('textbox', { name: 'Отпуск Дата начала' });
    const end = canvas.getByRole('textbox', { name: 'Отпуск Дата окончания' });
    const clear = canvas.getByRole('button', { name: 'Очистить Отпуск' });
    await expect(canvas.getAllByRole('button', { name: /^Очистить/ })).toHaveLength(1);
    for (const input of canvasElement.querySelectorAll('input')) {
      await expect(input.scrollWidth).toBeLessThanOrEqual(input.clientWidth);
    }
    const [, emptyEnd] = canvas.getAllByRole('textbox', { name: /^Командировка/ });
    const [requiredStart, requiredEnd] = canvas.getAllByRole('textbox', { name: /^Срок действия/ });
    await expect(end.getBoundingClientRect().width).toBeGreaterThan(start.getBoundingClientRect().width);
    await expect(emptyEnd?.getBoundingClientRect().width).toBeCloseTo(end.getBoundingClientRect().width, 1);
    await expect(requiredEnd?.getBoundingClientRect().width).toBeCloseTo(
      requiredStart?.getBoundingClientRect().width ?? 0,
      1,
    );
    const width = end.getBoundingClientRect().width;
    await userEvent.click(clear);
    await expect(start).toHaveFocus();
    await expect([start, end].map((input) => (input as HTMLInputElement).value)).toEqual(['', '']);
    await expect(canvas.getByRole('status')).toHaveTextContent('Отпуск: … – …');
    await expect(end.getBoundingClientRect().width).toBe(width);
    await userEvent.type(start, '06.07.2026');
    await userEvent.type(end, '24.07.2026{Enter}');
    (document.activeElement as HTMLElement | null)?.blur();
    await expect(canvas.getByRole('button', { name: 'Очистить Отпуск' })).toBeVisible();
  },
};

/** Every preset the kit names, and one of the application's own (ADR 0054). */
const presets: readonly AveDateRangePreset[] = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  'last7Days',
  'last30Days',
  { label: 'Первое полугодие 2026 г.', start: '2026-01-01', end: '2026-06-30' },
];

/**
 * Presets beside the calendar from a window of 600px, above it in a narrower one: a choice sets the range and closes
 * the calendar; the preset of the range chosen now has a check.
 */
export const Presets: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(DateRangeStoryFrame)],
  render: () => ({
    props: { presets },
    template: `<ave-date-range-picker label="Период отчёта" [presets]="presets" />`,
  }),
  parameters: {
    docs: {
      source: {
        code: "<ave-date-range-picker [presets]=\"['today', 'thisWeek', 'lastMonth', 'last30Days', …]\" [formField]=\"report.period\" />",
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Выбрать дату' }));
    const dialog = await canvas.findByRole('dialog');
    const list = within(dialog).getByRole('listbox', { name: 'Периоды' });
    await expect(within(list).getAllByRole('option')).toHaveLength(presets.length);
    await userEvent.click(within(list).getByRole('option', { name: 'Этот месяц' }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    const month = presetPeriod('thisMonth', today(), 1);
    const [start, end] = canvas.getAllByRole('textbox');
    const written = (date: string) => date.split('-').reverse().join('.');
    await expect(start).toHaveValue(written(month.start));
    await expect(end).toHaveValue(written(month.end));
    await userEvent.click(canvas.getByRole('button', { name: 'Выбрать дату' }));
    const again = await canvas.findByRole('dialog');
    await expect(within(again).getByRole('option', { name: 'Этот месяц' })).toHaveAttribute('aria-selected', 'true');
  },
};

/** Bounds of this month, in Uzbek: the presets outside them are disabled, the rest cut to them. */
export const PresetsBounds: Story = {
  name: 'Presets and bounds',
  decorators: [locale('uz-Latn'), componentWrapperDecorator(DateRangeStoryFrame)],
  render: () => {
    const month = presetPeriod('thisMonth', today(), 1);
    return {
      props: { presets, minDate: month.start, maxDate: month.end },
      template: `<ave-date-range-picker label="Hisobot davri" [minDate]="minDate" [maxDate]="maxDate" [presets]="presets" />`,
    };
  },
  parameters: {
    docs: {
      source: { code: '<ave-date-range-picker [minDate]="…" [maxDate]="…" [presets]="presets" />', language: 'html' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Sanani tanlash' }));
    const dialog = await canvas.findByRole('dialog');
    const list = within(dialog).getByRole('listbox', { name: 'Davrlar' });
    await expect(within(list).getByRole('option', { name: 'Oʻtgan oy' })).toHaveAttribute('aria-disabled', 'true');
    await expect(within(list).getByRole('option', { name: 'Shu oy' })).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(within(list).getByRole('option', { name: 'Shu yil' }));
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'Sanani tanlash' }));
    const again = await canvas.findByRole('dialog');
    // This year, cut to this month, has this month's period: the preset chosen keeps the check.
    await expect(within(again).getByRole('option', { name: 'Shu yil' })).toHaveAttribute('aria-selected', 'true');
    await expect(within(again).getByRole('option', { name: 'Shu oy' })).toHaveAttribute('aria-selected', 'false');
  },
};
