import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, minLength } from '@angular/forms/signals';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveMultiselect, type AveSelectSize } from '@avelune/ui/select';
import { lucideFileArchive, lucideFileImage, lucideFileSpreadsheet, lucideFileText } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { approvers, regions, regionsUz } from './fixtures/options';
import { documentTypes } from './fixtures/rich';

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
    minLength(path.approvers, 1);
  });
  protected readonly chosen = new FormControl<string[]>(['legal'], { nonNullable: true });
}

/** A searchable multiselect (ADR 0057): the regions of Uzbekistan, in Russian and in Uzbek, Latin script. */
@Component({
  selector: 'ave-multiselect-search',
  imports: [AveMultiselect],
  template: `
    <div class="stack narrow room">
      <div class="field" lang="ru">
        <span class="label">Регионы поставки</span>
        <ave-multiselect
          label="Регионы поставки"
          search="local"
          placeholder="Начните вводить регион"
          [options]="regions"
          [(value)]="chosen"
        />
      </div>
      <div class="field" lang="uz-Latn">
        <span class="label">Yetkazib berish hududlari</span>
        <ave-multiselect label="Yetkazib berish hududlari" search="local" [options]="regionsUz" [value]="['fergana']" />
      </div>
    </div>
    <p class="status" role="status">Регионы: {{ chosen().join(', ') || 'нет' }}</p>
  `,
  styleUrl: './select.stories.css',
})
class MultiselectSearch {
  protected readonly regions = regions;
  protected readonly regionsUz = regionsUz;
  protected readonly chosen = signal<string[]>(['tashkent']);
}

/** Clearing (ADR 0052): an optional multiselect with chosen options shows the clear button; one that needs an option does not. */
@Component({
  selector: 'ave-multiselect-clearing',
  imports: [AveMultiselect, FormField],
  template: `
    <div class="grid" lang="ru">
      <div class="field">
        <span class="label">Можно очистить</span>
        <ave-multiselect
          label="Наблюдатели"
          placeholder="Выберите подразделения"
          [options]="approvers"
          [(value)]="watchers"
        />
      </div>
      <div class="field">
        <span class="label">Нужен хотя бы один</span>
        <ave-multiselect label="Согласующие (обязательно)" [options]="approvers" [formField]="contract.approvers" />
      </div>
    </div>
    <p class="status" role="status">Наблюдатели: {{ watchers().join(', ') || 'нет' }}</p>
  `,
  styleUrl: './select.stories.css',
})
class MultiselectClearing {
  protected readonly approvers = approvers;
  protected readonly watchers = signal<string[]>(['legal', 'security']);
  protected readonly model = signal<{ approvers: string[] }>({ approvers: ['finance'] });
  protected readonly contract = form(this.model, (path) => {
    minLength(path.approvers, 1);
  });
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

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
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
    // One row without tags; with them, rows of tags on the 4px grid (ADR 0081).
    for (const trigger of canvasElement.querySelectorAll('.trigger')) {
      const height = trigger.getBoundingClientRect().height;
      if (trigger.closest('[data-chips]') === null) await expect(height).toBe(36);
      else await expect(height % 4).toBe(0);
    }
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

/** Every option chosen: the tags wrap in rows and the field grows by a row; nothing is cut (ADR 0081). */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: source('<ave-multiselect [options]="approvers" />'),
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('ave-multiselect');
    const height = host?.getBoundingClientRect().height ?? 0;
    await expect(height).toBeGreaterThan(36);
    // Rows of tags 4px apart, 6px from the field's edges, on the 4px grid; a long name wraps inside its tag.
    await expect(height % 4).toBe(0);
    for (const tag of host?.querySelectorAll('ave-tag') ?? []) {
      await expect(tag.scrollWidth).toBeLessThanOrEqual(tag.clientWidth);
    }
    await expect(canvasElement.querySelector('.trigger')?.getBoundingClientRect().height).toBe(height);
  },
};

/**
 * Tags (ADR 0081): each chosen value is a tag in the field; its button unchecks it and puts focus on the trigger, and
 * is no Tab stop. A press on a tag's words opens the list.
 */
export const Tags: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(MultiselectStoryFrame)],
  render: (args) => ({
    props: { ...args, approvers },
    template: `<ave-multiselect label="Согласующие" lang="ru" [options]="approvers" [value]="['legal', 'finance', 'security']" />`,
  }),
  parameters: source('<ave-multiselect [options]="approvers" [formField]="contract.approvers" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Согласующие' });
    await expect(trigger).toHaveTextContent('Юридический отдел, Финансовый отдел, Служба безопасности');
    const remove = canvas.getByRole('button', { name: 'Убрать Финансовый отдел' });
    await expect(remove).toHaveAttribute('tabindex', '-1');
    await userEvent.click(remove);
    await expect(trigger).toHaveFocus();
    await expect(canvas.queryByRole('button', { name: 'Убрать Финансовый отдел' })).toBeNull();
    await expect(trigger).toHaveTextContent('Юридический отдел, Служба безопасности');
    // A press on a tag's words reaches the trigger under it, which opens the list.
    const words = canvas.getByText('Служба безопасности').getBoundingClientRect();
    await expect(document.elementFromPoint(words.left + words.width / 2, words.top + words.height / 2)).toBe(trigger);
    trigger.blur();
  },
};

/**
 * Clearing (ADR 0052): the button unchecks every option of an optional multiselect; Delete does the same on the
 * keyboard. One that needs an option has no button.
 */
export const Clearing: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-multiselect-clearing />', moduleMetadata: { imports: [MultiselectClearing] } }),
  parameters: source('<ave-multiselect [options]="approvers" [formField]="contract.watchers" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Наблюдатели' });
    await expect(canvas.getAllByRole('button', { name: /^Очистить/ })).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Очистить Наблюдатели' }));
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveTextContent('Выберите подразделения');
    await expect(canvas.getByRole('status')).toHaveTextContent('Наблюдатели: нет');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Наблюдатели: legal');
    await userEvent.keyboard('{Backspace}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Наблюдатели: нет');
    await userEvent.click(trigger);
    await userEvent.click(await canvas.findByRole('option', { name: 'Финансовый отдел' }));
    await userEvent.click(await canvas.findByRole('option', { name: 'Отдел закупок' }));
    await userEvent.keyboard('{Escape}');
    trigger.blur();
    await expect(canvas.getByRole('button', { name: 'Очистить Наблюдатели' })).toBeVisible();
  },
};

/**
 * Rich options (ADR 0055): document types with icons, the application registers (`provideAveIcons`), and counts at
 * the end; the trigger names the chosen labels.
 */
export const RichOptions: Story = {
  name: 'Rich options',
  decorators: [
    applicationConfig({
      providers: [provideAveIcons([lucideFileArchive, lucideFileImage, lucideFileSpreadsheet, lucideFileText])],
    }),
    componentWrapperDecorator(MultiselectStoryFrame),
  ],
  render: () => ({
    props: { documentTypes },
    template: `<ave-multiselect label="Типы документов" lang="ru" [options]="documentTypes" [value]="['contract', 'scan']" />`,
  }),
  parameters: source(
    "{ value: 'contract', label: 'Договоры', icon: 'file-text', meta: '128' }",
    '<ave-multiselect [options]="documentTypes" [formField]="filter.types" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Типы документов' });
    await expect(trigger).toHaveTextContent('Договоры, Сканы');
    await userEvent.click(trigger);
    const option = await canvas.findByRole('option', { name: 'Сметы' });
    await expect(option).toHaveAccessibleDescription('42');
    await expect(option.querySelector('ave-icon')).not.toBeNull();
    await expect(canvas.getByRole('option', { name: 'Сканы' })).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Search (ADR 0057, 0081): the tags say the chosen regions, the input holds only the search after them and filters by
 * label; checking one keeps the search and the list open; closing the list ends the search.
 */
export const Search: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-multiselect-search />', moduleMetadata: { imports: [MultiselectSearch] } }),
  parameters: source('<ave-multiselect search="local" [options]="regions" [formField]="contract.regions" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Регионы поставки' });
    await expect(input).toHaveValue('');
    await expect(input).toHaveAccessibleDescription(/Выбрано: город Ташкент/);
    await expect(canvas.getByRole('button', { name: 'Убрать город Ташкент' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Убрать Fargʻona viloyati' })).toBeVisible();
    await userEvent.click(input);
    await userEvent.keyboard('дарь');
    const listbox = await canvas.findByRole('listbox');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await waitFor(() =>
      expect(
        within(listbox)
          .getAllByRole('option')
          .map((option) => option.getAttribute('aria-label')),
      ).toEqual(['Кашкадарьинская область', 'Сурхандарьинская область', 'Сырдарьинская область']),
    );
    // Typing opens the list with its first match active; Enter checks it.
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('дарь');
    await expect(canvas.getByRole('status')).toHaveTextContent('Регионы: kashkadarya, tashkent');
    await userEvent.keyboard('{Escape}');
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('button', { name: 'Убрать Кашкадарьинская область' })).toBeVisible();
    await userEvent.click(input);
    await userEvent.keyboard('обл');
    await canvas.findAllByRole('option');
  },
};
