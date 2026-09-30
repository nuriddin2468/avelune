import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, email, form, required } from '@angular/forms/signals';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveInput, type AveInputSize } from '@avelune/ui/input';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveInputSize[];

type View = 'sizes' | 'states' | 'long' | 'compact';

/** The frame the stories draw inputs in, with plain labels until FormField. Styled with tokens only. */
@Component({
  selector: 'ave-input-stories',
  imports: [AveButton, AveInput],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="stack">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-size]="size">
              <input
                aveInput
                type="search"
                [size]="size"
                [attr.aria-label]="'Search, ' + size"
                placeholder="Search documents"
              />
              <button aveButton type="button" [size]="size">Search</button>
            </div>
          }
        </div>
      }
      @case ('states') {
        <div class="grid">
          <label class="field">
            <span class="label">Empty</span>
            <input aveInput type="text" placeholder="ДК-2026/000" />
          </label>
          <label class="field">
            <span class="label">Filled</span>
            <input aveInput type="text" value="ДК-2026/114" />
          </label>
          <label class="field">
            <span class="label">Focused</span>
            <input aveInput type="text" value="ДК-2026/114" data-focus-target />
          </label>
          <label class="field">
            <span class="label">Invalid</span>
            <input aveInput type="text" value="2026/114" aria-invalid="true" />
          </label>
          <label class="field">
            <span class="label">Readonly</span>
            <input aveInput type="text" value="ДК-2026/114" readonly />
          </label>
          <label class="field">
            <span class="label">Disabled</span>
            <input aveInput type="text" value="ДК-2026/114" disabled />
          </label>
        </div>
      }
      @case ('compact') {
        <div class="stack" data-density="compact">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-size]="size">
              <input
                aveInput
                type="search"
                [size]="size"
                [attr.aria-label]="'Search, ' + size"
                placeholder="Search documents"
              />
              <button aveButton type="button" [size]="size">Search</button>
            </div>
          }
        </div>
      }
      @default {
        <div class="stack narrow">
          <label class="field" lang="ru">
            <span class="label">Наименование организации</span>
            <input
              aveInput
              type="text"
              value="Государственное унитарное предприятие «Центр электронного документооборота»"
            />
          </label>
          <label class="field" lang="uz-Latn">
            <span class="label">Tashkilot nomi</span>
            <input aveInput type="text" placeholder="Oʻzbekiston Respublikasi Vazirlar Mahkamasi huzuridagi agentlik" />
          </label>
        </div>
      }
    }
  `,
  styleUrl: './input.stories.css',
})
class InputStories {
  readonly view = input<View>('states');
  protected readonly sizes = sizes;
}

/** A Signal Forms email field: required and an address; invalid once touched. */
@Component({
  selector: 'ave-input-signal-forms',
  imports: [AveInput, FormField],
  template: `
    <label class="field narrow">
      <span class="label">Email</span>
      <input aveInput type="email" [formField]="contact.email" />
    </label>
    <p class="hint" role="status">
      {{ contact.email().invalid() ? 'Invalid' : 'Valid' }} · {{ contact.email().touched() ? 'touched' : 'untouched' }}
    </p>
  `,
  styleUrl: './input.stories.css',
})
class SignalFormsDemo {
  protected readonly model = signal({ email: '' });
  protected readonly contact = form(this.model, (path) => {
    required(path.email);
    email(path.email);
  });
}

/** The same field with Reactive Forms. */
@Component({
  selector: 'ave-input-reactive-forms',
  imports: [AveInput, ReactiveFormsModule],
  template: `
    <label class="field narrow">
      <span class="label">Email</span>
      <input aveInput type="email" [formControl]="email" />
    </label>
    <p class="hint" role="status">
      {{ email.invalid ? 'Invalid' : 'Valid' }} · {{ email.touched ? 'touched' : 'untouched' }}
    </p>
  `,
  styleUrl: './input.stories.css',
})
class ReactiveFormsDemo {
  protected readonly email = new FormControl('', {
    nonNullable: true,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    validators: [Validators.required, Validators.email],
  });
}

/** Pads the Default story; styled with tokens only. */
@Component({
  selector: 'ave-input-story-frame',
  template: '<div class="narrow"><ng-content /></div>',
  styleUrl: './input.stories.css',
})
class InputStoryFrame {}

type Story = StoryObj<AveInput>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-input-stories [view]="view" />`,
    moduleMetadata: { imports: [InputStories] },
  });
}

/** What a field of a size must share with a Button of that size (brief §8.2). */
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

async function typeAndLeave(canvasElement: HTMLElement, text: string): Promise<HTMLInputElement> {
  const field = within(canvasElement).getByRole('textbox', { name: 'Email' });
  if (!(field instanceof HTMLInputElement)) throw new Error('No input');
  await userEvent.type(field, text);
  await userEvent.tab();
  return field;
}

const meta: Meta<AveInput> = {
  title: 'Components/Input',
  component: AveInput,
  args: { size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => ({
    props: args,
    template: `<input aveInput type="text" aria-label="Contract number" placeholder="ДК-2026/000" [size]="size" />`,
  }),
};
export default meta;

/** One input, with controls. */
export const Default: Story = {
  decorators: [moduleMetadata({ imports: [InputStoryFrame] }), componentWrapperDecorator(InputStoryFrame)],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('textbox', { name: 'Contract number' })).toBeVisible();
  },
};

/** Each size next to a Button of that size: the same box. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<input aveInput type="search" size="sm" aria-label="Search" />
<button aveButton type="button" size="sm">Search</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.row')) {
      const field = row.querySelector('input');
      const button = row.querySelector('button');
      if (field === null || button === null) throw new Error('No controls');
      await expect(box(field), row.getAttribute('data-size') ?? '').toEqual(box(button));
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
        code: `<input aveInput type="text" aria-invalid="true" />
<input aveInput type="text" readonly />
<input aveInput type="text" disabled />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // No state changes the size: every field is as tall as the first and fills its grid cell (whose widths differ by
    // a fraction of a pixel, as the grid shares out the row).
    const fields = [...canvasElement.querySelectorAll('input')];
    const height = fields[0]?.getBoundingClientRect().height;
    for (const field of fields) {
      await expect(field.getBoundingClientRect().height).toBe(height);
      await expect(field.getBoundingClientRect().width).toBe(field.parentElement?.getBoundingClientRect().width);
    }
    const focused = canvasElement.querySelector<HTMLInputElement>('[data-focus-target]');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Signal Forms: the field turns invalid only once it has been left. */
export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: '<ave-input-signal-forms />', moduleMetadata: { imports: [SignalFormsDemo] } }),
  parameters: {
    docs: {
      source: {
        language: 'typescript',
        code: `readonly contact = form(signal({ email: '' }), (path) => {
  required(path.email);
  email(path.email);
});

// <input aveInput type="email" [formField]="contact.email" />`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Email' });
    await expect(field).toBeRequired();
    await expect(field).not.toHaveAttribute('aria-invalid');
    await typeAndLeave(canvasElement, 'nodira@');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

/** Reactive Forms: the same field, the same states. */
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({ template: '<ave-input-reactive-forms />', moduleMetadata: { imports: [ReactiveFormsDemo] } }),
  parameters: {
    docs: {
      source: {
        language: 'typescript',
        code: `readonly email = new FormControl('', { validators: [Validators.required, Validators.email] });

// <input aveInput type="email" [formControl]="email" />`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Email' });
    await expect(field).not.toHaveAttribute('aria-invalid');
    await typeAndLeave(canvasElement, 'nodira@');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.clear(field);
    await userEvent.type(field, 'nodira@example.uz');
    await expect(field).not.toHaveAttribute('aria-invalid');
    field.blur();
  },
};

/** Long Russian and Uzbek values and placeholders scroll inside the field, which keeps its size. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: '<input aveInput type="text" value="Государственное унитарное предприятие…" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    for (const field of canvasElement.querySelectorAll('input')) {
      await expect(field.getBoundingClientRect().width).toBeLessThanOrEqual(column.clientWidth);
    }
  },
};

/** Compact density: every size one step down, next to its Button. */
export const Compact: Story = {
  render: frame('compact'),
  parameters: {
    docs: {
      source: {
        code: `<div data-density="compact">
  <input aveInput type="search" aria-label="Search" />
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      const field = canvasElement.querySelector(`[data-size="${size}"] input`);
      await expect(field?.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};
