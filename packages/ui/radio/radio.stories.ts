import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveRadio } from '@avelune/ui/radio';

type View = 'default' | 'states' | 'long';

/** The frame the stories draw radios in, with a plain fieldset (the choice group is a higher layer). Tokens only. */
@Component({
  selector: 'ave-radio-stories',
  imports: [AveChoice, AveRadio],
  template: `
    @switch (view()) {
      @case ('states') {
        <fieldset class="group">
          <legend class="legend">States</legend>
          <label aveChoice><input type="radio" aveRadio name="states" value="a" /> Unchecked</label>
          <label aveChoice><input type="radio" aveRadio name="other" value="b" checked /> Checked</label>
          <label aveChoice><input type="radio" aveRadio name="focus" value="c" data-focus-target /> Focused</label>
          <label aveChoice><input type="radio" aveRadio name="invalid" value="d" aria-invalid="true" /> Invalid</label>
          <label aveChoice><input type="radio" aveRadio name="off" value="e" disabled /> Disabled</label>
          <label aveChoice
            ><input type="radio" aveRadio name="off-on" value="f" checked disabled /> Disabled, checked</label
          >
        </fieldset>
      }
      @case ('long') {
        <fieldset class="group narrow" lang="ru">
          <legend class="legend">Способ подписания</legend>
          <label aveChoice lang="ru">
            <input type="radio" aveRadio name="signing" value="digital" checked />
            Электронная цифровая подпись руководителя организации через систему электронного документооборота
          </label>
          <label aveChoice lang="uz-Latn">
            <input type="radio" aveRadio name="signing" value="paper" />
            Qogʻozda, tashkilot rahbarining shaxsiy imzosi va muhri bilan, ofisda
          </label>
        </fieldset>
      }
      @default {
        <fieldset class="group">
          <legend class="legend">Delivery</legend>
          <label aveChoice><input type="radio" aveRadio name="delivery" value="courier" checked /> Courier</label>
          <label aveChoice><input type="radio" aveRadio name="delivery" value="pickup" /> Pickup point</label>
          <label aveChoice><input type="radio" aveRadio name="delivery" value="post" /> Post</label>
        </fieldset>
      }
    }
  `,
  styleUrl: './radio.stories.css',
})
class RadioStories {
  readonly view = input<View>('default');
}

/** Signal Forms and Reactive Forms, side by side: one required choice each. */
@Component({
  selector: 'ave-radio-forms',
  imports: [AveChoice, AveRadio, FormField, ReactiveFormsModule],
  template: `
    <div class="forms">
      <fieldset class="group">
        <legend class="legend">Delivery (Signal Forms)</legend>
        <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
        <label aveChoice
          ><input type="radio" aveRadio value="pickup" [formField]="order.delivery" /> Pickup point</label
        >
        <label aveChoice><input type="radio" aveRadio value="post" [formField]="order.delivery" /> Post</label>
      </fieldset>
      <p class="status" role="status">Signal Forms: {{ model().delivery || 'nothing' }}</p>
      <fieldset class="group">
        <legend class="legend">Delivery (Reactive Forms)</legend>
        <label aveChoice
          ><input type="radio" aveRadio name="reactive" value="courier" [formControl]="delivery" /> Courier</label
        >
        <label aveChoice
          ><input type="radio" aveRadio name="reactive" value="pickup" [formControl]="delivery" /> Pickup point</label
        >
      </fieldset>
      <p class="status" role="status">Reactive Forms: {{ delivery.value || 'nothing' }}</p>
    </div>
  `,
  styleUrl: './radio.stories.css',
})
class RadioForms {
  protected readonly model = signal({ delivery: '' });
  protected readonly order = form(this.model, (path) => {
    required(path.delivery);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly delivery = new FormControl('', { nonNullable: true, validators: [Validators.required] });
}

type Story = StoryObj<RadioStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-radio-stories [view]="view" />`,
    moduleMetadata: { imports: [RadioStories] },
  });
}

const meta: Meta<RadioStories> = {
  title: 'Components/Radio',
  component: AveRadio,
};
export default meta;

/** Three options of one question; the arrow keys move the choice. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<label aveChoice><input type="radio" aveRadio name="delivery" value="courier" /> Courier</label>
<label aveChoice><input type="radio" aveRadio name="delivery" value="pickup" /> Pickup point</label>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const courier = canvas.getByRole('radio', { name: 'Courier' });
    await userEvent.click(courier);
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Pickup point' })).toBeChecked();
    await expect(courier).not.toBeChecked();
    await userEvent.click(courier);
  },
};

/** Unchecked, checked, focused, invalid, disabled, disabled and checked. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<input type="radio" aveRadio aria-invalid="true" />
<input type="radio" aveRadio disabled />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const radio of canvasElement.querySelectorAll('input')) {
      const box = radio.getBoundingClientRect();
      await expect([box.width, box.height]).toEqual([16, 16]);
    }
    const focused = canvasElement.querySelector<HTMLInputElement>('[data-focus-target]');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** Both form APIs: the model follows the checked radio. */
export const Forms: Story = {
  render: () => ({ template: '<ave-radio-forms />', moduleMetadata: { imports: [RadioForms] } }),
  parameters: {
    docs: {
      source: {
        code: `<input type="radio" aveRadio value="courier" [formField]="order.delivery" />
<input type="radio" aveRadio value="courier" formControlName="delivery" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [signalPickup, reactivePickup] = canvas.getAllByRole('radio', { name: 'Pickup point' });
    if (signalPickup === undefined || reactivePickup === undefined) throw new Error('No radios');
    await expect(signalPickup).toBeRequired();
    await userEvent.click(signalPickup);
    await expect(canvas.getByText('Signal Forms: pickup')).toBeVisible();
    await userEvent.click(reactivePickup);
    await expect(canvas.getByText('Reactive Forms: pickup')).toBeVisible();
    reactivePickup.blur();
  },
};

/** Long Russian and Uzbek options wrap under their text, the circle on the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<label aveChoice>
  <input type="radio" aveRadio name="signing" value="digital" checked />
  Электронная цифровая подпись руководителя организации через систему электронного документооборота
</label>
<label aveChoice lang="uz-Latn">
  <input type="radio" aveRadio name="signing" value="paper" />
  Qogʻozda, tashkilot rahbarining shaxsiy imzosi va muhri bilan, ofisda
</label>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const label of canvasElement.querySelectorAll('label')) {
      const radio = label.querySelector('input')?.getBoundingClientRect();
      const text = label.getBoundingClientRect();
      await expect(text.height).toBeGreaterThan(24);
      await expect((radio?.top ?? 0) - text.top).toBe(4);
    }
  },
};
