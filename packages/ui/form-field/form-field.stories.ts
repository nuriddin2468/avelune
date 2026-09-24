import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, pattern, required } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';

type View = 'default' | 'states' | 'long';

/** The frame the stories draw fields in. Styled with tokens only. */
@Component({
  selector: 'ave-form-field-stories',
  imports: [AveFormField, AveHint, AveError, AveInput],
  template: `
    @switch (view()) {
      @case ('states') {
        <div class="grid">
          <ave-form-field label="Optional">
            <input aveInput type="text" />
          </ave-form-field>
          <ave-form-field label="Required">
            <input aveInput type="text" required />
          </ave-form-field>
          <ave-form-field label="With a hint">
            <input aveInput type="text" />
            <p aveHint>As written on the signed copy.</p>
          </ave-form-field>
          <ave-form-field label="With an error">
            <input aveInput type="text" value="2026/114" aria-invalid="true" required />
            <p aveError>Enter the contract number, for example ДК-2026/114.</p>
          </ave-form-field>
          <ave-form-field label="Readonly">
            <input aveInput type="text" value="ДК-2026/114" readonly />
          </ave-form-field>
          <ave-form-field label="Disabled">
            <input aveInput type="text" value="ДК-2026/114" disabled />
          </ave-form-field>
        </div>
      }
      @case ('long') {
        <div class="narrow">
          <ave-form-field
            label="Наименование организации-контрагента в соответствии с учредительными документами"
            lang="ru"
          >
            <input aveInput type="text" required aria-invalid="true" />
            <p aveHint>Полное наименование, как в свидетельстве о государственной регистрации юридического лица.</p>
            <p aveError>Укажите наименование организации: поле не может быть пустым.</p>
          </ave-form-field>
          <ave-form-field label="Kontragent tashkilotning taʼsis hujjatlaridagi toʻliq nomi" lang="uz-Latn">
            <input aveInput type="text" />
            <p aveHint>Davlat roʻyxatidan oʻtganlik toʻgʻrisidagi guvohnomadagi kabi.</p>
          </ave-form-field>
        </div>
      }
      @default {
        <div class="narrow">
          <ave-form-field label="Contract number">
            <input aveInput type="text" required placeholder="ДК-2026/000" />
            <p aveHint>As written on the signed copy.</p>
          </ave-form-field>
        </div>
      }
    }
  `,
  styleUrl: './form-field.stories.css',
})
class FormFieldStories {
  readonly view = input<View>('default');
}

/** A Signal Forms field: required and a pattern; the error shows once the field is left. */
@Component({
  selector: 'ave-form-field-signal-forms',
  imports: [AveFormField, AveHint, AveError, AveInput, FormField],
  template: `
    <div class="narrow">
      <ave-form-field label="Contract number">
        <input aveInput type="text" [formField]="contract.number" />
        <p aveHint>As written on the signed copy.</p>
        @if (contract.number().errors().length > 0) {
          <p aveError>Enter the contract number, for example ДК-2026/114.</p>
        }
      </ave-form-field>
    </div>
  `,
  styleUrl: './form-field.stories.css',
})
class SignalFormsDemo {
  protected readonly model = signal({ number: '' });
  protected readonly contract = form(this.model, (path) => {
    required(path.number);
    pattern(path.number, /^ДК-\d{4}\/\d+$/);
  });
}

/** The same with Reactive Forms. */
@Component({
  selector: 'ave-form-field-reactive-forms',
  imports: [AveFormField, AveError, AveInput, ReactiveFormsModule],
  template: `
    <div class="narrow">
      <ave-form-field label="Email for notices">
        <input aveInput type="email" [formControl]="email" />
        <p aveError>Enter an address like name@example.uz.</p>
      </ave-form-field>
    </div>
  `,
  styleUrl: './form-field.stories.css',
})
class ReactiveFormsDemo {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly email = new FormControl('', { validators: [Validators.required, Validators.email] });
}

type Story = StoryObj<AveFormField>;

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-form-field-stories [view]="view" />`,
    moduleMetadata: { imports: [FormFieldStories] },
  });
}

const meta: Meta<AveFormField> = {
  title: 'Components/FormField',
  component: AveFormField,
};
export default meta;

/** A required field with a hint. */
export const Default: Story = {
  render: frame('default'),
  parameters: source(
    '<ave-form-field label="Contract number">',
    '  <input aveInput type="text" required />',
    '  <p aveHint>As written on the signed copy.</p>',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('textbox', { name: 'Contract number' });
    await expect(control).toBeRequired();
    await expect(control).toHaveAccessibleDescription('As written on the signed copy.');
    await userEvent.click(within(canvasElement).getByText('Contract number'));
    await expect(control).toHaveFocus();
    control.blur();
  },
};

/** Optional, required, with a hint, with an error, readonly and disabled. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: source(
    '<ave-form-field label="With an error">',
    '  <input aveInput type="text" [formField]="contract.number" />',
    '  <p aveError>Enter the contract number, for example ДК-2026/114.</p>',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'With an error' })).toHaveAccessibleDescription(
      'Enter the contract number, for example ДК-2026/114.',
    );
    await expect(canvasElement.querySelectorAll('.required')).toHaveLength(2);
    // The label sits 8px above the control, the hint 4px under it.
    const field = canvas.getByRole('textbox', { name: 'With a hint' });
    if (!(field instanceof HTMLInputElement)) throw new Error('No input');
    const label = field.labels?.[0]?.getBoundingClientRect();
    const box = field.getBoundingClientRect();
    const hint = field.parentElement?.querySelector('[aveHint]')?.getBoundingClientRect();
    await expect(Math.round(box.top - (label?.bottom ?? 0))).toBe(8);
    await expect(Math.round((hint?.top ?? 0) - box.bottom)).toBe(4);
  },
};

/** Signal Forms: no error until the field is left; then the error, linked to the field. */
export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: '<ave-form-field-signal-forms />', moduleMetadata: { imports: [SignalFormsDemo] } }),
  parameters: source(
    '<ave-form-field label="Contract number">',
    '  <input aveInput type="text" [formField]="contract.number" />',
    '  <p aveHint>As written on the signed copy.</p>',
    '  @if (contract.number().errors().length > 0) {',
    '    <p aveError>Enter the contract number, for example ДК-2026/114.</p>',
    '  }',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole('textbox', { name: 'Contract number' });
    await userEvent.type(control, '114');
    await expect(canvas.queryByText(/Enter the contract number/)).toBeNull();
    await userEvent.tab();
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(control).toHaveAccessibleDescription(
      'As written on the signed copy. Enter the contract number, for example ДК-2026/114.',
    );
  },
};

/** Reactive Forms: Validators.required marks the field and makes the control aria-required. */
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({ template: '<ave-form-field-reactive-forms />', moduleMetadata: { imports: [ReactiveFormsDemo] } }),
  parameters: source(
    '<ave-form-field label="Email for notices">',
    '  <input aveInput type="email" [formControl]="email" />',
    '  <p aveError>Enter an address like name@example.uz.</p>',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('textbox', { name: 'Email for notices' });
    await expect(control).toHaveAttribute('aria-required', 'true');
    await userEvent.click(control);
    await userEvent.tab();
    await expect(within(canvasElement).getByText('Enter an address like name@example.uz.')).toBeVisible();
  },
};

/** Long Russian and Uzbek labels, hints and errors wrap in a narrow column. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: source('<ave-form-field label="Наименование организации-контрагента…">…</ave-form-field>'),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
  },
};
