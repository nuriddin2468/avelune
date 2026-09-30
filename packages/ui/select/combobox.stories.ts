import { Component, LOCALE_ID, computed, input, signal } from '@angular/core';
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
import { AveCombobox, type AveSelectSize } from '@avelune/ui/select';
import { counterparties } from './fixtures/options';
import { countries, countriesUz } from './fixtures/rich';
import { counterpartyServer } from './fixtures/server';

type View = 'states' | 'long';

/** The frame the stories draw comboboxes in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-combobox-stories',
  imports: [AveCombobox],
  template: `
    @switch (view()) {
      @case ('long') {
        <div class="stack narrow room" lang="ru">
          <ave-combobox label="Контрагент" [options]="counterparties" [value]="6" />
          <ave-combobox label="Kontragent" lang="uz-Latn" [options]="counterparties" [value]="8" />
        </div>
      }
      @default {
        <div class="grid" lang="ru">
          <div class="field">
            <span class="label">Empty</span>
            <ave-combobox label="Empty" placeholder="Начните вводить название" [options]="counterparties" />
          </div>
          <div class="field">
            <span class="label">Chosen</span>
            <ave-combobox label="Chosen" [options]="counterparties" [value]="3" />
          </div>
          <div class="field">
            <span class="label">Readonly</span>
            <ave-combobox label="Readonly" [options]="counterparties" [value]="1" readonly />
          </div>
          <div class="field">
            <span class="label">Disabled</span>
            <ave-combobox label="Disabled" [options]="counterparties" [value]="2" disabled />
          </div>
        </div>
      }
    }
  `,
  styleUrl: './select.stories.css',
})
class ComboboxStories {
  readonly view = input<View>('states');
  protected readonly counterparties = counterparties;
}

/** Signal Forms and Reactive Forms: one required counterparty each. */
@Component({
  selector: 'ave-combobox-forms',
  imports: [AveCombobox, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow room">
      <div class="field">
        <span class="label">Counterparty (Signal Forms)</span>
        <ave-combobox
          label="Counterparty (Signal Forms)"
          [options]="counterparties"
          [formField]="contract.counterparty"
        />
      </div>
      <div class="field">
        <span class="label">Counterparty (Reactive Forms)</span>
        <ave-combobox label="Counterparty (Reactive Forms)" [options]="counterparties" [formControl]="counterparty" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().counterparty ?? 'nothing' }} · Reactive Forms: {{ counterparty.value ?? 'nothing' }}
    </p>
  `,
  styleUrl: './select.stories.css',
})
class ComboboxForms {
  protected readonly counterparties = counterparties;
  protected readonly model = signal<{ counterparty: number | null }>({ counterparty: null });
  protected readonly contract = form(this.model, (path) => {
    required(path.counterparty);
  });
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  protected readonly counterparty = new FormControl<number | null>(null, { validators: [Validators.required] });
}

/** Clearing (ADR 0052): an optional combobox with a value shows the clear button inside its end; a required one does not. */
@Component({
  selector: 'ave-combobox-clearing',
  imports: [AveCombobox, FormField],
  template: `
    <div class="grid" lang="ru">
      <div class="field">
        <span class="label">Можно очистить</span>
        <ave-combobox
          label="Плательщик"
          placeholder="Начните вводить название"
          [options]="counterparties"
          [(value)]="payer"
        />
      </div>
      <div class="field">
        <span class="label">Обязательный</span>
        <ave-combobox
          label="Контрагент (обязательный)"
          [options]="counterparties"
          [formField]="contract.counterparty"
        />
      </div>
    </div>
    <p class="status" role="status">Плательщик: {{ payer() ?? 'не выбран' }}</p>
  `,
  styleUrl: './select.stories.css',
})
class ComboboxClearing {
  protected readonly counterparties = counterparties;
  protected readonly payer = signal<number | null>(6);
  protected readonly model = signal<{ counterparty: number | null }>({ counterparty: 3 });
  protected readonly contract = form(this.model, (path) => {
    required(path.counterparty);
  });
}

/** Rich options (ADR 0055): countries in Russian and in Uzbek, Latin script. */
@Component({
  selector: 'ave-combobox-rich',
  imports: [AveCombobox],
  template: `
    <div class="stack narrow room">
      <ave-combobox label="Страна" lang="ru" [options]="countries" />
      <ave-combobox label="Mamlakat" lang="uz-Latn" [options]="countriesUz" value="uz" />
    </div>
  `,
  styleUrl: './select.stories.css',
})
class ComboboxRich {
  protected readonly countries = countries;
  protected readonly countriesUz = countriesUz;
}

/** A combobox that searches a pretend server (ADR 0056): pages of twenty, after a delay, failing first if asked. */
@Component({
  selector: 'ave-combobox-server',
  imports: [AveCombobox],
  template: `
    <div class="narrow room" lang="ru">
      <div class="field">
        <span class="label">Контрагент</span>
        <ave-combobox
          label="Контрагент"
          placeholder="Название или ИНН"
          search="server"
          [options]="server().options()"
          [loading]="server().loading()"
          [error]="server().failed()"
          [hasMore]="server().hasMore()"
          [(value)]="counterparty"
          (query)="server().query($event)"
          (loadMore)="server().loadMore()"
        />
      </div>
      <p class="status" role="status">Контрагент: {{ counterparty() ?? 'не выбран' }}</p>
    </div>
  `,
  styleUrl: './select.stories.css',
})
class ComboboxServer {
  readonly fails = input<'first' | 'always'>();
  protected readonly counterparty = signal<number | null>(null);
  // Made once the input is set, when the template first reads it.
  protected readonly server = computed(() => {
    const fails = this.fails();
    return counterpartyServer(fails === undefined ? { latency: 400 } : { latency: 400, fails });
  });
}

/** Pads the single-combobox stories. */
@Component({
  selector: 'ave-combobox-story-frame',
  template: '<div class="narrow room"><ng-content /></div>',
  styleUrl: './select.stories.css',
})
class ComboboxStoryFrame {}

/** The arguments of the Default story. */
interface ComboboxArgs {
  readonly size: AveSelectSize;
  readonly placeholder: string;
}

type Story = StoryObj<ComboboxArgs>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-combobox-stories [view]="view" />`,
    moduleMetadata: { imports: [ComboboxStories] },
  });
}

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

const meta: Meta<ComboboxArgs> = {
  title: 'Components/Combobox',
  component: AveCombobox,
  args: { size: 'md', placeholder: 'Начните вводить название' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  decorators: [
    moduleMetadata({ imports: [AveCombobox, ComboboxStoryFrame] }),
    componentWrapperDecorator(ComboboxStoryFrame),
  ],
  render: (args) => ({
    props: { ...args, counterparties },
    template: `<ave-combobox label="Контрагент" lang="ru" [options]="counterparties" [size]="size" [placeholder]="placeholder" />`,
  }),
};
export default meta;

/** One combobox, with controls. */
export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: '<ave-combobox label="Контрагент" [options]="counterparties" size="md" placeholder="Начните вводить название" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox', { name: 'Контрагент' });
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  },
};

/** Typing filters the list: "узбек" shows the two organisations whose names contain it in Cyrillic. */
export const Filtering: Story = {
  parameters: {
    docs: {
      source: {
        code: '<ave-combobox label="Контрагент" placeholder="Начните вводить название" [options]="counterparties" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Контрагент' });
    await userEvent.type(input, 'узбек');
    const listbox = await canvas.findByRole('listbox');
    await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(2));
    await userEvent.keyboard('{ArrowDown}');
  },
};

/** "o'zbek", typed with an ASCII apostrophe, finds "Oʻzbekiston". */
export const UzbekApostrophes: Story = {
  name: 'Uzbek apostrophes',
  parameters: {
    docs: {
      source: {
        code: '<ave-combobox label="Контрагент" placeholder="Начните вводить название" [options]="counterparties" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox', { name: 'Контрагент' }), "o'zbekiston");
    const listbox = await canvas.findByRole('listbox');
    await waitFor(() =>
      expect(
        within(listbox)
          .getAllByRole('option')
          .map((option) => option.textContent.trim()),
      ).toEqual(['Oʻzbekiston temir yoʻllari', 'Oʻzbekiston milliy banki']),
    );
  },
};

/** Nothing matches: the list says so, in the application's language. */
export const NoResults: Story = {
  name: 'No results',
  parameters: {
    docs: {
      source: {
        code: '<ave-combobox label="Контрагент" placeholder="Начните вводить название" [options]="counterparties" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox', { name: 'Контрагент' }), 'Омега');
    await expect(await canvas.findByRole('status')).toHaveTextContent('No results');
  },
};

/** Empty, chosen, readonly, disabled. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox label="Empty" placeholder="Начните вводить название" [options]="counterparties" />
<ave-combobox label="Chosen" [options]="counterparties" [value]="3" />
<ave-combobox label="Readonly" [options]="counterparties" [value]="1" readonly />
<ave-combobox label="Disabled" [options]="counterparties" [value]="2" disabled />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const input of canvasElement.querySelectorAll('input'))
      await expect(input.getBoundingClientRect().height).toBe(36);
    await expect(within(canvasElement).getByRole('combobox', { name: 'Chosen' })).toHaveValue('АО «Узбекнефтегаз»');
  },
};

/** Both form APIs: a required counterparty, invalid once left empty. */
export const Forms: Story = {
  render: () => ({ template: '<ave-combobox-forms />', moduleMetadata: { imports: [ComboboxForms] } }),
  decorators: [],
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox label="Counterparty (Signal Forms)" [options]="counterparties" [formField]="contract.counterparty" />
<ave-combobox label="Counterparty (Reactive Forms)" [options]="counterparties" [formControl]="counterparty" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('combobox', { name: 'Counterparty (Signal Forms)' });
    const reactive = canvas.getByRole('combobox', { name: 'Counterparty (Reactive Forms)' });
    signalForms.focus();
    await userEvent.tab();
    await userEvent.tab();
    await waitFor(() => expect(signalForms).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(reactive).toHaveAttribute('aria-invalid', 'true'));
    await userEvent.type(reactive, 'Гамма');
    await userEvent.click(await canvas.findByRole('option', { name: 'ООО «Гамма Консалтинг»' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: 9');
    reactive.blur();
  },
};

/** Long names truncate in the input, which keeps its height; the list shows them in full. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  decorators: [],
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox label="Контрагент" [options]="counterparties" [value]="6" />
<ave-combobox label="Kontragent" lang="uz-Latn" [options]="counterparties" [value]="8" />`,
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

/**
 * Clearing (ADR 0052): the button empties an optional combobox and leaves focus in it; deleting the text and leaving
 * does the same on the keyboard. A long label stops before the button.
 */
export const Clearing: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-combobox-clearing />', moduleMetadata: { imports: [ComboboxClearing] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox label="Плательщик" placeholder="Начните вводить название" [options]="counterparties" [(value)]="payer" />
<ave-combobox label="Контрагент (обязательный)" [options]="counterparties" [formField]="contract.counterparty" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Плательщик' });
    const clear = canvas.getByRole('button', { name: 'Очистить Плательщик' });
    await expect(canvas.getAllByRole('button', { name: /^Очистить/ })).toHaveLength(1);
    const style = getComputedStyle(input);
    const textEnd = input.getBoundingClientRect().right - Number.parseFloat(style.paddingInlineEnd);
    await expect(clear.getBoundingClientRect().left - textEnd).toBe(4);
    await userEvent.click(clear);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue('');
    await expect(canvas.getByRole('status')).toHaveTextContent('Плательщик: не выбран');
    await userEvent.type(input, 'Гамма');
    await userEvent.click(await canvas.findByRole('option', { name: 'ООО «Гамма Консалтинг»' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Плательщик: 9');
    await userEvent.clear(input);
    await userEvent.keyboard('{Escape}');
    input.blur();
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Плательщик: не выбран'));
    await userEvent.type(input, 'документооборот');
    await userEvent.click(await canvas.findByRole('option', { name: /документооборота/ }));
    input.blur();
    await expect(canvas.getByRole('button', { name: 'Очистить Плательщик' })).toBeVisible();
  },
};

/**
 * Rich options (ADR 0055): countries with flags, capitals and codes; the search reads the label, and the input holds
 * the chosen label as text. Uzbek in Latin script beside it.
 */
export const RichOptions: Story = {
  name: 'Rich options',
  render: () => ({ template: '<ave-combobox-rich />', moduleMetadata: { imports: [ComboboxRich] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox label="Страна" lang="ru" [options]="countries" />
<ave-combobox label="Mamlakat" lang="uz-Latn" [options]="countriesUz" value="uz" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('combobox', { name: 'Mamlakat' })).toHaveValue('Oʻzbekiston Respublikasi');
    const input = canvas.getByRole('combobox', { name: 'Страна' });
    await userEvent.type(input, 'стан');
    const options = await canvas.findAllByRole('option');
    await expect(options.map((option) => option.getAttribute('aria-label'))).toEqual([
      'Узбекистан',
      'Казахстан',
      'Таджикистан',
      'Туркменистан',
    ]);
    await expect(options[0]).toHaveAccessibleDescription('Ташкент UZ');
    await userEvent.type(input, '{Backspace}{Backspace}{Backspace}{Backspace}Ташкент');
    await expect(await canvas.findByRole('status')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'стан');
  },
};

/**
 * Server search (ADR 0056): the first page when the list opens, a search once typing pauses, the next page at the
 * list's end; the server matches on the tax number, which the label does not hold.
 */
export const ServerSearch: Story = {
  name: 'Server search',
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-combobox-server />', moduleMetadata: { imports: [ComboboxServer] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox
  label="Контрагент"
  placeholder="Название или ИНН"
  search="server"
  [options]="page.options()"
  [loading]="page.loading()"
  [error]="page.failed()"
  [hasMore]="page.hasMore()"
  [(value)]="counterparty"
  (query)="page.query($event)"
  (loadMore)="page.loadMore()"
/>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Контрагент' });
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(20), { timeout: 3000 });
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(40), { timeout: 3000 });
    await userEvent.type(input, '300 047');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1), { timeout: 3000 });
    await expect(canvas.getByRole('option')).toHaveAccessibleDescription(/300 047 514/);
    await userEvent.clear(input);
    await userEvent.type(input, 'Альфа');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(10), { timeout: 3000 });
  },
};

/** A request that failed: the list says so and offers to try again, which Enter does too; the second request answers. */
export const ServerStates: Story = {
  name: 'Server states',
  decorators: [locale('ru')],
  render: () => ({
    template: '<ave-combobox-server fails="first" />',
    moduleMetadata: { imports: [ComboboxServer] },
  }),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { AveCombobox, type AveOption } from '@avelune/ui/select';

@Component({
  selector: 'app-counterparty-search',
  imports: [AveCombobox],
  template: \`
    <ave-combobox
      label="Контрагент"
      placeholder="Название или ИНН"
      search="server"
      [options]="options()"
      [loading]="loading()"
      [error]="failed()"
      [hasMore]="hasMore()"
      [(value)]="counterparty"
      (query)="find($event)"
      (loadMore)="loadMore()"
    />
  \`,
})
export class CounterpartySearch {
  protected readonly options = signal<readonly AveOption<number>[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly hasMore = signal(false);
  protected readonly counterparty = signal<number | null>(null);

  protected find(text: string): void {
    // Ask the server for the first page of counterparties matching the text: set loading, then options, hasMore and failed.
  }

  protected loadMore(): void {
    // Ask for the next page and append it to the options.
  }
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: 'Контрагент' });
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    const retry = await canvas.findByRole('button', { name: 'Повторить' }, { timeout: 3000 });
    await expect(canvas.getByText('Список не загрузился.')).toBeInTheDocument();
    await userEvent.click(retry);
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(20), { timeout: 3000 });
    await userEvent.type(input, 'Нет такого');
    await waitFor(() => expect(canvas.getByText('Ничего не найдено')).toBeInTheDocument(), { timeout: 3000 });
  },
};

/** A server that does not answer: the list says so and offers to try again; screen readers hear that Enter does. */
export const ServerFailed: Story = {
  name: 'Server failed',
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-combobox-server fails="always" />', moduleMetadata: { imports: [ComboboxServer] } }),
  parameters: {
    docs: {
      source: {
        code: `<ave-combobox
  label="Контрагент"
  placeholder="Название или ИНН"
  search="server"
  [options]="page.options()"
  [loading]="page.loading()"
  [error]="page.failed()"
  [hasMore]="page.hasMore()"
  [(value)]="counterparty"
  (query)="page.query($event)"
  (loadMore)="page.loadMore()"
/>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('combobox', { name: 'Контрагент' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    await canvas.findByRole('button', { name: 'Повторить' }, { timeout: 3000 });
    await waitFor(() =>
      expect(document.querySelector('.cdk-live-announcer-element')).toHaveTextContent(
        'Список не загрузился. Нажмите Enter, чтобы повторить.',
      ),
    );
  },
};
