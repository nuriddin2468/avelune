import { Component, LOCALE_ID, computed, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideCopy, lucideEllipsis, lucideFileText, lucideSearch, lucideTrash } from '@avelune/icons/lucide';
import { AveBadge, type AveBadgeVariant } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveCellTemplate, AveDataTable, type AveColumn, type AveSort } from '@avelune/ui/data-table';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { aveDateFormat } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveLink } from '@avelune/ui/link';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';

type View = 'default' | 'loading' | 'failed' | 'empty' | 'server' | 'sticky' | 'long' | 'compact';

type Status = 'draft' | 'approval' | 'signed' | 'expired';

interface Contract {
  readonly id: number;
  readonly number: string;
  readonly subject: string;
  readonly counterparty: string;
  readonly amount: number;
  readonly status: Status;
  readonly endsOn: string;
}

const statuses: Readonly<Record<Status, { readonly label: string; readonly variant: AveBadgeVariant }>> = {
  draft: { label: 'Черновик', variant: 'neutral' },
  approval: { label: 'На согласовании', variant: 'info' },
  signed: { label: 'Подписан', variant: 'success' },
  expired: { label: 'Истёк', variant: 'danger' },
};

const subjects = [
  ['Поставка офисной мебели', 'ООО «Мебель Сервис»'],
  ['Аренда складского помещения', 'АО «Узбекнефтегаз»'],
  ['Техническое обслуживание лифтов', 'ООО «Бета Логистик»'],
  ['Услуги связи и интернета', 'АО «Узбекистон почтаси»'],
  ['Разработка информационной системы', 'ООО «Альфа Технологии»'],
  ['Охрана административного здания', 'ГУП «Центр электронного документооборота»'],
] as const;

const order: readonly Status[] = ['signed', 'approval', 'draft', 'signed', 'expired', 'signed'];

/** A register of 134 contracts, ДК-2026/134 down to ДК-2026/1: made up in turn from a few subjects. */
const register: readonly Contract[] = Array.from({ length: 134 }, (_, index) => {
  const [subject, counterparty] = subjects[index % subjects.length] ?? subjects[0];
  const number = 134 - index;
  return {
    id: number,
    number: `ДК-2026/${String(number)}`,
    subject,
    counterparty,
    amount: (((number * 7919) % 90) + 10) * 125_000,
    status: order[index % order.length] ?? 'draft',
    endsOn: `2027-${String((number % 12) + 1).padStart(2, '0')}-${String((number % 27) + 1).padStart(2, '0')}`,
  };
});

/** The frame the stories draw tables in: a department's register of contracts. Styled with tokens only. */
@Component({
  selector: 'ave-data-table-stories',
  imports: [AveBadge, AveButton, AveCellTemplate, AveDataTable, AveEmptyState, AveEmptyStateActions, AveLink, AveMenu],
  template: `
    <div class="frame" [attr.data-view]="view()" [attr.data-density]="view() === 'compact' ? 'compact' : null">
      <ave-data-table
        [label]="view() === 'long' ? 'Shartnomalar' : 'Договоры'"
        [attr.lang]="view() === 'long' ? 'uz-Latn' : 'ru'"
        [rows]="rows()"
        [columns]="columns"
        [rowKey]="byId"
        [source]="view() === 'server' ? 'server' : 'local'"
        [total]="view() === 'server' ? register.length : undefined"
        [selectable]="view() !== 'long'"
        [resizable]="view() === 'sticky'"
        [loading]="loading()"
        [failed]="failed()"
        [(sort)]="sort"
        [(selected)]="selected"
        [(page)]="page"
        [(pageSize)]="pageSize"
        (retry)="load()"
      >
        <ng-template aveCell="subject" [aveCellOf]="rows()" let-contract>
          <a aveLink href="#contract">{{ contract.subject }}</a>
        </ng-template>
        <ng-template aveCell="status" [aveCellOf]="rows()" let-contract>
          <ave-badge [variant]="statuses[contract.status].variant">{{ statuses[contract.status].label }}</ave-badge>
        </ng-template>
        <ng-template aveCell="endsOn" [aveCellOf]="rows()" let-contract>
          <time [attr.datetime]="contract.endsOn">{{ dates.numeric(contract.endsOn) }}</time>
        </ng-template>
        <ng-template aveCell="actions" [aveCellOf]="rows()" let-contract>
          <ave-menu
            icon="ellipsis"
            variant="ghost"
            size="sm"
            [label]="'Действия с договором ' + contract.number"
            [items]="actions"
          />
        </ng-template>
        @if (view() === 'empty') {
          <ave-empty-state aveDataTableEmpty icon="search" heading="Ничего не найдено">
            <p>Ни один договор не подходит под поиск и выбранные статусы.</p>
            <div aveEmptyStateActions>
              <button aveButton type="button">Сбросить поиск и фильтры</button>
            </div>
          </ave-empty-state>
        }
      </ave-data-table>
    </div>
  `,
  styleUrl: './data-table.stories.css',
})
class DataTableStories {
  readonly view = input<View>('default');
  protected readonly register = register;
  protected readonly statuses = statuses;
  protected readonly dates = aveDateFormat('ru');
  protected readonly columns: readonly AveColumn<Contract>[] = [
    { key: 'number', header: 'Номер', value: (row) => row.number, sortable: true, rowHeader: true },
    { key: 'subject', header: 'Предмет', value: (row) => row.subject, sortable: true },
    { key: 'counterparty', header: 'Контрагент', value: (row) => row.counterparty, sortable: true },
    { key: 'amount', header: 'Сумма, сум', value: (row) => row.amount, sortable: true, numeric: true },
    { key: 'status', header: 'Статус', value: (row) => statuses[row.status].label },
    { key: 'endsOn', header: 'Действует до', value: (row) => row.endsOn, sortable: true },
    { key: 'actions', header: 'Действия', hideHeader: true },
  ];
  protected readonly actions: readonly AveMenuEntry<string>[] = [
    { value: 'open', label: 'Открыть', icon: 'file-text' },
    { value: 'copy', label: 'Дублировать', icon: 'copy' },
    { separator: true },
    { value: 'delete', label: 'Удалить договор', icon: 'trash', danger: true },
  ];
  protected readonly sort = signal<AveSort | null>(null);
  protected readonly selected = signal<readonly number[]>([]);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly failedOnce = signal(true);
  protected readonly reloading = signal(false);
  protected readonly byId = (row: Contract) => row.id;

  protected readonly loading = computed(() => this.view() === 'loading' || this.reloading());
  protected readonly failed = computed(() => this.view() === 'failed' && this.failedOnce());

  /** The rows each view shows; the server's view is the page the pretend server sends. */
  protected readonly rows = computed<readonly Contract[]>(() => {
    const view = this.view();
    if (view === 'loading' || view === 'empty') return [];
    if (view === 'failed') return this.failedOnce() ? [] : register.slice(0, 12);
    if (view === 'server') {
      const size = this.pageSize();
      return register.slice((this.page() - 1) * size, this.page() * size);
    }
    if (view === 'long') {
      return [
        {
          id: 1,
          number: 'SH-2026/134',
          subject:
            'Oʻzbekiston Respublikasi Moliya vazirligi huzuridagi Davlat moliyaviy nazorati departamenti uchun axborot tizimini ishlab chiqish',
          counterparty: 'Samarqand viloyati sogʻliqni saqlash boshqarmasi',
          amount: 1_987_654_321,
          status: 'approval',
          endsOn: '2027-12-31',
        },
      ];
    }
    return register.slice(0, view === 'sticky' ? 30 : 12);
  });

  /** The Retry button: the pretend server sends the rows this time. */
  protected load(): void {
    this.failedOnce.set(false);
    this.reloading.set(true);
    setTimeout(() => {
      this.reloading.set(false);
    }, 400);
  }
}

type Story = StoryObj<DataTableStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-data-table-stories [view]="view" />`,
    moduleMetadata: { imports: [DataTableStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<DataTableStories> = {
  title: 'Components/DataTable',
  component: DataTableStories,
  decorators: [
    applicationConfig({
      providers: [
        { provide: LOCALE_ID, useValue: 'ru' },
        provideAveIcons([lucideCopy, lucideEllipsis, lucideFileText, lucideSearch, lucideTrash]),
      ],
    }),
  ],
};
export default meta;

/** A register: sortable headers, chosen rows on the neutral fill, figures at the end, a menu in every row. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-data-table label="Договоры" [rows]="contracts" [columns]="columns" [rowKey]="byId"',
    '  selectable [(selected)]="chosen" [(sort)]="sort">',
    '  <ng-template aveCell="subject" [aveCellOf]="contracts" let-contract>',
    '    <a aveLink [routerLink]="[\'/contracts\', contract.id]">{{ contract.subject }}</a>',
    '  </ng-template>',
    '  <ng-template aveCell="status" [aveCellOf]="contracts" let-contract>',
    '    <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>',
    '  </ng-template>',
    '</ave-data-table>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: 'Договоры' });
    await expect(within(table).getAllByRole('row')).toHaveLength(11);
    await expect(within(table).getByRole('rowheader', { name: 'ДК-2026/134' })).toBeVisible();
    // Sorting: a header's button, then the order turned over; aria-sort on that header only.
    const amount = canvas.getByRole('button', { name: 'Сумма, сум' });
    await userEvent.click(amount);
    await expect(canvas.getByRole('columnheader', { name: 'Сумма, сум' })).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(amount);
    await expect(canvas.getByRole('columnheader', { name: 'Сумма, сум' })).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(canvas.getByRole('button', { name: 'Номер' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Номер' }));
    await expect(within(table).getAllByRole('rowheader')[0]).toHaveTextContent('ДК-2026/134');
    // Choosing: a row's checkbox is named for its row; the header's is mixed while some rows are chosen.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Выбрать ДК-2026/133' }));
    const page = canvas.getByRole('checkbox', { name: 'Выбрать строки страницы' });
    await expect((page as HTMLInputElement).indeterminate).toBe(true);
    await expect(canvas.getByRole('navigation', { name: 'Договоры: страницы' })).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** The first rows on their way: skeleton rows under the header, and the table busy. */
export const Loading: Story = {
  render: frame('loading'),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('table')).toHaveAttribute('aria-busy', 'true');
    await expect(canvasElement.querySelectorAll('tbody tr[data-placeholder]')).toHaveLength(5);
  },
};

/** The rows did not come: an alert with Retry stands in their place; pressed, the rows load. */
export const Failed: Story = {
  render: frame('failed'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent('Записи не загрузились.');
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

/** Retry pressed: skeleton rows, then the rows. */
export const Retried: Story = {
  render: frame('failed'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(canvas.getAllByRole('rowheader')).toHaveLength(10));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Nothing matches: the application's empty state, with its action, under the header. */
export const Empty: Story = {
  render: frame('empty'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Ничего не найдено')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Сбросить поиск и фильтры' })).toBeVisible();
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(8);
  },
};

/** The server's pages: the table shows the page it sent and pages by its total, 134 contracts. */
export const ServerPages: Story = {
  name: 'Server pages',
  render: frame('server'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('1–10 из 134');
    await userEvent.click(canvas.getByRole('button', { name: 'Страница 2' }));
    await expect(canvas.getAllByRole('rowheader')[0]).toHaveTextContent('ДК-2026/124');
    await expect(canvas.getByRole('status')).toHaveTextContent('11–20 из 134');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A table in a box of its own height: the header sticks as the rows scroll; the columns' edges set their widths. */
export const StickyAndResizable: Story = {
  name: 'Sticky header and resizing',
  render: frame('sticky'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('combobox', { name: 'На странице' }));
    await userEvent.click(await within(document.body).findByRole('option', { name: '50' }));
    const box = await canvas.findByRole('region', { name: 'Договоры' });
    await expect(box).toHaveAttribute('tabindex', '0');
    box.scrollTo({ top: 240 });
    const header = canvas.getAllByRole('columnheader')[0];
    await waitFor(() =>
      expect(Math.round(header?.getBoundingClientRect().top ?? 0)).toBe(
        Math.round(box.getBoundingClientRect().top + 1),
      ),
    );
    // A column's range, as it takes focus, says the width drawn; moved, it sets the width.
    const range = canvas.getByRole('slider', { name: 'Ширина столбца «Предмет»' });
    const cell = range.closest('th');
    const before = cell?.getBoundingClientRect().width ?? 0;
    range.focus();
    await expect(Math.abs(Number((range as HTMLInputElement).value) - before)).toBeLessThanOrEqual(4);
    (range as HTMLInputElement).value = String(Math.round(before) + 48);
    range.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(cell?.getBoundingClientRect().width).toBeGreaterThan(before));
    box.scrollTo({ top: 0 });
    range.blur();
  },
};

/** Long Uzbek words wrap in their cells; a narrow table scrolls sideways in its box, a named region. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const box = await within(canvasElement).findByRole('region', { name: 'Shartnomalar' });
    await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
    await expect(canvasElement.querySelector('.frame')?.scrollWidth).toBe(
      canvasElement.querySelector('.frame')?.clientWidth,
    );
  },
};

/** Compact density: rows and controls one step down. */
export const Compact: Story = {
  render: frame('compact'),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('tbody tr');
    await expect(row?.getBoundingClientRect().height).toBe(36);
  },
};
