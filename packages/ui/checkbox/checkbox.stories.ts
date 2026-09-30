import { Component, input, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { lucideCircleAlert } from '@avelune/icons/lucide';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';

type View = 'default' | 'states' | 'long';

/** The frame the stories draw checkboxes in. Styled with tokens only. */
@Component({
  selector: 'ave-checkbox-stories',
  imports: [AveCheckbox, AveChoice],
  template: `
    @switch (view()) {
      @case ('states') {
        <div class="stack">
          <label aveChoice><input type="checkbox" aveCheckbox /> Unchecked</label>
          <label aveChoice><input type="checkbox" aveCheckbox checked /> Checked</label>
          <label aveChoice><input type="checkbox" aveCheckbox [indeterminate]="true" /> Mixed</label>
          <label aveChoice><input type="checkbox" aveCheckbox data-focus-target /> Focused</label>
          <label aveChoice><input type="checkbox" aveCheckbox aria-invalid="true" /> Invalid</label>
          <label aveChoice><input type="checkbox" aveCheckbox disabled /> Disabled</label>
          <label aveChoice><input type="checkbox" aveCheckbox checked disabled /> Disabled, checked</label>
          <label aveChoice><input type="checkbox" aveCheckbox [indeterminate]="true" disabled /> Disabled, mixed</label>
        </div>
      }
      @case ('long') {
        <div class="stack narrow">
          <label aveChoice lang="ru">
            <input type="checkbox" aveCheckbox checked />
            Архивировать документы старше трёх лет вместе с приложениями и листами согласования
          </label>
          <label aveChoice lang="uz-Latn">
            <input type="checkbox" aveCheckbox />
            Kontragentga hujjatning imzolangan nusxasi haqida elektron pochta orqali xabar yuborish
          </label>
        </div>
      }
      @default {
        <label aveChoice><input type="checkbox" aveCheckbox checked /> Notify the counterparty by email</label>
      }
    }
  `,
  styleUrl: './checkbox.stories.css',
})
class CheckboxStories {
  readonly view = input<View>('default');
}

/**
 * A Signal Forms confirmation that must be given, and an optional notice. The error sits in an element that is always
 * in the page, which the checkbox's aria-describedby names, so a screen reader says why it is invalid.
 */
@Component({
  selector: 'ave-checkbox-forms',
  imports: [AveCheckbox, AveChoice, AveIcon, FormField],
  providers: [provideAveIcons([lucideCircleAlert])],
  template: `
    <div class="stack">
      <label aveChoice
        ><input type="checkbox" aveCheckbox [formField]="terms.notify" /> Notify the counterparty by email</label
      >
      <label aveChoice
        ><input type="checkbox" aveCheckbox aria-describedby="confirm-error" [formField]="terms.confirm" /> I confirm
        the data is correct</label
      >
      <div id="confirm-error" class="message">
        @if (terms.confirm().invalid() && terms.confirm().touched()) {
          <p class="error">
            <ave-icon name="circle-alert" decorative />Confirm the data to send the contract for approval.
          </p>
        }
      </div>
    </div>
  `,
  styleUrl: './checkbox.stories.css',
})
class FormsDemo {
  protected readonly model = signal({ notify: true, confirm: false });
  protected readonly terms = form(this.model, (path) => {
    required(path.confirm);
  });
}

type Story = StoryObj<AveCheckbox>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-checkbox-stories [view]="view" />`,
    moduleMetadata: { imports: [CheckboxStories] },
  });
}

const meta: Meta<AveCheckbox> = {
  title: 'Components/Checkbox',
  component: AveCheckbox,
};
export default meta;

/** One checkbox in its label. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<label aveChoice>
  <input type="checkbox" aveCheckbox checked />
  Notify the counterparty by email
</label>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: 'Notify the counterparty by email' });
    await expect(box).toBeChecked();
    await userEvent.click(within(canvasElement).getByText('Notify the counterparty by email'));
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
    box.blur();
  },
};

/** Every state, and mixed; the focused box carries the ring in the baseline. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<label aveChoice><input type="checkbox" aveCheckbox /> Unchecked</label>
<label aveChoice><input type="checkbox" aveCheckbox checked /> Checked</label>
<label aveChoice><input type="checkbox" aveCheckbox [indeterminate]="true" /> Mixed</label>
<label aveChoice><input type="checkbox" aveCheckbox aria-invalid="true" /> Invalid</label>
<label aveChoice><input type="checkbox" aveCheckbox disabled /> Disabled</label>
<label aveChoice><input type="checkbox" aveCheckbox checked disabled /> Disabled, checked</label>
<label aveChoice><input type="checkbox" aveCheckbox [indeterminate]="true" disabled /> Disabled, mixed</label>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox', { name: 'Mixed' })).toBePartiallyChecked();
    const focused = canvasElement.querySelector<HTMLInputElement>('[data-focus-target]');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Signal Forms: a required confirmation is invalid once touched. */
export const Forms: Story = {
  render: () => ({ template: '<ave-checkbox-forms />', moduleMetadata: { imports: [FormsDemo] } }),
  parameters: {
    docs: {
      source: {
        language: 'typescript',
        code: `import { Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { lucideCircleAlert } from '@avelune/icons/lucide';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';

@Component({
  selector: 'app-contract-terms',
  imports: [AveCheckbox, AveChoice, AveIcon, FormField],
  providers: [provideAveIcons([lucideCircleAlert])],
  template: \`
    <label aveChoice>
      <input type="checkbox" aveCheckbox [formField]="terms.notify" />
      Notify the counterparty by email
    </label>
    <label aveChoice>
      <input type="checkbox" aveCheckbox aria-describedby="confirm-error" [formField]="terms.confirm" />
      I confirm the data is correct
    </label>
    <div id="confirm-error">
      @if (terms.confirm().invalid() && terms.confirm().touched()) {
        <p>
          <ave-icon name="circle-alert" decorative />
          Confirm the data to send the contract for approval.
        </p>
      }
    </div>
  \`,
})
export class ContractTerms {
  protected readonly model = signal({ notify: true, confirm: false });
  protected readonly terms = form(this.model, (path) => {
    required(path.confirm);
  });
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const confirm = canvas.getByRole('checkbox', { name: 'I confirm the data is correct' });
    await userEvent.click(confirm);
    await userEvent.click(confirm);
    await userEvent.tab();
    await expect(confirm).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('Confirm the data to send the contract for approval.')).toBeVisible();
    await expect(confirm).toHaveAccessibleDescription('Confirm the data to send the contract for approval.');
  },
};

/** Long Russian and Uzbek labels wrap under their text, the box on the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<label aveChoice lang="ru">
  <input type="checkbox" aveCheckbox checked />
  Архивировать документы старше трёх лет вместе с приложениями и листами согласования
</label>
<label aveChoice lang="uz-Latn">
  <input type="checkbox" aveCheckbox />
  Kontragentga hujjatning imzolangan nusxasi haqida elektron pochta orqali xabar yuborish
</label>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const label of canvasElement.querySelectorAll('label')) {
      const box = label.querySelector('input')?.getBoundingClientRect();
      await expect((box?.top ?? 0) - label.getBoundingClientRect().top).toBe(4);
      await expect(label.getBoundingClientRect().height).toBeGreaterThan(24);
    }
  },
};
