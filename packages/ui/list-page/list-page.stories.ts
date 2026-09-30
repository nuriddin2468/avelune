import { Component, LOCALE_ID, computed, input, signal, type OnInit } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideSearch } from '@avelune/icons/lucide';
import { AveAlert } from '@avelune/ui/alert';
import { AveBadge } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveCellTemplate, AveDataTable, type AveColumn } from '@avelune/ui/data-table';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import {
  AveAppliedFilters,
  AveFilterPanel,
  AveFilterPanelContent,
  type AveAppliedFilter,
} from '@avelune/ui/filter-panel';
import { AveChoiceGroup } from '@avelune/ui/form-field';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';
import { AveListPage, AveListPageNotice } from '@avelune/ui/list-page';
import { AveSearchHeader, AveSearchHeaderActions, AveSearchHeaderSearch } from '@avelune/ui/search-header';

type View = 'default' | 'collapsed' | 'narrow' | 'empty' | 'loading';

type Status = 'approval' | 'signed' | 'expired';

interface Contract {
  readonly number: string;
  readonly subject: string;
  readonly counterparty: string;
  readonly status: Status;
}

const statuses: Record<Status, string> = { approval: 'На согласовании', signed: 'Подписан', expired: 'Истёк' };
const variants = { approval: 'info', signed: 'success', expired: 'danger' } as const;

const contracts: readonly Contract[] = [
  { number: 'ДК-2025/114', subject: 'Поставка офисной мебели', counterparty: 'ООО «Мебель Сервис»', status: 'signed' },
  {
    number: 'ДК-2025/113',
    subject: 'Обслуживание серверного оборудования',
    counterparty: 'ООО «Альфа Технологии»',
    status: 'approval',
  },
  {
    number: 'ДК-2025/112',
    subject: 'Аренда склада в Сергелийском районе',
    counterparty: 'ИП Каримов А.',
    status: 'signed',
  },
  {
    number: 'ДК-2025/109',
    subject: 'Лицензии на систему документооборота',
    counterparty: 'ООО «Софт Лайн»',
    status: 'expired',
  },
];

/** How many contracts, in Russian: 1 договор, 2 договора, 5 договоров. */
function count(value: number): string {
  const nouns = { one: 'договор', few: 'договора', many: 'договоров', other: 'договора' } as const;
  const form = new Intl.PluralRules('ru').select(value);
  return `${String(value)} ${form === 'zero' || form === 'two' ? nouns.many : nouns[form]}`;
}

/** The frame the stories draw a register in, as an application writes it. Styled with tokens only. */
@Component({
  selector: 'ave-list-page-stories',
  imports: [
    AveAlert,
    AveAppliedFilters,
    AveBadge,
    AveButton,
    AveCellTemplate,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveDataTable,
    AveEmptyState,
    AveEmptyStateActions,
    AveFilterPanel,
    AveFilterPanelContent,
    AveInput,
    AveListPage,
    AveListPageNotice,
    AveSearchHeader,
    AveSearchHeaderActions,
    AveSearchHeaderSearch,
  ],
  template: `
    <div class="frame" [attr.data-narrow]="view() === 'narrow' ? '' : null">
      <ave-list-page lang="ru">
        <ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">
          <div aveSearchHeaderActions>
            <button aveButton type="button">Выгрузить в Excel</button>
            <button aveButton type="button" variant="primary">Новый договор</button>
          </div>
          <input
            aveInput
            aveSearchHeaderSearch
            type="search"
            aria-label="Поиск договоров"
            placeholder="Номер, предмет или контрагент"
            [value]="query()"
          />
        </ave-search-header>
        @if (view() !== 'empty' && view() !== 'loading') {
          <ave-alert aveListPageNotice variant="warning" heading="Есть истёкшие договоры">
            Договор ДК-2025/109 истёк 31.08.2026. Продлите или закройте его.
          </ave-alert>
        }
        <ave-applied-filters [filters]="applied()" (remove)="remove($event)" (clear)="clear()" />
        <ave-filter-panel #filters [count]="applied().length" [(open)]="open" (clear)="clear()">
          <ng-template aveFilterPanelContent>
            <fieldset aveChoiceGroup legend="Статус">
              @for (status of list; track status) {
                <label aveChoice>
                  <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
                  {{ statuses[status] }}
                </label>
              }
            </fieldset>
          </ng-template>
        </ave-filter-panel>
        <ave-data-table
          label="Договоры подразделения"
          [rows]="rows()"
          [columns]="columns"
          [rowKey]="byNumber"
          [loading]="view() === 'loading'"
        >
          <ng-template aveCell="status" [aveCellOf]="rows()" let-contract>
            <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
          </ng-template>
          <ave-empty-state aveDataTableEmpty icon="search" heading="Ничего не найдено">
            <p>Ни один договор не подходит под поиск «Кадастр» и выбранные статусы.</p>
            <div aveEmptyStateActions>
              <button aveButton type="button">Сбросить поиск и фильтры</button>
            </div>
          </ave-empty-state>
        </ave-data-table>
      </ave-list-page>
    </div>
  `,
  providers: [provideAveIcons([lucideSearch])],
  styleUrl: './list-page.stories.css',
})
class ListPageStories implements OnInit {
  readonly view = input<View>('default');
  protected readonly statuses = statuses;
  protected readonly variants = variants;
  protected readonly list = Object.keys(statuses) as Status[];
  protected readonly shown = signal<ReadonlySet<Status>>(new Set(['approval', 'signed']));
  protected readonly open = signal(false);
  protected readonly query = computed(() => (this.view() === 'empty' ? 'Кадастр' : ''));
  protected readonly columns: readonly AveColumn<Contract>[] = [
    { key: 'number', header: 'Номер', value: (contract) => contract.number, rowHeader: true },
    { key: 'subject', header: 'Предмет', value: (contract) => contract.subject },
    { key: 'counterparty', header: 'Контрагент', value: (contract) => contract.counterparty },
    { key: 'status', header: 'Статус', value: (contract) => statuses[contract.status] },
  ];
  protected readonly byNumber = (contract: Contract) => contract.number;
  protected readonly rows = computed(() =>
    this.view() === 'empty' || this.view() === 'loading'
      ? []
      : contracts.filter((contract) => this.shown().has(contract.status)),
  );
  protected readonly summary = computed(() =>
    this.view() === 'loading' ? 'Загрузка договоров…' : count(this.rows().length),
  );
  protected readonly applied = computed<readonly AveAppliedFilter[]>(() =>
    this.shown().size === this.list.length
      ? []
      : this.list
          .filter((status) => this.shown().has(status))
          .map((status) => ({ key: status, label: `Статус: ${statuses[status]}` })),
  );

  ngOnInit(): void {
    this.open.set(this.view() === 'default');
  }

  protected toggle(status: Status): void {
    this.shown.update((shown) => {
      const next = new Set(shown);
      if (!next.delete(status)) next.add(status);
      return next;
    });
  }

  protected remove(key: string): void {
    this.shown.update((shown) => new Set([...shown].filter((status) => status !== key)));
  }

  protected clear(): void {
    this.shown.set(new Set(this.list));
  }
}

type Story = StoryObj<ListPageStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-list-page-stories [view]="view" />`,
    moduleMetadata: { imports: [ListPageStories] },
  });
}

/** Whether the story's page is narrower than container.lg, where the filters open in a drawer. */
function drawer(canvasElement: HTMLElement): boolean {
  return canvasElement.querySelector('ave-filter-panel')?.getAttribute('data-mode') === 'drawer';
}

/** Waits until an open drawer has played its entry, so a baseline shows it at rest. */
async function settled(): Promise<void> {
  const dialog = await within(document.body).findByRole('dialog');
  await waitFor(() => expect(dialog.getAnimations({ subtree: true })).toHaveLength(0));
}

const meta: Meta<ListPageStories> = {
  title: 'Patterns/List page',
  component: AveListPage,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** The register: the header, a notice, the applied filters, the filters' column open beside the table. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<!-- filtersOpen starts true: the filters' column shows beside the table. -->
<ave-list-page>
  <ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">
    <div aveSearchHeaderActions>
      <button aveButton type="button">Выгрузить в Excel</button>
      <button aveButton type="button" variant="primary">Новый договор</button>
    </div>
    <input
      aveInput
      aveSearchHeaderSearch
      type="search"
      aria-label="Поиск договоров"
      placeholder="Номер, предмет или контрагент"
    />
  </ave-search-header>
  <ave-alert aveListPageNotice variant="warning" heading="Есть истёкшие договоры">
    Договор ДК-2025/109 истёк 31.08.2026. Продлите или закройте его.
  </ave-alert>
  <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
  <ave-filter-panel #filters [count]="applied().length" [(open)]="filtersOpen" (clear)="clearFilters()">
    <ng-template aveFilterPanelContent>
      <fieldset aveChoiceGroup legend="Статус">
        @for (status of statusList; track status) {
          <label aveChoice>
            <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
            {{ statuses[status] }}
          </label>
        }
      </fieldset>
    </ng-template>
  </ave-filter-panel>
  <ave-data-table label="Договоры подразделения" [rows]="rows()" [columns]="columns" [rowKey]="byNumber">
    <ng-template aveCell="status" [aveCellOf]="rows()" let-contract>
      <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
    </ng-template>
  </ave-data-table>
</ave-list-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Договоры' })).toBeVisible();
    await expect(canvas.getByRole('table', { name: 'Договоры подразделения' })).toBeVisible();
    if (drawer(canvasElement)) {
      await settled();
      return;
    }
    const column = canvas.getByRole('region', { name: 'Фильтры' });
    const table = canvasElement.querySelector('ave-data-table');
    await expect((table?.getBoundingClientRect().left ?? 0) - column.getBoundingClientRect().right).toBe(24);
  },
};

/** The filters closed, as the register opens: the table takes the page's width. */
export const Collapsed: Story = {
  render: frame('collapsed'),
  parameters: {
    docs: {
      source: {
        code: `<!-- filtersOpen starts false: the table takes the page's width. -->
<ave-list-page>
  <ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">
    <div aveSearchHeaderActions>
      <button aveButton type="button">Выгрузить в Excel</button>
      <button aveButton type="button" variant="primary">Новый договор</button>
    </div>
    <input
      aveInput
      aveSearchHeaderSearch
      type="search"
      aria-label="Поиск договоров"
      placeholder="Номер, предмет или контрагент"
    />
  </ave-search-header>
  <ave-alert aveListPageNotice variant="warning" heading="Есть истёкшие договоры">
    Договор ДК-2025/109 истёк 31.08.2026. Продлите или закройте его.
  </ave-alert>
  <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
  <ave-filter-panel #filters [count]="applied().length" [(open)]="filtersOpen" (clear)="clearFilters()">
    <ng-template aveFilterPanelContent>
      <fieldset aveChoiceGroup legend="Статус">
        @for (status of statusList; track status) {
          <label aveChoice>
            <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
            {{ statuses[status] }}
          </label>
        }
      </fieldset>
    </ng-template>
  </ave-filter-panel>
  <ave-data-table label="Договоры подразделения" [rows]="rows()" [columns]="columns" [rowKey]="byNumber">
    <ng-template aveCell="status" [aveCellOf]="rows()" let-contract>
      <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
    </ng-template>
  </ave-data-table>
</ave-list-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('ave-data-table');
    const page = canvasElement.querySelector('ave-list-page');
    await expect(table?.getBoundingClientRect().width).toBe(page?.getBoundingClientRect().width);
    if (drawer(canvasElement)) return;
    const button = within(canvasElement).getByRole('button', { name: 'Фильтры 2' });
    await userEvent.click(button);
    await expect(within(canvasElement).getByRole('region', { name: 'Фильтры' })).toBeVisible();
    await userEvent.click(button);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A page narrower than container.lg: the filters open in a drawer from the start, over the table. */
export const Narrow: Story = {
  render: frame('narrow'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Below container.lg the filters open in a drawer; filtersOpen starts false. -->
<ave-list-page>
  <ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">
    <div aveSearchHeaderActions>
      <button aveButton type="button">Выгрузить в Excel</button>
      <button aveButton type="button" variant="primary">Новый договор</button>
    </div>
    <input
      aveInput
      aveSearchHeaderSearch
      type="search"
      aria-label="Поиск договоров"
      placeholder="Номер, предмет или контрагент"
    />
  </ave-search-header>
  <ave-alert aveListPageNotice variant="warning" heading="Есть истёкшие договоры">
    Договор ДК-2025/109 истёк 31.08.2026. Продлите или закройте его.
  </ave-alert>
  <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
  <ave-filter-panel #filters [count]="applied().length" [(open)]="filtersOpen" (clear)="clearFilters()">
    <ng-template aveFilterPanelContent>
      <fieldset aveChoiceGroup legend="Статус">
        @for (status of statusList; track status) {
          <label aveChoice>
            <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
            {{ statuses[status] }}
          </label>
        }
      </fieldset>
    </ng-template>
  </ave-filter-panel>
  <ave-data-table label="Договоры подразделения" [rows]="rows()" [columns]="columns" [rowKey]="byNumber">
    <ng-template aveCell="status" [aveCellOf]="rows()" let-contract>
      <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
    </ng-template>
  </ave-data-table>
</ave-list-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Фильтры 2' });
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    // From the keyboard, as a baseline should show it: a scripted click would draw the button's focus ring.
    button.focus();
    await userEvent.keyboard('{Enter}');
    await settled();
    await expect(within(document.body).getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  },
};

/** Nothing matches the search: the table's empty state says why and offers the way back. */
export const Empty: Story = {
  name: 'No results',
  render: frame('empty'),
  parameters: {
    docs: {
      source: {
        code: `<ave-list-page>
  <ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">
    <div aveSearchHeaderActions>
      <button aveButton type="button">Выгрузить в Excel</button>
      <button aveButton type="button" variant="primary">Новый договор</button>
    </div>
    <input
      aveInput
      aveSearchHeaderSearch
      type="search"
      aria-label="Поиск договоров"
      placeholder="Номер, предмет или контрагент"
      value="Кадастр"
    />
  </ave-search-header>
  <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
  <ave-filter-panel #filters [count]="applied().length" [(open)]="filtersOpen" (clear)="clearFilters()">
    <ng-template aveFilterPanelContent>
      <fieldset aveChoiceGroup legend="Статус">
        @for (status of statusList; track status) {
          <label aveChoice>
            <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
            {{ statuses[status] }}
          </label>
        }
      </fieldset>
    </ng-template>
  </ave-filter-panel>
  <ave-data-table label="Договоры подразделения" [rows]="rows()" [columns]="columns" [rowKey]="byNumber">
    <ave-empty-state aveDataTableEmpty icon="search" heading="Ничего не найдено">
      <p>Ни один договор не подходит под поиск «Кадастр» и выбранные статусы.</p>
      <div aveEmptyStateActions>
        <button aveButton type="button">Сбросить поиск и фильтры</button>
      </div>
    </ave-empty-state>
  </ave-data-table>
</ave-list-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Ничего не найдено')).toBeVisible();
    await expect(canvasElement.querySelector('ave-search-header [role="status"]')).toHaveTextContent('0 договоров');
  },
};

/** The register on its way: the count says so, and the table holds skeleton rows. */
export const Loading: Story = {
  render: frame('loading'),
  parameters: {
    docs: {
      source: {
        code: `<ave-list-page>
  <ave-search-header heading="Договоры" summary="Загрузка договоров…" [filters]="filters">
    <div aveSearchHeaderActions>
      <button aveButton type="button">Выгрузить в Excel</button>
      <button aveButton type="button" variant="primary">Новый договор</button>
    </div>
    <input
      aveInput
      aveSearchHeaderSearch
      type="search"
      aria-label="Поиск договоров"
      placeholder="Номер, предмет или контрагент"
    />
  </ave-search-header>
  <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
  <ave-filter-panel #filters [count]="applied().length" [(open)]="filtersOpen" (clear)="clearFilters()">
    <ng-template aveFilterPanelContent>
      <fieldset aveChoiceGroup legend="Статус">
        @for (status of statusList; track status) {
          <label aveChoice>
            <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
            {{ statuses[status] }}
          </label>
        }
      </fieldset>
    </ng-template>
  </ave-filter-panel>
  <ave-data-table label="Договоры подразделения" [rows]="rows()" [columns]="columns" [rowKey]="byNumber" [loading]="true" />
</ave-list-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('ave-search-header [role="status"]')).toHaveTextContent(
      'Загрузка договоров…',
    );
  },
};
