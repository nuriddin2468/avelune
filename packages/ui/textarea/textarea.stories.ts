import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveInput } from '@avelune/ui/input';
import { AveTextarea, type AveTextareaSize } from '@avelune/ui/textarea';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveTextareaSize[];

type View = 'sizes' | 'states' | 'long' | 'compact';

/** The frame the stories draw textareas in, with plain labels (FormField is a higher layer). Styled with tokens only. */
@Component({
  selector: 'ave-textarea-stories',
  imports: [AveInput, AveTextarea],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="columns">
          @for (size of sizes; track size) {
            <div class="stack" [attr.data-size]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <textarea
                aveTextarea
                rows="1"
                [size]="size"
                [attr.aria-label]="'One line, ' + size"
                placeholder="One line"
              ></textarea>
              <textarea
                aveTextarea
                [size]="size"
                [attr.aria-label]="'Subject, ' + size"
                placeholder="Three lines, the default"
              ></textarea>
            </div>
          }
        </div>
      }
      @case ('states') {
        <div class="grid" lang="ru">
          <label class="field">
            <span class="label">Empty</span>
            <textarea aveTextarea placeholder="Кратко: что поставляется и куда"></textarea>
          </label>
          <label class="field">
            <span class="label">Filled</span>
            <textarea aveTextarea [value]="subject"></textarea>
          </label>
          <label class="field">
            <span class="label">Focused</span>
            <textarea aveTextarea data-focus-target [value]="subject"></textarea>
          </label>
          <label class="field">
            <span class="label">Invalid</span>
            <textarea aveTextarea aria-invalid="true" [value]="short"></textarea>
          </label>
          <label class="field">
            <span class="label">Readonly</span>
            <textarea aveTextarea readonly [value]="subject"></textarea>
          </label>
          <label class="field">
            <span class="label">Disabled</span>
            <textarea aveTextarea disabled [value]="subject"></textarea>
          </label>
        </div>
      }
      @case ('compact') {
        <div class="columns" data-density="compact">
          @for (size of sizes; track size) {
            <div class="stack" [attr.data-size]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <textarea aveTextarea rows="1" [size]="size" [attr.aria-label]="'One line, ' + size"></textarea>
              <textarea aveTextarea [size]="size" [attr.aria-label]="'Subject, ' + size"></textarea>
            </div>
          }
        </div>
      }
      @default {
        <div class="stack narrow">
          <label class="field" lang="ru">
            <span class="label">Предмет договора</span>
            <textarea aveTextarea [value]="longRu"></textarea>
          </label>
          <label class="field" lang="uz-Latn">
            <span class="label">Shartnoma predmeti</span>
            <textarea aveTextarea [value]="longUz"></textarea>
          </label>
          <label class="field" lang="ru">
            <span class="label">Одно длинное слово</span>
            <textarea aveTextarea rows="2" [value]="longWord"></textarea>
          </label>
          <label class="field" lang="ru">
            <span class="label">Пусто</span>
            <textarea aveTextarea rows="2"></textarea>
          </label>
        </div>
      }
    }
  `,
  styleUrl: './textarea.stories.css',
})
class TextareaStories {
  readonly view = input<View>('states');
  protected readonly sizes = sizes;
  protected readonly subject = 'Поставка серверного оборудования для трёх филиалов, с монтажом и пусконаладкой.';
  protected readonly short = 'Поставка';
  protected readonly longRu =
    'Поставка, монтаж и пусконаладка серверного и сетевого оборудования для региональных филиалов ' +
    'Государственного унитарного предприятия «Центр электронного документооборота», включая обучение ' +
    'персонала, гарантийное обслуживание в течение тридцати шести месяцев и передачу исполнительной документации.';
  protected readonly longUz =
    'Oʻzbekiston Respublikasi Vazirlar Mahkamasi huzuridagi Elektron hujjat aylanishi markazining hududiy ' +
    'filiallari uchun server va tarmoq uskunalarini yetkazib berish, oʻrnatish va ishga tushirish.';
  protected readonly longWord = 'Электронногодокументооборотаиархивногохранениядокументовпредприятия';
}

/** A Signal Forms subject: required and at least 10 characters; invalid once touched. */
@Component({
  selector: 'ave-textarea-signal-forms',
  imports: [AveTextarea, FormField],
  template: `
    <label class="field narrow">
      <span class="label">Subject</span>
      <textarea aveTextarea [formField]="contract.subject"></textarea>
    </label>
    <p class="hint" role="status">
      {{ contract.subject().invalid() ? 'Invalid' : 'Valid' }} ·
      {{ contract.subject().touched() ? 'touched' : 'untouched' }}
    </p>
  `,
  styleUrl: './textarea.stories.css',
})
class SignalFormsDemo {
  protected readonly model = signal({ subject: '' });
  protected readonly contract = form(this.model, (path) => {
    required(path.subject);
    minLength(path.subject, 10);
  });
}

/** The same field with Reactive Forms. */
@Component({
  selector: 'ave-textarea-reactive-forms',
  imports: [AveTextarea, ReactiveFormsModule],
  template: `
    <label class="field narrow">
      <span class="label">Subject</span>
      <textarea aveTextarea [formControl]="subject"></textarea>
    </label>
    <p class="hint" role="status">
      {{ subject.invalid ? 'Invalid' : 'Valid' }} · {{ subject.touched ? 'touched' : 'untouched' }}
    </p>
  `,
  styleUrl: './textarea.stories.css',
})
class ReactiveFormsDemo {
  protected readonly subject = new FormControl('', {
    nonNullable: true,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    validators: [Validators.required, Validators.minLength(10)],
  });
}

/** Pads the Default story; styled with tokens only. */
@Component({
  selector: 'ave-textarea-story-frame',
  template: '<div class="narrow"><ng-content /></div>',
  styleUrl: './textarea.stories.css',
})
class TextareaStoryFrame {}

type Story = StoryObj<AveTextarea>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-textarea-stories [view]="view" />`,
    moduleMetadata: { imports: [TextareaStories] },
  });
}

/** What a textarea must share with an Input of its size (brief §8.2). */
function box(control: Element) {
  const style = getComputedStyle(control);
  return {
    border: style.borderTopWidth,
    radius: style.borderTopLeftRadius,
    padding: style.paddingInlineStart,
    fontSize: style.fontSize,
  };
}

const height = (element: Element | null | undefined) => element?.getBoundingClientRect().height;

async function typeAndLeave(canvasElement: HTMLElement, text: string): Promise<HTMLTextAreaElement> {
  const field = within(canvasElement).getByRole('textbox', { name: 'Subject' });
  if (!(field instanceof HTMLTextAreaElement)) throw new Error('No textarea');
  await userEvent.type(field, text);
  await userEvent.tab();
  return field;
}

const meta: Meta<AveTextarea> = {
  title: 'Components/Textarea',
  component: AveTextarea,
  args: { size: 'md', rows: 3 },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    rows: { control: { type: 'number', min: 1, max: 12 } },
  },
  render: (args) => ({
    props: args,
    template: `<textarea aveTextarea aria-label="Subject" placeholder="Кратко: что поставляется и куда" lang="ru" [size]="size" [rows]="rows"></textarea>`,
  }),
};
export default meta;

/** One textarea, with controls. */
export const Default: Story = {
  decorators: [moduleMetadata({ imports: [TextareaStoryFrame] }), componentWrapperDecorator(TextareaStoryFrame)],
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Subject' });
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('rows', '3');
    await expect(getComputedStyle(field).resize).toBe('block');
  },
};

/** Each size under an Input of that size: the same edge, corners and text; one row as tall as the input. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<input aveInput type="text" size="sm" />
<textarea aveTextarea size="sm" rows="1"></textarea>
<textarea aveTextarea size="sm"></textarea>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const column of canvasElement.querySelectorAll('.stack')) {
      const size = column.getAttribute('data-size') ?? '';
      const field = column.querySelector('input');
      const [oneLine, three] = [...column.querySelectorAll('textarea')];
      if (field === null || oneLine === undefined || three === undefined) throw new Error('No controls');
      await expect(box(oneLine), size).toEqual(box(field));
      await expect(height(oneLine), size).toBe(height(field));
      await expect(height(three), size).toBe((height(field) ?? 0) + 40);
    }
  },
};

/** Empty, filled, focused, invalid, readonly, disabled: one size in every state. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<textarea aveTextarea aria-invalid="true"></textarea>
<textarea aveTextarea readonly></textarea>
<textarea aveTextarea disabled></textarea>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // No state changes the size: every textarea is as tall as the first and fills its grid cell.
    const fields = [...canvasElement.querySelectorAll('textarea')];
    for (const field of fields) {
      await expect(height(field)).toBe(height(fields[0]));
      await expect(field.getBoundingClientRect().width).toBe(field.parentElement?.getBoundingClientRect().width);
    }
    const disabled = canvasElement.querySelector('textarea:disabled');
    await expect(disabled === null ? '' : getComputedStyle(disabled).resize).toBe('none');
    const focused = canvasElement.querySelector<HTMLTextAreaElement>('[data-focus-target]');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Signal Forms: the field turns invalid only once it has been left; Enter breaks the line. */
export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: '<ave-textarea-signal-forms />', moduleMetadata: { imports: [SignalFormsDemo] } }),
  parameters: {
    docs: {
      source: {
        code: `readonly contract = form(signal({ subject: '' }), (path) => {
  required(path.subject);
  minLength(path.subject, 10);
});

// <textarea aveTextarea [formField]="contract.subject"></textarea>`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Subject' });
    await expect(field).toBeRequired();
    await expect(field).not.toHaveAttribute('aria-invalid');
    await typeAndLeave(canvasElement, 'Поставка');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(field, '{Enter}оборудования');
    await expect(field).toHaveValue('Поставка\nоборудования');
    await expect(field).not.toHaveAttribute('aria-invalid');
    field.blur();
  },
};

/** Reactive Forms: the same field, the same states. */
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({ template: '<ave-textarea-reactive-forms />', moduleMetadata: { imports: [ReactiveFormsDemo] } }),
  parameters: {
    docs: {
      source: {
        code: `readonly subject = new FormControl('', { validators: [Validators.required, Validators.minLength(10)] });

// <textarea aveTextarea [formControl]="subject"></textarea>`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Subject' });
    await expect(field).not.toHaveAttribute('aria-invalid');
    await typeAndLeave(canvasElement, 'Поставка');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(field, ' оборудования');
    await expect(field).not.toHaveAttribute('aria-invalid');
    field.blur();
  },
};

/** Long Russian and Uzbek text scrolls inside the field, a long word wraps, and the field keeps its size. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: { source: { code: '<textarea aveTextarea [formField]="contract.subject"></textarea>', language: 'html' } },
  },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    const [ru, , word, empty] = [...canvasElement.querySelectorAll('textarea')];
    if (ru === undefined || word === undefined || empty === undefined) throw new Error('No textareas');
    // Three rows, and the rest scrolls; the long word wraps instead of widening the field.
    await expect(ru.scrollHeight).toBeGreaterThan(ru.clientHeight);
    await expect(word.scrollWidth).toBeLessThanOrEqual(word.clientWidth);
    await expect(height(word)).toBe(height(empty));
  },
};

/** Compact density: every size one step down, one row as tall as its Input. */
export const Compact: Story = {
  render: frame('compact'),
  parameters: {
    docs: {
      source: {
        code: `<div data-density="compact">
  <textarea aveTextarea size="sm" rows="1"></textarea>
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      const [oneLine, three] = [...canvasElement.querySelectorAll(`[data-size="${size}"] textarea`)];
      await expect(height(oneLine), size).toBe(heights[size]);
      await expect(height(three), size).toBe(heights[size] + 40);
    }
  },
};
