import { Component, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup, AveError, AveHint } from '@avelune/ui/form-field';
import { AveRadio } from '@avelune/ui/radio';

type View = 'states' | 'long';

/** The frame the stories draw groups in. Styled with tokens only. */
@Component({
  selector: 'ave-choice-group-stories',
  imports: [AveCheckbox, AveChoice, AveChoiceGroup, AveError, AveHint, AveRadio],
  template: `
    @switch (view()) {
      @case ('long') {
        <div class="narrow">
          <fieldset aveChoiceGroup lang="ru" legend="Каким способом организация подпишет договор поставки оборудования">
            <label aveChoice lang="ru">
              <input type="radio" aveRadio name="signing" value="digital" checked />
              Электронной цифровой подписью руководителя в системе электронного документооборота
            </label>
            <label aveChoice lang="uz-Latn">
              <input type="radio" aveRadio name="signing" value="paper" />
              Qogʻozda, tashkilot rahbarining shaxsiy imzosi va muhri bilan
            </label>
            <p aveHint lang="ru">
              Подписанный на бумаге экземпляр нужно передать в канцелярию в течение трёх рабочих дней.
            </p>
          </fieldset>
        </div>
      }
      @default {
        <div class="grid">
          <fieldset aveChoiceGroup legend="Delivery">
            <label aveChoice><input type="radio" aveRadio name="delivery" value="courier" checked /> Courier</label>
            <label aveChoice><input type="radio" aveRadio name="delivery" value="pickup" /> Pickup point</label>
            <p aveHint>Pickup is free.</p>
          </fieldset>
          <fieldset aveChoiceGroup legend="Notify">
            <label aveChoice><input type="checkbox" aveCheckbox /> By email</label>
            <label aveChoice><input type="checkbox" aveCheckbox /> By SMS</label>
            <p aveError>Choose at least one way to notify.</p>
          </fieldset>
          <fieldset aveChoiceGroup legend="Archive" disabled>
            <label aveChoice
              ><input type="radio" aveRadio name="archive" value="keep" checked /> Keep for 5 years</label
            >
            <label aveChoice><input type="radio" aveRadio name="archive" value="forever" /> Keep for good</label>
          </fieldset>
        </div>
      }
    }
  `,
  styleUrl: './choice-group.stories.css',
})
class ChoiceGroupStories {
  readonly view = input<View>('states');
}

/** A required radio group and a checkbox group with one rule for the group, sent with Signal Forms. */
@Component({
  selector: 'ave-choice-group-signal',
  imports: [AveButton, AveCheckbox, AveChoice, AveChoiceGroup, AveError, AveHint, AveRadio, FormField],
  template: `
    <form class="narrow" novalidate (submit)="send($event)">
      <fieldset aveChoiceGroup legend="Delivery">
        <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
        <label aveChoice
          ><input type="radio" aveRadio value="pickup" [formField]="order.delivery" /> Pickup point</label
        >
        <label aveChoice><input type="radio" aveRadio value="post" [formField]="order.delivery" /> Post</label>
        <p aveHint>Pickup is free.</p>
        @if (order.delivery().errors().length > 0) {
          <p aveError>Choose how to deliver the order.</p>
        }
      </fieldset>
      <fieldset aveChoiceGroup legend="Notify">
        <label aveChoice><input type="checkbox" aveCheckbox [formField]="order.notify.email" /> By email</label>
        <label aveChoice><input type="checkbox" aveCheckbox [formField]="order.notify.sms" /> By SMS</label>
        @if (order.notify().errors().length > 0) {
          <p aveError>Choose at least one way to notify.</p>
        }
      </fieldset>
      <div class="actions"><button aveButton type="submit" variant="primary">Place the order</button></div>
    </form>
  `,
  styleUrl: './choice-group.stories.css',
})
class SignalFormsDemo {
  protected readonly model = signal({ delivery: '', notify: { email: false, sms: false } });
  protected readonly order = form(this.model, (path) => {
    required(path.delivery);
    validate(path.notify, (context) =>
      context.value().email || context.value().sms ? undefined : { kind: 'channel' },
    );
  });

  protected send(event: Event): void {
    event.preventDefault();
    void submit(this.order, { action: () => Promise.resolve(undefined) });
  }
}

/** The same radio group with Reactive Forms. */
@Component({
  selector: 'ave-choice-group-reactive',
  imports: [AveChoice, AveChoiceGroup, AveError, AveRadio, ReactiveFormsModule],
  template: `
    <div class="narrow">
      <fieldset aveChoiceGroup legend="Delivery" [formGroup]="order">
        <label aveChoice><input type="radio" aveRadio value="courier" formControlName="delivery" /> Courier</label>
        <label aveChoice><input type="radio" aveRadio value="pickup" formControlName="delivery" /> Pickup point</label>
        @if (order.controls.delivery.invalid) {
          <p aveError>Choose how to deliver the order.</p>
        }
      </fieldset>
    </div>
  `,
  styleUrl: './choice-group.stories.css',
})
class ReactiveFormsDemo {
  protected readonly order = new FormGroup({
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    delivery: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}

type Story = StoryObj<ChoiceGroupStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-choice-group-stories [view]="view" />`,
    moduleMetadata: { imports: [ChoiceGroupStories] },
  });
}

const meta: Meta<ChoiceGroupStories> = {
  title: 'Components/ChoiceGroup',
  component: AveChoiceGroup,
};
export default meta;

/** Radios with a hint, checkboxes with an error, a disabled group. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        language: 'html',
        code: `<fieldset aveChoiceGroup legend="Delivery">
  <label aveChoice><input type="radio" aveRadio name="delivery" value="courier" checked /> Courier</label>
  <label aveChoice><input type="radio" aveRadio name="delivery" value="pickup" /> Pickup point</label>
  <p aveHint>Pickup is free.</p>
</fieldset>
<fieldset aveChoiceGroup legend="Notify">
  <label aveChoice><input type="checkbox" aveCheckbox /> By email</label>
  <label aveChoice><input type="checkbox" aveCheckbox /> By SMS</label>
  <p aveError>Choose at least one way to notify.</p>
</fieldset>
<fieldset aveChoiceGroup legend="Archive" disabled>
  <label aveChoice><input type="radio" aveRadio name="archive" value="keep" checked /> Keep for 5 years</label>
  <label aveChoice><input type="radio" aveRadio name="archive" value="forever" /> Keep for good</label>
</fieldset>`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radiogroup', { name: 'Delivery' })).toHaveAccessibleDescription('Pickup is free.');
    await expect(canvas.getByRole('group', { name: 'Notify' })).toHaveAccessibleDescription(
      'Choose at least one way to notify.',
    );
    await expect(canvas.getByRole('radio', { name: 'Keep for good' })).toBeDisabled();
  },
};

/** Signal Forms: nothing shows until the order is sent; then both errors, and each goes once it is fixed. */
export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: '<ave-choice-group-signal />', moduleMetadata: { imports: [SignalFormsDemo] } }),
  parameters: {
    docs: {
      source: {
        language: 'typescript',
        code: `import { Component, signal } from '@angular/core';
import { FormField, form, required, submit, validate } from '@angular/forms/signals';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup, AveError, AveHint } from '@avelune/ui/form-field';
import { AveRadio } from '@avelune/ui/radio';

@Component({
  selector: 'app-order-delivery',
  imports: [AveButton, AveCheckbox, AveChoice, AveChoiceGroup, AveError, AveHint, AveRadio, FormField],
  template: \`
    <form novalidate (submit)="send($event)">
      <fieldset aveChoiceGroup legend="Delivery">
        <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
        <label aveChoice><input type="radio" aveRadio value="pickup" [formField]="order.delivery" /> Pickup point</label>
        <label aveChoice><input type="radio" aveRadio value="post" [formField]="order.delivery" /> Post</label>
        <p aveHint>Pickup is free.</p>
        @if (order.delivery().errors().length > 0) {
          <p aveError>Choose how to deliver the order.</p>
        }
      </fieldset>
      <fieldset aveChoiceGroup legend="Notify">
        <label aveChoice><input type="checkbox" aveCheckbox [formField]="order.notify.email" /> By email</label>
        <label aveChoice><input type="checkbox" aveCheckbox [formField]="order.notify.sms" /> By SMS</label>
        @if (order.notify().errors().length > 0) {
          <p aveError>Choose at least one way to notify.</p>
        }
      </fieldset>
      <button aveButton type="submit" variant="primary">Place the order</button>
    </form>
  \`,
})
export class OrderDelivery {
  protected readonly model = signal({ delivery: '', notify: { email: false, sms: false } });
  protected readonly order = form(this.model, (path) => {
    required(path.delivery);
    validate(path.notify, (context) =>
      context.value().email || context.value().sms ? undefined : { kind: 'channel' },
    );
  });

  protected send(event: Event): void {
    event.preventDefault();
    void submit(this.order, { action: () => Promise.resolve(undefined) });
  }
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const delivery = canvas.getByRole('radiogroup', { name: 'Delivery' });
    await expect(delivery).toHaveAttribute('aria-required', 'true');
    await expect(canvas.queryByText('Choose how to deliver the order.')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Place the order' }));
    await expect(canvas.getByText('Choose how to deliver the order.')).toBeVisible();
    await expect(canvas.getByText('Choose at least one way to notify.')).toBeVisible();
    await expect(delivery).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(canvas.getByRole('radio', { name: 'Pickup point' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'By email' }));
    await expect(canvas.queryByText('Choose how to deliver the order.')).toBeNull();
    await expect(canvas.queryByText('Choose at least one way to notify.')).toBeNull();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Reactive Forms: the error shows once a radio has been left without a choice. */
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({ template: '<ave-choice-group-reactive />', moduleMetadata: { imports: [ReactiveFormsDemo] } }),
  parameters: {
    docs: {
      source: {
        language: 'typescript',
        code: `import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup, AveError } from '@avelune/ui/form-field';
import { AveRadio } from '@avelune/ui/radio';

@Component({
  selector: 'app-order-delivery',
  imports: [AveChoice, AveChoiceGroup, AveError, AveRadio, ReactiveFormsModule],
  template: \`
    <fieldset aveChoiceGroup legend="Delivery" [formGroup]="order">
      <label aveChoice><input type="radio" aveRadio value="courier" formControlName="delivery" /> Courier</label>
      <label aveChoice><input type="radio" aveRadio value="pickup" formControlName="delivery" /> Pickup point</label>
      @if (order.controls.delivery.invalid) {
        <p aveError>Choose how to deliver the order.</p>
      }
    </fieldset>
  \`,
})
export class OrderDelivery {
  protected readonly order = new FormGroup({
    delivery: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const courier = canvas.getByRole('radio', { name: 'Courier' });
    await expect(canvas.getByRole('radiogroup', { name: 'Delivery' })).toHaveAttribute('aria-required', 'true');
    courier.focus();
    courier.blur();
    await expect(await canvas.findByText('Choose how to deliver the order.')).toBeVisible();
  },
};

/** A long legend, long options and a long hint in Russian and Uzbek wrap; the asterisk stays with the last word. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<fieldset aveChoiceGroup legend="Каким способом организация подпишет договор поставки оборудования">
  <label aveChoice>
    <input type="radio" aveRadio name="signing" value="digital" checked />
    Электронной цифровой подписью руководителя в системе электронного документооборота
  </label>
  <label aveChoice>
    <input type="radio" aveRadio name="signing" value="paper" />
    Qogʻozda, tashkilot rahbarining shaxsiy imzosi va muhri bilan
  </label>
  <p aveHint>Подписанный на бумаге экземпляр нужно передать в канцелярию в течение трёх рабочих дней.</p>
</fieldset>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
  },
};
