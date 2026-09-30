import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveInput } from '@avelune/ui/input';
import {
  AveOptionTemplate,
  AveSelect,
  AveSelectValueTemplate,
  type AveOption,
  type AveSelectSize,
} from '@avelune/ui/select';
import { kinds } from './fixtures/options';
import { accounts, countries, employees, type Account } from './fixtures/rich';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveSelectSize[];

type View = 'sizes' | 'states' | 'long' | 'compact';

const longKinds: readonly AveOption<string>[] = [
  { value: 'framework', label: 'Рамочный договор на поставку серверного оборудования и программного обеспечения' },
  { value: 'uz', label: 'Davlat xaridlari toʻgʻrisidagi qonun asosida tuzilgan shartnoma' },
  { value: 'short', label: 'Заём' },
];

/** The frame the stories draw selects in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-select-stories',
  imports: [AveInput, AveSelect],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="stack">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-select [label]="'Kind, ' + size" placeholder="Choose a kind" [options]="kinds" [size]="size" />
            </div>
          }
        </div>
      }
      @case ('states') {
        <div class="grid" lang="ru">
          <div class="field">
            <span class="label" id="empty">Empty</span>
            <ave-select label="Empty" placeholder="Выберите вид" [options]="kinds" />
          </div>
          <div class="field">
            <span class="label">Chosen</span>
            <ave-select label="Chosen" [options]="kinds" value="services" />
          </div>
          <div class="field">
            <span class="label">Focused</span>
            <ave-select label="Focused" data-focus-target [options]="kinds" value="supply" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-select label="Readonly" [options]="kinds" value="lease" readonly />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-select label="Disabled" [options]="kinds" value="works" disabled />
          </div>
        </div>
      }
      @case ('compact') {
        <div class="stack" data-density="compact">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-row]="size">
              <input aveInput type="text" [size]="size" [attr.aria-label]="'Number, ' + size" value="ДК-2026/114" />
              <ave-select [label]="'Kind, ' + size" [options]="kinds" value="supply" [size]="size" />
            </div>
          }
        </div>
      }
      @default {
        <div class="stack narrow room" lang="ru">
          <ave-select label="Вид договора" [options]="longKinds" value="framework" />
          <ave-select label="Shartnoma turi" lang="uz-Latn" [options]="longKinds" value="uz" />
        </div>
      }
    }
  `,
  styleUrl: './select.stories.css',
})
class SelectStories {
  readonly view = input<View>('states');
  protected readonly sizes = sizes;
  protected readonly kinds = kinds;
  protected readonly longKinds = longKinds;
}

/** Signal Forms and Reactive Forms: one required choice each, invalid once left empty. */
@Component({
  selector: 'ave-select-forms',
  imports: [AveSelect, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow">
      <div class="field">
        <span class="label">Kind (Signal Forms)</span>
        <ave-select
          label="Kind (Signal Forms)"
          placeholder="Choose a kind"
          [options]="kinds"
          [formField]="contract.kind"
        />
      </div>
      <div class="field">
        <span class="label">Kind (Reactive Forms)</span>
        <ave-select label="Kind (Reactive Forms)" placeholder="Choose a kind" [options]="kinds" [formControl]="kind" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().kind ?? 'nothing' }} · Reactive Forms: {{ kind.value ?? 'nothing' }}
    </p>
  `,
  styleUrl: './select.stories.css',
})
class SelectForms {
  protected readonly kinds = kinds;
  protected readonly model = signal<{ kind: string | null }>({ kind: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.kind);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly kind = new FormControl<string | null>(null, { validators: [Validators.required] });
}

/**
 * Clearing (ADR 0052): an optional select with a value shows the clear button before its chevron; a required or a
 * readonly one does not.
 */
@Component({
  selector: 'ave-select-clearing',
  imports: [AveSelect, FormField],
  template: `
    <div class="grid" lang="ru">
      <div class="field">
        <span class="label">Можно очистить</span>
        <ave-select label="Вид договора" placeholder="Выберите вид" [options]="kinds" [(value)]="kind" />
      </div>
      <div class="field">
        <span class="label">Обязательный</span>
        <ave-select label="Вид договора (обязательный)" [options]="kinds" [formField]="contract.kind" />
      </div>
      <div class="field">
        <span class="label">Только чтение</span>
        <ave-select label="Вид договора (только чтение)" [options]="kinds" value="services" readonly />
      </div>
    </div>
    <p class="status" role="status">Можно очистить: {{ kind() ?? 'ничего' }}</p>
  `,
  styleUrl: './select.stories.css',
})
class SelectClearing {
  protected readonly kinds = kinds;
  protected readonly kind = signal<string | null>('services');
  protected readonly model = signal<{ kind: string | null }>({ kind: 'supply' });
  protected readonly contract = form(this.model, (path) => {
    required(path.kind);
  });
}

/** Rich options (ADR 0055): countries with flags, capitals and codes; people with avatars and departments. */
@Component({
  selector: 'ave-select-rich',
  imports: [AveSelect],
  template: `
    <div class="grid room" lang="ru">
      <div class="field">
        <span class="label">Страна</span>
        <ave-select label="Страна" [options]="countries" value="uz" />
      </div>
      <div class="field">
        <span class="label">Исполнитель</span>
        <ave-select label="Исполнитель" [options]="employees" [value]="2" />
      </div>
    </div>
  `,
  styleUrl: './select.stories.css',
})
class SelectRich {
  protected readonly countries = countries;
  protected readonly employees = employees;
}

/** Templates (ADR 0055): accounts drawn in the application's markup, inside the kit's rows and trigger. */
@Component({
  selector: 'ave-select-templates',
  imports: [AveOptionTemplate, AveSelect, AveSelectValueTemplate],
  template: `
    <div class="narrow room" lang="ru">
      <div class="field">
        <span class="label">Счёт списания</span>
        <ave-select label="Счёт списания" placeholder="Выберите счёт" [options]="accounts" [(value)]="account">
          <ng-template aveOption [aveOptionOf]="accounts" let-option>
            <span class="account">
              <span class="number">{{ option.value.number }}</span>
              <span class="bank">{{ option.value.bank }} · {{ option.value.balance }} сум</span>
            </span>
          </ng-template>
          <ng-template aveSelectValue [aveSelectValueOf]="accounts" let-option>
            {{ option.value.bank }}, …{{ option.value.number.slice(-4) }}
          </ng-template>
        </ave-select>
      </div>
    </div>
  `,
  styleUrl: './select.stories.css',
})
class SelectTemplates {
  protected readonly accounts = accounts;
  protected readonly account = signal<Account | null>(accounts[0]?.value ?? null);
}

/** Pads the Default and Open stories; styled with tokens only. */
@Component({
  selector: 'ave-select-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './select.stories.css',
})
class SelectStoryFrame {}

/** The arguments of the Default story. */
interface SelectArgs {
  readonly size: AveSelectSize;
  readonly placeholder: string;
}

type Story = StoryObj<SelectArgs>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-select-stories [view]="view" />`,
    moduleMetadata: { imports: [SelectStories] },
  });
}

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

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

const meta: Meta<SelectArgs> = {
  title: 'Components/Select',
  component: AveSelect,
  args: { size: 'md', placeholder: 'Выберите вид договора' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [moduleMetadata({ imports: [AveSelect, SelectStoryFrame] })],
  render: (args) => ({
    props: { ...args, kinds },
    template: `<ave-select label="Вид договора" lang="ru" [options]="kinds" [size]="size" [placeholder]="placeholder" />`,
  }),
};
export default meta;

/** One select, with controls. */
export const Default: Story = {
  decorators: [componentWrapperDecorator(SelectStoryFrame)],
  parameters: {
    docs: {
      source: {
        code: '<ave-select label="Вид договора" [options]="kinds" size="md" placeholder="Выберите вид договора" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('combobox', { name: 'Вид договора' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveTextContent('Выберите вид договора');
  },
};

/** The open list: Down opens it on the chosen option, the arrow keys move, the chosen option has a check. */
export const Open: Story = {
  decorators: [componentWrapperDecorator(SelectStoryFrame)],
  render: () => ({
    props: { kinds },
    template: `<ave-select label="Вид договора" lang="ru" [options]="kinds" value="services" />`,
  }),
  parameters: {
    docs: {
      source: { code: '<ave-select label="Вид договора" [options]="kinds" value="services" />', language: 'html' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Вид договора' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = await canvas.findByRole('listbox');
    await expect(within(listbox).getAllByRole('option')).toHaveLength(kinds.length);
    await expect(within(listbox).getByRole('option', { name: 'Оказание услуг' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(within(listbox).getByRole('option', { name: 'Заём' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowDown}');
  },
};

/** Each size next to an Input of that size: the same box. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<ave-select label="Kind, sm" placeholder="Choose a kind" [options]="kinds" size="sm" />
<ave-select label="Kind, md" placeholder="Choose a kind" [options]="kinds" size="md" />
<ave-select label="Kind, lg" placeholder="Choose a kind" [options]="kinds" size="lg" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.row')) {
      const input = row.querySelector('input');
      const trigger = row.querySelector('.trigger');
      if (input === null || trigger === null) throw new Error('No controls');
      await expect(box(trigger), row.getAttribute('data-row') ?? '').toEqual(box(input));
    }
  },
};

/** Empty, chosen, focused, readonly, disabled: one size in every state. Invalid is in the Forms story. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<ave-select label="Empty" placeholder="Выберите вид" [options]="kinds" />
<ave-select label="Chosen" [options]="kinds" value="services" />
<ave-select label="Focused" [options]="kinds" value="supply" />
<ave-select label="Readonly" [options]="kinds" value="lease" readonly />
<ave-select label="Disabled" [options]="kinds" value="works" disabled />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const triggers = [...canvasElement.querySelectorAll('.trigger')];
    for (const trigger of triggers) await expect(trigger.getBoundingClientRect().height).toBe(36);
    const focused = canvasElement.querySelector('[data-focus-target] .trigger');
    if (!(focused instanceof HTMLElement)) throw new Error('No trigger');
    focused.focus();
    await expect(focused.matches(':focus-visible')).toBe(true);
    await expect(within(canvasElement).getByRole('combobox', { name: 'Disabled' })).toBeDisabled();
  },
};

/** Both form APIs: a required choice, invalid once it is left empty. */
export const Forms: Story = {
  render: () => ({ template: '<ave-select-forms />', moduleMetadata: { imports: [SelectForms] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-select label="Kind (Signal Forms)" placeholder="Choose a kind" [options]="kinds" [formField]="contract.kind" />
<ave-select label="Kind (Reactive Forms)" placeholder="Choose a kind" [options]="kinds" [formControl]="kind" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('combobox', { name: 'Kind (Signal Forms)' });
    const reactive = canvas.getByRole('combobox', { name: 'Kind (Reactive Forms)' });
    await expect(signalForms).toHaveAttribute('aria-required', 'true');
    signalForms.focus();
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(signalForms).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(reactive).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.click(reactive);
    await userEvent.click(await canvas.findByRole('option', { name: 'Подряд' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: works');
    await waitFor(() => expect(reactive).not.toHaveAttribute('aria-invalid'));
    reactive.blur();
  },
};

/** A long label truncates in the trigger, which keeps its height; the list shows it in full. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-select label="Вид договора" [options]="longKinds" value="framework" />
<ave-select label="Shartnoma turi" lang="uz-Latn" [options]="longKinds" value="uz" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    for (const trigger of canvasElement.querySelectorAll('.trigger')) {
      await expect(trigger.getBoundingClientRect().height).toBe(36);
    }
    const [first] = canvasElement.querySelectorAll<HTMLElement>('.trigger');
    first?.focus();
    await userEvent.keyboard('{ArrowDown}');
    const option = await within(canvasElement).findByRole('option', { name: longKinds[0]?.label ?? '' });
    await expect(option.getBoundingClientRect().height).toBeGreaterThan(36);
  },
};

/** Compact density: every size one step down, next to its Input. */
export const Compact: Story = {
  render: frame('compact'),
  parameters: {
    docs: {
      source: {
        code: `<div data-density="compact">
  <ave-select label="Kind, sm" [options]="kinds" value="supply" size="sm" />
  <ave-select label="Kind, md" [options]="kinds" value="supply" size="md" />
  <ave-select label="Kind, lg" [options]="kinds" value="supply" size="lg" />
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      const trigger = canvasElement.querySelector(`[data-row="${size}"] .trigger`);
      await expect(trigger?.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};

/**
 * Clearing (ADR 0052): the button empties an optional select and leaves focus on the trigger; Delete does the same on
 * the keyboard. A required or readonly select has none.
 */
export const Clearing: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-select-clearing />', moduleMetadata: { imports: [SelectClearing] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-select label="Вид договора" placeholder="Выберите вид" [options]="kinds" [(value)]="kind" />
<ave-select label="Вид договора (обязательный)" [options]="kinds" [formField]="contract.kind" />
<ave-select label="Вид договора (только чтение)" [options]="kinds" value="services" readonly />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Вид договора' });
    const clear = canvas.getByRole('button', { name: 'Очистить Вид договора' });
    await expect(clear).toHaveAttribute('tabindex', '-1');
    await expect(canvas.getAllByRole('button', { name: /^Очистить/ })).toHaveLength(1);
    const value = trigger.querySelector('.value');
    await expect(clear.getBoundingClientRect().left - (value?.getBoundingClientRect().right ?? 0)).toBe(4);
    await userEvent.click(clear);
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveTextContent('Выберите вид');
    await expect(canvas.getByRole('status')).toHaveTextContent('Можно очистить: ничего');
    await expect(canvas.queryByRole('button', { name: /^Очистить/ })).toBeNull();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Можно очистить: supply');
    await userEvent.keyboard('{Delete}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Можно очистить: ничего');
    await userEvent.click(trigger);
    await userEvent.click(await canvas.findByRole('option', { name: 'Оказание услуг' }));
    await expect(canvas.getByRole('button', { name: 'Очистить Вид договора' })).toBeVisible();
    trigger.blur();
  },
};

/**
 * Rich options (ADR 0055): a flag in a 20px square, the capital under the label, the code at the end; an avatar and a
 * department. Each option is named by its label and described by the rest; the trigger shows the flag and the label.
 */
export const RichOptions: Story = {
  name: 'Rich options',
  render: () => ({ template: '<ave-select-rich />', moduleMetadata: { imports: [SelectRich] } }),
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { AveSelect, type AveOption } from '@avelune/ui/select';

@Component({
  selector: 'app-company-country',
  imports: [AveSelect],
  template: \`
    <ave-select label="Страна" [options]="countries" value="uz" />
    <ave-select label="Исполнитель" [options]="employees" [value]="2" />
  \`,
})
export class CompanyCountry {
  protected readonly countries: readonly AveOption<string>[] = [
    { value: 'uz', label: 'Узбекистан', description: 'Ташкент', meta: 'UZ', image: 'assets/flags/uz.svg' },
    { value: 'kz', label: 'Казахстан', description: 'Астана', meta: 'KZ', image: 'assets/flags/kz.svg' },
    { value: 'kg', label: 'Киргизия', description: 'Бишкек', meta: 'KG', image: 'assets/flags/kg.svg' },
    { value: 'tj', label: 'Таджикистан', description: 'Душанбе', meta: 'TJ', image: 'assets/flags/tj.svg' },
    { value: 'tm', label: 'Туркменистан', description: 'Ашхабад', meta: 'TM', image: 'assets/flags/tm.svg', disabled: true },
    { value: 'ru', label: 'Россия', description: 'Москва', meta: 'RU', image: 'assets/flags/ru.svg' },
    { value: 'tr', label: 'Турция', description: 'Анкара', meta: 'TR', image: 'assets/flags/tr.svg' },
    { value: 'de', label: 'Германия', description: 'Берлин', meta: 'DE', image: 'assets/flags/de.svg' },
    { value: 'jp', label: 'Япония', description: 'Токио', meta: 'JP', image: 'assets/flags/jp.svg' },
    {
      value: 'gb',
      label: 'Соединённое Королевство Великобритании и Северной Ирландии',
      description: 'Лондон',
      meta: 'GB',
      image: 'assets/flags/gb.svg',
    },
  ];
  protected readonly employees: readonly AveOption<number>[] = [
    { value: 1, label: 'Каримов Алишер', description: 'Юридический отдел', image: 'assets/avatars/karimov.svg' },
    { value: 2, label: 'Юсупова Дилноза', description: 'Финансовый отдел', image: 'assets/avatars/yusupova.svg' },
    { value: 3, label: 'Рахимов Бахтиёр', description: 'Служба безопасности', image: 'assets/avatars/rahimov.svg' },
    { value: 4, label: 'Ахмедова Нигора', description: 'Отдел закупок', image: 'assets/avatars/akhmedova.svg' },
  ];
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Страна' });
    await expect(trigger).toHaveTextContent('Узбекистан');
    await expect(trigger.querySelector('.image')).not.toBeNull();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const option = await canvas.findByRole('option', { name: 'Узбекистан' });
    await expect(option).toHaveAccessibleDescription('Ташкент UZ');
    await expect(option).toHaveAttribute('aria-selected', 'true');
    const image = option.querySelector<HTMLElement>('.image');
    if (image === null) throw new Error('No image');
    // The layout's size: the list scales in as it enters.
    await expect([image.offsetWidth, image.offsetHeight]).toEqual([20, 20]);
    await expect(getComputedStyle(image).backgroundImage).toMatch(/^url\("data:image\/svg\+xml,/);
    const long = canvas.getByRole('option', { name: /^Соединённое Королевство/ });
    await expect(long.offsetHeight).toBeGreaterThan(option.offsetHeight);
    // The longest word breaks in its row: the list never scrolls sideways, and the check stays inside it.
    const listbox = canvas.getByRole('listbox');
    await expect(listbox.scrollWidth).toBe(listbox.clientWidth);
    const check = option.querySelector('.check')?.getBoundingClientRect().right ?? Infinity;
    await expect(check).toBeLessThanOrEqual(listbox.getBoundingClientRect().right);
  },
};

/**
 * Templates (ADR 0055): the application draws an option's inside and the chosen value; the row keeps its height,
 * padding and check, the trigger its box and chevron. Options are still named by their labels.
 */
export const Templates: Story = {
  render: () => ({ template: '<ave-select-templates />', moduleMetadata: { imports: [SelectTemplates] } }),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import {
  AveOptionTemplate,
  AveSelect,
  AveSelectValueTemplate,
  type AveOption,
} from '@avelune/ui/select';

interface Account {
  readonly number: string;
  readonly bank: string;
  readonly balance: string;
}

@Component({
  selector: 'app-payment-account',
  imports: [AveOptionTemplate, AveSelect, AveSelectValueTemplate],
  template: \`
    <ave-select label="Счёт списания" placeholder="Выберите счёт" [options]="accounts" [(value)]="account">
      <ng-template aveOption [aveOptionOf]="accounts" let-option>
        <span>{{ option.value.number }}</span>
        <span>{{ option.value.bank }} · {{ option.value.balance }} сум</span>
      </ng-template>
      <ng-template aveSelectValue [aveSelectValueOf]="accounts" let-option>
        {{ option.value.bank }}, …{{ option.value.number.slice(-4) }}
      </ng-template>
    </ave-select>
  \`,
})
export class PaymentAccount {
  protected readonly accounts: readonly AveOption<Account>[] = [
    {
      value: { number: '2020 8000 1234 5678 9012', bank: 'Oʻzmilliybank', balance: '125 400 000,00' },
      label: 'Расчётный счёт в Oʻzmilliybank, …9012',
    },
    {
      value: { number: '2020 8000 9876 5432 1098', bank: 'Kapitalbank', balance: '8 250 000,00' },
      label: 'Расчётный счёт в Kapitalbank, …1098',
    },
  ];
  protected readonly account = signal<Account | null>(this.accounts[0]?.value ?? null);
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Счёт списания' });
    await expect(trigger).toHaveTextContent('Oʻzmilliybank, …9012');
    await userEvent.click(trigger);
    const options = await canvas.findAllByRole('option');
    await expect(options.map((option) => option.getAttribute('aria-label'))).toEqual(
      accounts.map((account) => account.label),
    );
    await expect(options[0]?.querySelector('.check')).not.toBeNull();
    await userEvent.click(options[1] ?? trigger);
    await expect(trigger).toHaveTextContent('Kapitalbank, …1098');
    await userEvent.click(trigger);
    await canvas.findAllByRole('option');
  },
};
