import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveSwitch } from '@avelune/ui/switch';

type View = 'default' | 'states' | 'long';

/** The frame the stories draw switches in. Styled with tokens only. */
@Component({
  selector: 'ave-switch-stories',
  imports: [AveChoice, AveSwitch],
  template: `
    @switch (view()) {
      @case ('states') {
        <div class="stack">
          <label aveChoice><input type="checkbox" aveSwitch /> Off</label>
          <label aveChoice><input type="checkbox" aveSwitch checked /> On</label>
          <label aveChoice><input type="checkbox" aveSwitch data-focus-target /> Focused</label>
          <label aveChoice><input type="checkbox" aveSwitch aria-invalid="true" /> Invalid</label>
          <label aveChoice><input type="checkbox" aveSwitch disabled /> Disabled, off</label>
          <label aveChoice><input type="checkbox" aveSwitch checked disabled /> Disabled, on</label>
        </div>
      }
      @case ('long') {
        <div class="stack narrow">
          <label aveChoice lang="ru">
            <input type="checkbox" aveSwitch checked />
            Присылать уведомления о каждом новом согласовании договоров моего подразделения на электронную почту
          </label>
          <label aveChoice lang="uz-Latn">
            <input type="checkbox" aveSwitch />
            Hujjatlar arxivini har kuni kechqurun avtomatik ravishda zaxiralash
          </label>
        </div>
      }
      @default {
        <div class="stack">
          <label aveChoice><input type="checkbox" aveSwitch checked /> Email notices</label>
          <label aveChoice><input type="checkbox" aveSwitch /> Compact tables</label>
        </div>
      }
    }
  `,
  styleUrl: './switch.stories.css',
})
class SwitchStories {
  readonly view = input<View>('default');
}

/** A setting bound with each form API; the status says what is saved. */
@Component({
  selector: 'ave-switch-forms',
  imports: [AveChoice, AveSwitch, FormField, ReactiveFormsModule],
  template: `
    <div class="stack">
      <label aveChoice><input type="checkbox" aveSwitch [formField]="settings.notices" /> Email notices</label>
      <label aveChoice><input type="checkbox" aveSwitch [formControl]="compact" /> Compact tables</label>
    </div>
    <p class="status" role="status">
      Email notices {{ model().notices ? 'on' : 'off' }} · compact tables {{ compact.value ? 'on' : 'off' }}
    </p>
  `,
  styleUrl: './switch.stories.css',
})
class SwitchForms {
  protected readonly model = signal({ notices: false });
  protected readonly settings = form(this.model);
  protected readonly compact = new FormControl(true, { nonNullable: true });
}

type Story = StoryObj<SwitchStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-switch-stories [view]="view" />`,
    moduleMetadata: { imports: [SwitchStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<SwitchStories> = {
  title: 'Components/Switch',
  component: SwitchStories,
};
export default meta;

/** Two settings; Space and a click toggle them. */
export const Default: Story = {
  render: frame('default'),
  parameters: source(
    '<label aveChoice><input type="checkbox" aveSwitch [formField]="settings.notices" /> Email notices</label>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const compact = canvas.getByRole('switch', { name: 'Compact tables' });
    await expect(canvas.getByRole('switch', { name: 'Email notices' })).toBeChecked();
    await userEvent.click(compact);
    await expect(compact).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(compact).not.toBeChecked();
    compact.blur();
  },
};

/** Off, on, focused, invalid, disabled off and on: one size, one label height. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: source(
    '<input type="checkbox" aveSwitch aria-invalid="true" />',
    '<input type="checkbox" aveSwitch disabled />',
  ),
  play: async ({ canvasElement }) => {
    for (const label of canvasElement.querySelectorAll('label')) {
      await expect(label.getBoundingClientRect().height).toBe(24);
      const track = label.querySelector('input')?.getBoundingClientRect();
      await expect([track?.width, track?.height]).toEqual([40, 24]);
    }
    const focused = canvasElement.querySelector<HTMLInputElement>('[data-focus-target]');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Both form APIs bind it as a checkbox. */
export const Forms: Story = {
  render: () => ({ template: '<ave-switch-forms />', moduleMetadata: { imports: [SwitchForms] } }),
  parameters: source(
    '<input type="checkbox" aveSwitch [formField]="settings.notices" />',
    '<input type="checkbox" aveSwitch [formControl]="compact" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('switch', { name: 'Email notices' }));
    await userEvent.click(canvas.getByRole('switch', { name: 'Compact tables' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Email notices on · compact tables off');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Long Russian and Uzbek labels wrap under their text; the switch stays on the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    for (const label of canvasElement.querySelectorAll('label')) {
      const track = label.querySelector('input')?.getBoundingClientRect();
      await expect(label.getBoundingClientRect().height).toBeGreaterThan(24);
      await expect(track?.top).toBe(label.getBoundingClientRect().top);
    }
  },
};
