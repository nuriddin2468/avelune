import { Component, LOCALE_ID, signal, viewChildren } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import {
  AveCellTemplate,
  AveDataTable,
  type AveColumn,
  type AveDataTableSource,
  type AveSort,
} from '@avelune/ui/data-table';
import { AveDataTableHarness } from '@avelune/ui/data-table/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

interface Contract {
  readonly id: number;
  readonly number: string;
  readonly subject: string;
  readonly amount: number | null;
  readonly endsOn: string;
}

const few: readonly Contract[] = [
  { id: 1, number: 'ДК-2', subject: 'Поставка мебели', amount: 1_250_000, endsOn: '2026-12-31' },
  { id: 2, number: 'ДК-10', subject: 'Аренда склада', amount: null, endsOn: '2026-10-01' },
  { id: 3, number: 'ДК-1', subject: 'Услуги связи', amount: 480_000, endsOn: '2027-03-15' },
  { id: 4, number: 'ДК-3', subject: 'Аренда офиса', amount: 480_000, endsOn: '2027-01-20' },
];

/** 25 contracts, ДК-1 to ДК-25, for the pages. */
const many: readonly Contract[] = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  number: `ДК-${String(index + 1)}`,
  subject: `Договор ${String(index + 1)}`,
  amount: (index + 1) * 1000,
  endsOn: '2026-12-31',
}));

const columns: readonly AveColumn<Contract>[] = [
  { key: 'number', header: 'Номер', value: (row) => row.number, sortable: true, rowHeader: true },
  { key: 'subject', header: 'Предмет', value: (row) => row.subject, sortable: true },
  { key: 'amount', header: 'Сумма', value: (row) => row.amount, sortable: true, numeric: true },
  { key: 'endsOn', header: 'Действует до' },
  { key: 'actions', header: 'Действия', hideHeader: true },
];

@Component({
  selector: 'ave-data-table-host',
  imports: [AveCellTemplate, AveDataTable],
  template: `
    <div class="frame" [attr.dir]="dir()">
      <ave-data-table
        label="Договоры"
        [rows]="rows()"
        [columns]="columns()"
        [rowKey]="byId"
        [source]="source()"
        [total]="total()"
        [selectable]="selectable()"
        [resizable]="resizable()"
        [loading]="loading()"
        [failed]="failed()"
        [pageSizes]="[10, 20]"
        [(sort)]="sort"
        [(selected)]="selected"
        [(page)]="page"
        [(pageSize)]="pageSize"
        [(widths)]="widths"
        (retry)="retries.set(retries() + 1)"
      >
        <ng-template aveCell="endsOn" [aveCellOf]="rows()" let-contract>
          <time [attr.datetime]="contract.endsOn">{{ contract.endsOn }}</time>
        </ng-template>
        <ng-template aveCell="actions" [aveCellOf]="rows()" let-contract>
          <button type="button">Открыть {{ contract.number }}</button>
        </ng-template>
      </ave-data-table>
    </div>
  `,
})
class TableHost {
  readonly rows = signal<readonly Contract[]>(few);
  readonly columns = signal(columns);
  readonly source = signal<AveDataTableSource>('local');
  readonly total = signal<number | undefined>(undefined);
  readonly selectable = signal(false);
  readonly resizable = signal(false);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly sort = signal<AveSort | null>(null);
  readonly selected = signal<readonly number[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly widths = signal<Readonly<Record<string, number>>>({});
  readonly retries = signal(0);
  readonly byId = (row: Contract) => row.id;
  readonly cells = viewChildren<AveCellTemplate<Contract>>(AveCellTemplate);
}

@Component({
  selector: 'ave-data-table-empty',
  imports: [AveDataTable],
  template: `
    <ave-data-table label="Акты" [rows]="[]" [columns]="columns" [rowKey]="byId">
      <p aveDataTableEmpty>Ни один акт не подходит под поиск.</p>
    </ave-data-table>
  `,
})
class OwnEmptyHost {
  readonly columns = columns;
  readonly byId = (row: Contract) => row.id;
}

const used = [
  'space.1',
  'space.2',
  'space.3',
  'space.4',
  'border-width.default',
  'radius.sm',
  'radius.md',
  'radius.lg',
  'control.height.md',
  'control.height.lg',
  'control.padding-inline.md',
  'size.icon.sm',
  'size.target.min',
  'z-index.sticky',
  'font.body-md',
  'font.label-md',
  'color.bg.surface',
  'color.bg.active',
  'color.bg.hover',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.subtle',
  'color.border.subtle',
  'color.border.default',
  'color.border.strong',
  'color.accent.bg',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030), in the reset layer under the components; a page's width.
reset.textContent =
  '@layer reset, components; @layer reset { *, ::before, ::after { box-sizing: border-box; } } .frame { inline-size: 900px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-duration-instant', '0ms');
  document.head.append(reset);
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-duration-instant');
  reset.remove();
});

async function mount<T = TableHost>(
  type: new () => T = TableHost as unknown as new () => T,
): Promise<{ fixture: ComponentFixture<T>; element: HTMLElement; table: AveDataTableHarness }> {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const table = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDataTableHarness);
  return { fixture, element, table };
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
}

/** Two frames: a ResizeObserver has reported, and the table drawn what it said. */
async function frames(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  await settle(fixture);
}

/** A width as the range can say it: its minimum, 48, and steps of 8. */
function stepped(width: number): number {
  return 48 + Math.round((width - 48) / 8) * 8;
}

function colour(name: TokenName): string {
  const probe = document.createElement('span');
  probe.style.color = tokens[name].css;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

describe('AveDataTable', () => {
  it('is a native table named by its caption, its cells drawn from the columns and the templates', async () => {
    const { element, table } = await mount();
    expect(await table.getLabel()).toBe('Договоры');
    expect(element.querySelector('table')?.getAttribute('role')).toBeNull();
    expect(await table.getHeaders()).toEqual(['Номер', 'Предмет', 'Сумма', 'Действует до', 'Действия']);
    const headers = [...element.querySelectorAll('thead th')];
    expect(headers.every((header) => header.getAttribute('scope') === 'col')).toBe(true);
    // The row's title is its header; numbers are written for the locale; an empty value leaves the cell empty.
    const rows = await table.getRows();
    expect(rows[0]?.map((cell) => cell.replace(/\s/g, ' '))).toEqual([
      'ДК-2',
      'Поставка мебели',
      '1 250 000',
      '2026-12-31',
      'Открыть ДК-2',
    ]);
    expect(rows[1]?.[2]).toBe('');
    const title = element.querySelector('tbody tr > th');
    expect(title?.getAttribute('scope')).toBe('row');
    expect(title?.textContent.trim()).toBe('ДК-2');
    expect(element.querySelector('tbody time')?.getAttribute('datetime')).toBe('2026-12-31');
    // A hidden header is said, not shown; figures are tabular and at the end.
    const hidden = element.querySelector('thead th[data-column="actions"] > span');
    expect(hidden?.classList.contains('cdk-visually-hidden')).toBe(true);
    const amount = element.querySelector('tbody td[data-numeric]');
    expect(getComputedStyle(amount ?? element).textAlign).toBe('end');
    expect(getComputedStyle(amount ?? element).fontVariantNumeric).toBe('tabular-nums');
    expect(await table.getRowTitles()).toEqual(['ДК-2', 'ДК-10', 'ДК-1', 'ДК-3']);
    element.remove();
  });

  it('sorts with a header button: ascending first, then turned over, back to the first page (APG)', async () => {
    const { fixture, element, table } = await mount();
    const host = fixture.componentInstance;
    expect(await table.getSort()).toBeNull();
    expect(element.querySelectorAll('[aria-sort]')).toHaveLength(0);
    // Only sortable columns have a button; the arrow says both ways until the column sorts.
    expect(element.querySelectorAll('thead .sort')).toHaveLength(3);
    const arrow = () => element.querySelector('th[data-column="number"] ave-icon')?.getAttribute('data-icon');
    expect(arrow()).toBe('arrow-up-down');
    await table.sortBy('Номер');
    expect(host.sort()).toEqual({ column: 'number', direction: 'ascending' });
    expect(await table.getSort()).toEqual({ header: 'Номер', direction: 'ascending' });
    expect(element.querySelectorAll('[aria-sort]')).toHaveLength(1);
    expect(arrow()).toBe('arrow-up');
    // Text by the locale's collation, with the numbers inside it in order.
    expect(await table.getRowTitles()).toEqual(['ДК-1', 'ДК-2', 'ДК-3', 'ДК-10']);
    await table.sortBy('Номер');
    expect(await table.getRowTitles()).toEqual(['ДК-10', 'ДК-3', 'ДК-2', 'ДК-1']);
    expect(await table.getSort()).toEqual({ header: 'Номер', direction: 'descending' });
    expect(arrow()).toBe('arrow-down');
    // Numbers as numbers, equal rows in their own order, an empty value last in both orders.
    await table.sortBy('Сумма');
    expect(await table.getRowTitles()).toEqual(['ДК-1', 'ДК-3', 'ДК-2', 'ДК-10']);
    await table.sortBy('Сумма');
    expect(await table.getRowTitles()).toEqual(['ДК-2', 'ДК-1', 'ДК-3', 'ДК-10']);
    await expect(table.sortBy('Действует до')).rejects.toThrow('no column sorts by Действует до');
    // A new order goes back to the first page.
    host.rows.set(many);
    host.page.set(2);
    await settle(fixture);
    await table.sortBy('Предмет');
    expect(host.page()).toBe(1);
    // A sort by a column that no longer sorts leaves the rows in their order.
    host.sort.set({ column: 'endsOn', direction: 'ascending' });
    await settle(fixture);
    expect((await table.getRowTitles()).slice(0, 2)).toEqual(['ДК-1', 'ДК-2']);
    element.remove();
  });

  it('leaves the server’s rows in their order and pages by its total', async () => {
    const { fixture, element, table } = await mount();
    const host = fixture.componentInstance;
    host.source.set('server');
    host.total.set(134);
    await settle(fixture);
    await table.sortBy('Номер');
    expect(host.sort()).toEqual({ column: 'number', direction: 'ascending' });
    expect(await table.getRowTitles()).toEqual(['ДК-2', 'ДК-10', 'ДК-1', 'ДК-3']);
    const pagination = await table.getPagination();
    expect(await pagination?.getRange()).toBe('1–10 из 134');
    await pagination?.goToPage(3);
    expect(host.page()).toBe(3);
    expect(await table.getRowTitles()).toEqual(['ДК-2', 'ДК-10', 'ДК-1', 'ДК-3']);
    // Without a total, the rows count themselves.
    host.total.set(undefined);
    await settle(fixture);
    expect(await pagination?.getRange()).toBe('1–4 из 4');
    element.remove();
  });

  it('pages the local rows under a pagination named for the table, with its page sizes', async () => {
    const { fixture, element, table } = await mount();
    const host = fixture.componentInstance;
    host.rows.set(many);
    await settle(fixture);
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Договоры: страницы');
    const pagination = await table.getPagination();
    expect(await pagination?.getRange()).toBe('1–10 из 25');
    expect(await table.getRowTitles()).toHaveLength(10);
    await pagination?.goToPage(3);
    expect(await table.getRowTitles()).toEqual(['ДК-21', 'ДК-22', 'ДК-23', 'ДК-24', 'ДК-25']);
    await pagination?.setPageSize(20);
    expect(host.pageSize()).toBe(20);
    expect(host.page()).toBe(2);
    expect(await table.getRowTitles()).toHaveLength(5);
    // A page beyond the last shows the last.
    host.page.set(9);
    await settle(fixture);
    expect((await table.getRowTitles())[0]).toBe('ДК-21');
    element.remove();
  });

  it('chooses rows with checkboxes named by their titles, and the page with the header’s', async () => {
    const { fixture, element, table } = await mount();
    const host = fixture.componentInstance;
    host.selectable.set(true);
    host.rows.set(many);
    await settle(fixture);
    const check = element.querySelector('tbody .check > input');
    const names = (check?.getAttribute('aria-labelledby') ?? '').split(' ').map((id) => document.getElementById(id));
    expect(names.map((name) => name?.textContent.trim())).toEqual(['Выбрать', 'ДК-1']);
    expect(element.querySelector('thead .check > input')?.getAttribute('aria-label')).toBe('Выбрать строки страницы');
    expect(await table.getPageSelection()).toBe('none');
    await table.toggleRow('ДК-2');
    expect(host.selected()).toEqual([2]);
    expect(await table.getSelectedRows()).toEqual(['ДК-2']);
    expect(await table.getPageSelection()).toBe('some');
    // The chosen row takes the neutral fill.
    const chosen = element.querySelector('tr[data-selected] > td');
    expect(getComputedStyle(chosen ?? element).backgroundColor).toBe(colour('color.bg.active'));
    await table.togglePage();
    expect(await table.getPageSelection()).toBe('all');
    expect(host.selected()).toHaveLength(10);
    // The choice stays across pages; the header's checkbox speaks for the page shown.
    await (await table.getPagination())?.next();
    expect(await table.getPageSelection()).toBe('none');
    await table.toggleRow('ДК-11');
    await (await table.getPagination())?.previous();
    await table.togglePage();
    expect(host.selected()).toEqual([11]);
    await table.toggleRow('ДК-1');
    await table.toggleRow('ДК-1');
    expect(host.selected()).toEqual([11]);
    await expect(table.toggleRow('ДК-99')).rejects.toThrow('no row ДК-99');
    element.remove();
  });

  it('shows skeleton rows while loading, and an alert with Retry in their place when they did not come', async () => {
    const { fixture, element, table } = await mount();
    const host = fixture.componentInstance;
    host.selectable.set(true);
    host.loading.set(true);
    await settle(fixture);
    expect(await table.isLoading()).toBe(true);
    // As many skeleton rows as the rows shown, each cell a skeleton; the header's checkbox waits.
    expect(element.querySelectorAll('tbody tr[data-placeholder]')).toHaveLength(4);
    expect(element.querySelectorAll('tbody tr[data-placeholder] ave-skeleton')).toHaveLength(20);
    expect(element.querySelector<HTMLInputElement>('thead .check > input')?.disabled).toBe(true);
    expect(await table.getRows()).toEqual([]);
    host.rows.set([]);
    await settle(fixture);
    expect(element.querySelectorAll('tbody tr[data-placeholder]')).toHaveLength(5);
    host.loading.set(false);
    host.failed.set(true);
    await settle(fixture);
    expect(await table.isLoading()).toBe(false);
    expect(await table.isFailed()).toBe(true);
    expect(await table.getStateText()).toContain('Записи не загрузились.');
    expect(element.querySelector('.state > td')?.getAttribute('colspan')).toBe('6');
    expect(await table.getPagination()).toBeNull();
    await table.retry();
    expect(host.retries()).toBe(1);
    host.failed.set(false);
    await settle(fixture);
    await expect(table.retry()).rejects.toThrow('has not failed');
    element.remove();
  });

  it('keeps its header over an empty state: the kit’s, or the application’s', async () => {
    const { fixture, element, table } = await mount();
    fixture.componentInstance.rows.set([]);
    await settle(fixture);
    expect(await table.getHeaders()).toHaveLength(5);
    expect(await table.getStateText()).toBe('Записей нет');
    expect(element.querySelector('.state ave-empty-state')).not.toBeNull();
    expect(await table.getPagination()).not.toBeNull();
    expect(element.querySelector('nav')).toBeNull();
    element.remove();
    const own = await mount(OwnEmptyHost);
    expect(await own.table.getStateText()).toBe('Ни один акт не подходит под поиск.');
    expect(own.element.querySelector('.state ave-empty-state')).toBeNull();
    own.element.remove();
  });

  it('draws rows of the large control height between lines, under a header on a stronger line', async () => {
    const { element } = await mount();
    const rows = [...element.querySelectorAll('tbody tr')];
    expect(rows.map((row) => row.getBoundingClientRect().height)).toEqual([40, 40, 40, 40]);
    const cell = (row: number) => rows[row]?.querySelector('td') ?? element;
    expect(getComputedStyle(cell(0)).borderBottomColor).toBe(colour('color.border.subtle'));
    expect(getComputedStyle(cell(3)).borderBottomStyle).toBe('none');
    const header = element.querySelector('thead th') ?? element;
    expect(getComputedStyle(header).borderBottomColor).toBe(colour('color.border.default'));
    expect(getComputedStyle(header).position).toBe('sticky');
    expect(getComputedStyle(header).zIndex).toBe(tokens['z-index.sticky'].css);
    // A row is not a control: no hover fill.
    expect(getComputedStyle(cell(0)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    const box = element.querySelector('.box') ?? element;
    expect(getComputedStyle(box).borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    element.remove();
  });

  it('is a named region and a Tab stop while its content overflows, with the header stuck to its top', async () => {
    const { fixture, element, table } = await mount();
    expect(await table.isScrollable()).toBe(false);
    const box = element.querySelector<HTMLElement>('.box');
    expect(box?.hasAttribute('tabindex')).toBe(false);
    fixture.componentInstance.rows.set(many);
    element.querySelector('ave-data-table')?.setAttribute('style', 'block-size: 200px');
    await frames(fixture);
    expect(await table.isScrollable()).toBe(true);
    expect(box?.getAttribute('aria-label')).toBe('Договоры');
    expect(box?.getAttribute('tabindex')).toBe('0');
    box?.scrollTo({ top: 120 });
    const header = element.querySelector('thead th');
    expect(header?.getBoundingClientRect().top).toBe((box?.getBoundingClientRect().top ?? 0) + 1);
    element.remove();
  });

  it('sets a column’s width with its range, never narrower than its content', async () => {
    const { fixture, element, table } = await mount();
    const host = fixture.componentInstance;
    await expect(table.setColumnWidth('Сумма', 200)).rejects.toThrow('cannot be resized');
    host.resizable.set(true);
    await settle(fixture);
    const range = element.querySelector<HTMLInputElement>('th[data-column="amount"] > .resize');
    expect(range?.getAttribute('aria-label')).toBe('Ширина столбца «Сумма»');
    expect([range?.min, range?.max, range?.step]).toEqual(['48', '960', '8']);
    // As it takes focus, the range says the width the column is drawn at.
    range?.focus();
    expect(Number(range?.value)).toBe(stepped(await table.getColumnWidth('Сумма')));
    await table.setColumnWidth('Сумма', 200);
    await settle(fixture);
    expect(host.widths()).toEqual({ amount: 200 });
    expect(await table.getColumnWidth('Сумма')).toBe(200);
    // Content keeps a column from narrowing further; the range then says the width drawn.
    await table.setColumnWidth('Предмет', 48);
    await settle(fixture);
    const subject = element.querySelector<HTMLInputElement>('th[data-column="subject"] > .resize');
    const drawn = await table.getColumnWidth('Предмет');
    expect(drawn).toBeGreaterThan(48);
    expect(Number(subject?.value)).toBe(stepped(drawn));
    await expect(table.setColumnWidth('Срок', 100)).rejects.toThrow('cannot be resized');
    await expect(table.getColumnWidth('Срок')).rejects.toThrow('no column Срок');
    element.remove();
  });

  it('drags a column’s edge with the pointer, towards the inline end in either direction', async () => {
    const { fixture, element } = await mount();
    const host = fixture.componentInstance;
    host.resizable.set(true);
    await settle(fixture);
    const range = element.querySelector<HTMLInputElement>('th[data-column="amount"] > .resize');
    const header = element.querySelector('th[data-column="amount"]');
    if (range === null || header === null) throw new Error('No range');
    const pointer = (type: string, clientX: number, button = 0) => {
      range.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX, button, pointerId: 1 }));
    };
    const start = header.getBoundingClientRect().width;
    // Moving without a press, or a press of another button, drags nothing.
    pointer('pointermove', 300);
    pointer('pointerdown', 100, 2);
    pointer('pointerup', 100);
    expect(host.widths()).toEqual({});
    pointer('pointerdown', 100);
    await settle(fixture);
    expect(element.querySelector('ave-data-table')?.hasAttribute('data-resizing')).toBe(true);
    expect(range.hasAttribute('data-dragging')).toBe(true);
    expect(document.activeElement).toBe(range);
    pointer('pointermove', 164);
    await settle(fixture);
    expect(host.widths()['amount']).toBe(Math.round(start + 64));
    pointer('pointerup', 164);
    await settle(fixture);
    expect(element.querySelector('ave-data-table')?.hasAttribute('data-resizing')).toBe(false);
    expect(Number(range.value)).toBe(stepped(header.getBoundingClientRect().width));
    // Right to left, the inline end is to the left.
    host.dir.set('rtl');
    await settle(fixture);
    const before = header.getBoundingClientRect().width;
    pointer('pointerdown', 300);
    pointer('pointermove', 268);
    pointer('lostpointercapture', 268);
    await settle(fixture);
    expect(host.widths()['amount']).toBe(Math.round(before + 32));
    element.remove();
  });

  it('types a cell template’s row, and finds tables by their names', async () => {
    const { fixture, element } = await mount();
    const [cell] = fixture.componentInstance.cells();
    if (cell === undefined) throw new Error('No cell template');
    expect(cell.aveCell()).toBe('endsOn');
    expect(AveCellTemplate.ngTemplateContextGuard(cell, { $implicit: few[0] })).toBe(true);
    expect(AveCellTemplate.ngTemplateContextGuard(cell, null)).toBe(false);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveDataTableHarness.with({ label: 'Договоры' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveDataTableHarness.with({ label: /Акты/ }))).toHaveLength(0);
    element.remove();
  });
});
