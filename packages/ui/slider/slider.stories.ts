import { Component, LOCALE_ID, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, min } from '@angular/forms/signals';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveRangeSlider, AveSlider, type AveNumberRange } from '@avelune/ui/slider';

const percent: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent' };
const hours: Intl.NumberFormatOptions = { style: 'unit', unit: 'hour' };

/** Matches a value written with any space between the number and its unit (Intl's is a no-break one). */
function written(text: string): RegExp {
  return new RegExp(`^${text.replace(/ /g, '\\s')}$`);
}

/** The states, one field each, in a narrow column. */
@Component({
  selector: 'ave-slider-states',
  imports: [AveFormField, AveRangeSlider, AveSlider],
  template: `
    <div class="stack narrow">
      <ave-form-field label="Rest">
        <ave-slider [maxValue]="50" [step]="5" [format]="percent" [value]="15" />
      </ave-form-field>
      <ave-form-field label="Focused">
        <ave-slider data-focus-target [maxValue]="50" [step]="5" [format]="percent" [value]="30" />
      </ave-form-field>
      <ave-form-field label="Disabled">
        <ave-slider disabled [maxValue]="50" [step]="5" [format]="percent" [value]="15" />
      </ave-form-field>
      <ave-form-field label="Range">
        <ave-range-slider [maxValue]="24" [format]="hours" [value]="{ start: 9, end: 18 }" />
      </ave-form-field>
      <ave-form-field label="Range, disabled">
        <ave-range-slider disabled [maxValue]="24" [format]="hours" [value]="{ start: 9, end: 18 }" />
      </ave-form-field>
    </div>
  `,
  styleUrl: './slider.stories.css',
})
class SliderStates {
  protected readonly percent = percent;
  protected readonly hours = hours;
}

/** Signal Forms with a rule, and Reactive Forms on a range. */
@Component({
  selector: 'ave-slider-forms',
  imports: [AveError, AveFormField, AveHint, AveRangeSlider, AveSlider, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow">
      <ave-form-field label="Advance (Signal Forms)">
        <ave-slider [maxValue]="50" [step]="5" [format]="percent" [formField]="contract.advance" />
        <p aveHint>At least 10 % of the amount.</p>
        <p aveError>An advance under 10 % needs the finance department's approval.</p>
      </ave-form-field>
      <ave-form-field label="Delivery hours (Reactive Forms)">
        <ave-range-slider [maxValue]="24" [format]="hours" [formControl]="delivery" />
      </ave-form-field>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().advance }} · Reactive Forms: {{ delivery.value.start }}–{{ delivery.value.end }}
    </p>
  `,
  styleUrl: './slider.stories.css',
})
class SliderForms {
  protected readonly percent = percent;
  protected readonly hours = hours;
  protected readonly model = signal({ advance: 20 });
  protected readonly contract = form(this.model, (path) => {
    min(path.advance, 10);
  });
  protected readonly delivery = new FormControl<AveNumberRange>({ start: 9, end: 18 }, { nonNullable: true });
}

/** A long Russian label and hint with a long value, in a 320px column. */
@Component({
  selector: 'ave-slider-long',
  imports: [AveFormField, AveHint, AveSlider],
  template: `
    <div class="stack narrow">
      <ave-form-field label="Предельная сумма договора без согласования с финансовым департаментом">
        <ave-slider [maxValue]="1000000000" [step]="50000000" [value]="750000000" />
        <p aveHint>Договоры на большую сумму уходят на согласование в финансовый департамент автоматически.</p>
      </ave-form-field>
    </div>
  `,
  styleUrl: './slider.stories.css',
})
class SliderLong {}

/** Pads the single-field stories. */
@Component({
  selector: 'ave-slider-story-frame',
  template: '<div class="narrow"><ng-content /></div>',
  styleUrl: './slider.stories.css',
})
class SliderStoryFrame {}

type Story = StoryObj;

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

// No `component`: Storybook instantiates a meta's component outside an injection context, where `model()` throws.
const meta: Meta = {
  title: 'Components/Slider',
  decorators: [moduleMetadata({ imports: [AveFormField, AveHint, AveRangeSlider, AveSlider, SliderStoryFrame] })],
  render: () => ({
    props: { percent },
    template: `
      <ave-form-field label="Аванс">
        <ave-slider [maxValue]="50" [step]="5" [format]="percent" [value]="15" />
        <p aveHint>Доля суммы договора, которую платят до поставки.</p>
      </ave-form-field>
    `,
  }),
};
export default meta;

/** One value in Russian: the value in the label row, the bounds under the track's ends. */
export const Default: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(SliderStoryFrame)],
  parameters: source(
    '<ave-form-field label="Аванс">',
    '  <ave-slider [maxValue]="50" [step]="5" [format]="{ style: \'unit\', unit: \'percent\' }" [formField]="contract.advance" />',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Аванс' });
    await expect(slider).toHaveAttribute('aria-valuetext', expect.stringMatching(written('15 %')));
    await expect(canvasElement.querySelector('ave-form-field .value')).toHaveTextContent('15 %');
    await expect(slider.getBoundingClientRect().height).toBe(24);
  },
};

/** A range of hours: the part between the thumbs chosen, each thumb named by its end. */
export const Range: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(SliderStoryFrame)],
  render: () => ({
    props: { hours },
    template: `
      <ave-form-field label="Часы доставки писем">
        <ave-range-slider [maxValue]="24" [format]="hours" [value]="{ start: 9, end: 18 }" />
        <p aveHint>Письма о договорах приходят только в эти часы.</p>
      </ave-form-field>
    `,
  }),
  parameters: source(
    '<ave-range-slider [maxValue]="24" [format]="{ style: \'unit\', unit: \'hour\' }" [formField]="settings.hours" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lower = canvas.getByRole('slider', { name: 'Часы доставки писем Минимум' });
    const upper = canvas.getByRole('slider', { name: 'Часы доставки писем Максимум' });
    await expect(lower).toHaveValue('9');
    await expect(upper).toHaveValue('18');
    await expect(canvasElement.querySelector('ave-form-field .value')).toHaveTextContent('9 ч – 18 ч');
  },
};

/** Rest, focused (the ring on the thumb), disabled; a range and a disabled range. */
export const States: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-slider-states />', moduleMetadata: { imports: [SliderStates] } }),
  parameters: source('<ave-slider disabled />', '<ave-range-slider disabled />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const slider of canvasElement.querySelectorAll('input[type=range]'))
      await expect(slider.getBoundingClientRect().height).toBe(24);
    await expect(canvas.getByRole('slider', { name: 'Disabled' })).toBeDisabled();
    const focused = canvas.getByRole('slider', { name: 'Focused' });
    await userEvent.click(canvas.getByRole('slider', { name: 'Rest' }));
    await userEvent.tab();
    await expect(focused).toHaveFocus();
    await expect(focused.matches(':focus-visible')).toBe(true);
  },
};

/** Moves a slider's thumb as a drag does: the input takes the value and says so. */
function drag(slider: HTMLElement, value: number): void {
  if (!(slider instanceof HTMLInputElement)) throw new Error('Not a range input');
  slider.value = String(value);
  slider.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Both form APIs: a schema's rule marks a low advance invalid once the slider is left; a range's thumbs stop at each other. */
export const Forms: Story = {
  decorators: [locale('en-US')],
  render: () => ({ template: '<ave-slider-forms />', moduleMetadata: { imports: [SliderForms] } }),
  parameters: source(
    '<ave-slider [maxValue]="50" [step]="5" [formField]="contract.advance" />',
    '<ave-range-slider [maxValue]="24" [formControl]="delivery" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const advance = canvas.getByRole('slider', { name: 'Advance (Signal Forms)' });
    advance.focus();
    drag(advance, 5);
    await userEvent.tab();
    await waitFor(() => expect(advance).toHaveAttribute('aria-invalid', 'true'));
    await expect(canvas.getByRole('status')).toHaveTextContent('Signal Forms: 5');
    const lower = canvas.getByRole('slider', { name: 'Delivery hours (Reactive Forms) Minimum' });
    await expect(lower).toHaveFocus();
    drag(lower, 20);
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: 18–18'));
    await expect(lower).toHaveValue('18');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A long label wraps under its value, which stays at the end of the first line. */
export const LongText: Story = {
  name: 'Long text',
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-slider-long />', moduleMetadata: { imports: [SliderLong] } }),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    const label = canvasElement.querySelector('label');
    const value = canvasElement.querySelector('ave-form-field .value');
    await expect(value).toHaveTextContent('750 000 000');
    await expect(label?.getClientRects().length).toBeGreaterThan(0);
    await expect(value?.getBoundingClientRect().right).toBeLessThanOrEqual(column.getBoundingClientRect().right);
    await expect(label?.getBoundingClientRect().height).toBeGreaterThan(20);
  },
};

/** Uzbek in Latin script: a decimal comma, which Chromium would write as a point (ADR 0050). */
export const UzbekLatin: Story = {
  name: 'Uzbek (Latin)',
  decorators: [locale('uz-Latn'), componentWrapperDecorator(SliderStoryFrame)],
  render: () => ({
    template: `
      <ave-form-field label="Ish tajribasi, yil">
        <ave-slider [maxValue]="10" [step]="0.5" [value]="2.5" [format]="{ maximumFractionDigits: 1 }" />
      </ave-form-field>
    `,
  }),
  play: async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Ish tajribasi, yil' });
    await expect(slider).toHaveAttribute('aria-valuetext', '2,5');
    await expect(canvasElement.querySelector('ave-form-field .value')).toHaveTextContent('2,5');
  },
};

/**
 * Compact density: nothing changes. Density sets the controls' heights and padding, and the slider has neither: it
 * keeps its 24px target, and the field keeps its spacing.
 */
export const Compact: Story = {
  decorators: [
    locale('ru'),
    componentWrapperDecorator(SliderStoryFrame),
    componentWrapperDecorator((story) => `<div data-density="compact">${story}</div>`),
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('slider').getBoundingClientRect().height).toBe(24);
  },
};
