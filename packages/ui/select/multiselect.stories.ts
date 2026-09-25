import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveMultiselect, type AveSelectSize } from '@avelune/ui/select';
import { approvers } from './fixtures/options';

type View = 'states' | 'long';

/** The frame the stories draw multiselects in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-multiselect-stories',
  imports: [AveMultiselect],
  template: `
    @switch (view()) {
      @case ('long') {
        <div class="stack narrow" lang="ru">
          <ave-multiselect label="Согласующие" [options]="approvers" [value]="all" />
        </div>
      }
      @default {
        <div class="grid" lang="ru">
          <div class="field">
            <span class="label">Empty</span>
            <ave-multiselect label="Empty" placeholder="Выберите согласующих" [options]="approvers" />
          </div>
          <div class="field">
            <span class="label">Chosen</span>
            <ave-multiselect label="Chosen" [options]="approvers" [value]="['legal', 'finance']" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-multiselect label="Readonly" [options]="approvers" [value]="['security']" readonly />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-multiselect label="Disabled" [options]="approvers" [value]="['legal']" disabled />
          </div>
        </div>
      }
    }
  `,
  styleUrl: './select.stories.css',
})
class MultiselectStories {
  readonly view = input<View>('states');
  protected readonly approvers = approvers;
  protected readonly all = approvers.map((approver) => approver.value);
}

/** Signal Forms and Reactive Forms: approvers chosen with each. */
@Component({
  selector: 'ave-multiselect-forms',
  imports: [AveMultiselect, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow room">
      <div class="field">
        <span class="label">Approvers (Signal Forms)</span>
        <ave-multiselect label="Approvers (Signal Forms)" [options]="approvers" [formField]="contract.approvers" />
      </div>
      <div class="field">
        <span class="label">Approvers (Reactive Forms)</span>
        <ave-multiselect label="Approvers (Reactive Forms)" [options]="approvers" [formControl]="chosen" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().approvers.join(', ') || 'nothing' }} · Reactive Forms:
      {{ chosen.value.join(', ') || 'nothing' }}
    </p>
  `,
  styleUrl: './select.stories.css',
})
class MultiselectForms {
  protected readonly approvers = approvers;
  protected readonly model = signal<{ approvers: string[] }>({ approvers: [] });
  protected readonly contract = form(this.model, (path) => {
    required(path.approvers);
  });
  protected readonly chosen = new FormControl<string[]>(['legal'], { nonNullable: true });
}

/** Pads the single-multiselect stories. */
@Component({
  selector: 'ave-multiselect-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './select.stories.css',
})
class MultiselectStoryFrame {}

/** The arguments of the Default story. */
interface MultiselectArgs {
  readonly size: AveSelectSize;
  readonly placeholder: string;
}

type Story = StoryObj<MultiselectArgs>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-multiselect-stories [view]="view" />`,
    moduleMetadata: { imports: [MultiselectStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

// No `component`: Storybook instantiates a meta's component outside an injection context, where `model()` throws.
const meta: Meta<MultiselectArgs> = {
  title: 'Components/Multiselect',
  args: { size: 'md', placeholder: 'Выберите согласующих' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [moduleMetadata({ imports: [AveMultiselect, MultiselectStoryFrame] })],
  render: (args) => ({
    props: { ...args, approvers },
    template: `<ave-multiselect label="Согласующие" lang="ru" [options]="approvers" [size]="size" [placeholder]="placeholder" />`,
  }),
};
export default meta;

/** One multiselect, with controls. */
export const Default: Story = {
  decorators: [componentWrapperDecorator(MultiselectStoryFrame)],
  parameters: source('<ave-multiselect [options]="approvers" [formField]="contract.approvers" />'),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox', { name: 'Согласующие' })).toHaveTextContent(
      'Выберите согласующих',
    );
  },
};

/** The open list: two options checked; it stays open while people check more. */
export const Open: Story = {
  decorators: [componentWrapperDecorator(MultiselectStoryFrame)],
  parameters: source('<ave-multiselect [options]="approvers" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Согласующие' });
    await userEvent.click(trigger);
    const listbox = await canvas.findByRole('listbox');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await userEvent.click(within(listbox).getByRole('option', { name: 'Юридический отдел' }));
    await userEvent.click(within(listbox).getByRole('option', { name: 'Служба безопасности' }));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveTextContent('Юридический отдел, Служба безопасности');
  },
};

/** Empty, chosen, readonly, disabled. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: source(
    '<ave-multiselect [options]="approvers" readonly />',
    '<ave-multiselect [options]="approvers" disabled />',
  ),
  play: async ({ canvasElement }) => {
    for (const trigger of canvasElement.querySelectorAll('.trigger'))
      await expect(trigger.getBoundingClientRect().height).toBe(36);
  },
};

/** Both form APIs: the chosen values, in the order of the list. */
export const Forms: Story = {
  render: () => ({ template: '<ave-multiselect-forms />', moduleMetadata: { imports: [MultiselectForms] } }),
  parameters: source(
    '<ave-multiselect [options]="approvers" [formField]="contract.approvers" />',
    '<ave-multiselect [options]="approvers" [formControl]="chosen" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('combobox', { name: 'Approvers (Signal Forms)' });
    await expect(signalForms).toHaveAttribute('aria-required', 'true');
    await userEvent.click(signalForms);
    await userEvent.click(await canvas.findByRole('option', { name: 'Финансовый отдел' }));
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent('Signal Forms: finance · Reactive Forms: legal'),
    );
    signalForms.blur();
  },
};

/** Every option chosen: the trigger truncates on one line and keeps its height. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: source('<ave-multiselect [options]="approvers" />'),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('.trigger');
    await expect(trigger?.getBoundingClientRect().height).toBe(36);
    const value = canvasElement.querySelector('.value');
    await expect((value?.scrollWidth ?? 0) > (value?.clientWidth ?? 0)).toBe(true);
  },
};
