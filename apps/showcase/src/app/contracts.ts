import { Component, DestroyRef, ElementRef, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveAlert } from '@avelune/ui/alert';
import { AveBadge } from '@avelune/ui/badge';
import { lucideCopy, lucideEllipsis, lucideFileText, lucideSearch, lucideTrash } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveCellTemplate, AveDataTable, type AveColumn, type AveSort } from '@avelune/ui/data-table';
import { AveDateRangePicker, type AveDateRange } from '@avelune/ui/date-picker';
import { AveConfirmDialog, AveDialog, AveDialogActions, AveDrawer } from '@avelune/ui/dialog';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import {
  AveAppliedFilters,
  AveFilterPanel,
  AveFilterPanelContent,
  type AveAppliedFilter,
} from '@avelune/ui/filter-panel';
import { AveChoiceGroup, AveFormField } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveLink } from '@avelune/ui/link';
import { AveListPage, AveListPageNotice } from '@avelune/ui/list-page';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { AveRadio } from '@avelune/ui/radio';
import { AveSearchHeader, AveSearchHeaderActions, AveSearchHeaderSearch } from '@avelune/ui/search-header';
import { AveProgress } from '@avelune/ui/progress';
import { AveToaster } from '@avelune/ui/toast';
import { contractStatusVariants, contractStatuses, contracts, type ContractRecord, type ContractStatus } from './data';

/** Whether a date falls in a term, whose ends may be open; any date without a term. */
function within(date: string, term: AveDateRange | null): boolean {
  if (term === null) return true;
  return (term.start === null || date >= term.start) && (term.end === null || date <= term.end);
}

/** What a row's menu does to its contract. */
type RowAction = 'open' | 'copy' | 'delete';

/** How long the pretend server takes to send the register. */
const loadDelay = 800;

/** How the pretend export advances: a share of the register every step. */
const exportStep = 0.2;
const exportInterval = 400;

/**
 * The department's register of contracts: the list, its actions, and the feedback of the kit's third wave around
 * them. The export runs on a pretend server and shows its progress under the page's heading.
 */
@Component({
  selector: 'ave-showcase-contracts',
  imports: [
    AveAlert,
    AveAppliedFilters,
    AveBadge,
    AveButton,
    AveCellTemplate,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveConfirmDialog,
    AveDataTable,
    AveDateRangePicker,
    AveDialog,
    AveDialogActions,
    AveDrawer,
    AveEmptyState,
    AveEmptyStateActions,
    AveFilterPanel,
    AveFilterPanelContent,
    AveFormField,
    AveInput,
    AveLink,
    AveListPage,
    AveListPageNotice,
    AveMenu,
    AveProgress,
    AveRadio,
    AveSearchHeader,
    AveSearchHeaderActions,
    AveSearchHeaderSearch,
    RouterLink,
  ],
  providers: [provideAveIcons([lucideCopy, lucideEllipsis, lucideFileText, lucideSearch, lucideTrash])],
  template: `
    <ave-list-page lang="ru">
      <ave-search-header
        heading="Договоры"
        searchLabel="Поиск договоров"
        [summary]="loading() ? 'Загрузка договоров…' : count()"
        [filters]="filters"
      >
        <div aveSearchHeaderActions>
          <button
            aveButton
            type="button"
            aria-haspopup="dialog"
            [disabled]="exporting()"
            (click)="exportOpen.set(true)"
          >
            {{ selected().length > 0 ? 'Выгрузить выбранные' : 'Выгрузить в Excel' }}
          </button>
          <a aveButton variant="primary" routerLink="/">Новый договор</a>
        </div>
        <input
          #searchBox
          aveInput
          aveSearchHeaderSearch
          type="search"
          autocomplete="off"
          aria-label="Поиск договоров"
          placeholder="Номер, предмет или контрагент"
          [value]="query()"
          (input)="search($event)"
        />
      </ave-search-header>

      @if (exported() !== null) {
        <section aveListPageNotice class="export" aria-label="Выгрузка реестра">
          <div class="export-head">
            <label for="export-progress">Выгрузка реестра договоров</label>
            <span class="export-value" role="status" [attr.data-done]="exported() === 1 ? '' : null">
              {{ exported() === 1 ? 'Готово' : percent.format(exported() ?? 0) }}
            </span>
          </div>
          <progress
            aveProgress
            id="export-progress"
            [value]="exported()"
            [variant]="exported() === 1 ? 'success' : 'accent'"
          ></progress>
        </section>
      }

      @if (expired().length > 0) {
        <ave-alert aveListPageNotice variant="warning" heading="Есть истёкшие договоры">
          @for (contract of expired(); track contract.id) {
            Договор <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.number }}</a> истёк
            {{ dates.numeric(contract.endsOn) }}.
          }
          Продлите или закройте истёкшие договоры, чтобы они не попадали в отчёты.
        </ave-alert>
      }

      <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />

      <ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">
        <ng-template aveFilterPanelContent>
          <fieldset aveChoiceGroup legend="Статус">
            @for (status of statusList; track status) {
              <label aveChoice>
                <input type="checkbox" aveCheckbox [checked]="shownStatuses().has(status)" (change)="toggle(status)" />
                {{ statuses[status] }}
              </label>
            }
          </fieldset>
          <ave-form-field label="Действует до">
            <ave-date-range-picker [(value)]="term" />
          </ave-form-field>
        </ng-template>
      </ave-filter-panel>

      <ave-data-table
        label="Договоры подразделения"
        selectable
        [rows]="shown()"
        [columns]="columns"
        [rowKey]="byId"
        [loading]="loading()"
        [(sort)]="sort"
        [(selected)]="selected"
        [(page)]="page"
        [(pageSize)]="pageSize"
      >
        <ng-template aveCell="subject" [aveCellOf]="shown()" let-contract>
          <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.subject }}</a>
        </ng-template>
        <ng-template aveCell="status" [aveCellOf]="shown()" let-contract>
          <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
        </ng-template>
        <ng-template aveCell="endsOn" [aveCellOf]="shown()" let-contract>
          <time [attr.datetime]="contract.endsOn">{{ dates.numeric(contract.endsOn) }}</time>
        </ng-template>
        <ng-template aveCell="actions" [aveCellOf]="shown()" let-contract>
          <ave-menu
            icon="ellipsis"
            variant="ghost"
            size="sm"
            [label]="'Действия с договором ' + contract.number"
            [items]="rowActions"
            (itemSelected)="act(contract, $event)"
          />
        </ng-template>
        <ave-empty-state aveDataTableEmpty icon="search" heading="Ничего не найдено">
          <p>Ни один договор не подходит под поиск и выбранные статусы.</p>
          <div aveEmptyStateActions>
            <button aveButton type="button" (click)="resetSearch()">Сбросить поиск и фильтры</button>
          </div>
        </ave-empty-state>
      </ave-data-table>
    </ave-list-page>

    <dialog aveDialog size="sm" heading="Выгрузка реестра" [(open)]="exportOpen" lang="ru">
      <form class="export-form" id="export-form" (submit)="startExport($event)">
        <fieldset aveChoiceGroup legend="Формат файла">
          <label aveChoice><input type="radio" aveRadio name="format" value="xlsx" checked /> Excel (XLSX)</label>
          <label aveChoice><input type="radio" aveRadio name="format" value="csv" /> Таблица CSV</label>
        </fieldset>
        <label aveChoice><input type="checkbox" aveCheckbox checked /> Добавить суммы по контрагентам</label>
      </form>
      <div aveDialogActions>
        <button aveButton type="button" (click)="exportOpen.set(false)">Отмена</button>
        <button aveButton type="submit" variant="primary" form="export-form">Выгрузить</button>
      </div>
    </dialog>

    <dialog aveDrawer [heading]="'Договор ' + (viewed()?.number ?? '')" [(open)]="viewing" lang="ru">
      @if (viewed(); as contract) {
        <dl class="card">
          <dt>Предмет</dt>
          <dd>{{ contract.subject }}</dd>
          <dt>Контрагент</dt>
          <dd>{{ contract.counterparty }}</dd>
          <dt>Сумма без НДС</dt>
          <dd>{{ amount(contract) }}</dd>
          <dt>Статус</dt>
          <dd>
            <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
          </dd>
          <dt>Подписан</dt>
          <dd>{{ contract.signedOn === null ? 'Ещё не подписан' : dates.numeric(contract.signedOn) }}</dd>
          <dt>Действует до</dt>
          <dd>{{ dates.numeric(contract.endsOn) }}</dd>
        </dl>
      }
      <div aveDialogActions>
        <a aveButton variant="primary" routerLink="/">Изменить договор</a>
      </div>
    </dialog>

    <dialog
      aveConfirmDialog
      action="Удалить договор"
      [heading]="'Удалить договор ' + (deleting()?.number ?? '') + '?'"
      [(open)]="asking"
      (confirm)="remove()"
      lang="ru"
    >
      Договор и его приложения будут удалены без возможности восстановления.
    </dialog>
  `,
  styleUrl: './contracts.css',
})
export class ContractsPage {
  protected readonly statuses = contractStatuses;
  protected readonly variants = contractStatusVariants;
  protected readonly dates = aveDateFormat('ru');
  protected readonly percent = aveNumberFormat('ru', { style: 'percent' });
  private readonly sums = aveNumberFormat('ru');
  private readonly toaster = inject(AveToaster);

  /** The register comes from a pretend server: skeleton rows hold its place until it arrives. */
  protected readonly loading = signal(true);
  protected readonly rows = signal<readonly ContractRecord[]>([]);

  /** The register's columns: the number is each row's title, the subject its link, the menu its actions. */
  protected readonly columns: readonly AveColumn<ContractRecord>[] = [
    { key: 'number', header: 'Номер', value: (contract) => contract.number, sortable: true, rowHeader: true },
    { key: 'subject', header: 'Предмет', value: (contract) => contract.subject, sortable: true },
    { key: 'counterparty', header: 'Контрагент', value: (contract) => contract.counterparty, sortable: true },
    { key: 'amount', header: 'Сумма, сум', value: (contract) => contract.amount, sortable: true, numeric: true },
    { key: 'status', header: 'Статус', value: (contract) => contractStatuses[contract.status] },
    { key: 'endsOn', header: 'Действует до', value: (contract) => contract.endsOn, sortable: true },
    { key: 'actions', header: 'Действия', hideHeader: true },
  ];
  protected readonly byId = (contract: ContractRecord) => contract.id;
  protected readonly sort = signal<AveSort | null>(null);
  /** The contracts people chose: the export takes them. */
  protected readonly selected = signal<readonly number[]>([]);

  /** The actions of every row: its card in a drawer, a copy as a new draft, and deleting it. */
  protected readonly rowActions: readonly AveMenuEntry<RowAction>[] = [
    { value: 'open', label: 'Открыть', icon: 'file-text' },
    { value: 'copy', label: 'Дублировать', icon: 'copy' },
    { separator: true },
    { value: 'delete', label: 'Удалить договор', icon: 'trash', danger: true },
  ];
  private nextId = 115;

  /** The statuses the list shows, chosen in the filter panel; all of them at first. */
  protected readonly statusList = Object.keys(contractStatuses) as ContractStatus[];
  protected readonly shownStatuses = signal<ReadonlySet<ContractStatus>>(this.allStatuses());
  /** The period the contracts' terms end in, chosen in the filter panel; any at first. */
  protected readonly term = signal<AveDateRange | null>(null);

  /** The filters applied, as tags over the list: each status shown while some are left out, and the term. */
  protected readonly applied = computed<readonly AveAppliedFilter[]>(() => {
    const statuses = this.statusList.filter((status) => this.shownStatuses().has(status));
    const narrowed = statuses.length < this.statusList.length;
    const term = this.term();
    return [
      ...(narrowed
        ? statuses.map((status) => ({ key: `status:${status}`, label: `Статус: ${contractStatuses[status]}` }))
        : []),
      ...(term === null || (term.start === null && term.end === null)
        ? []
        : [{ key: 'term', label: `Действует до: ${this.period(term)}` }]),
    ];
  });

  /** What the person searches for: part of a number, a subject or a counterparty. */
  protected readonly query = signal('');
  protected readonly shown = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('ru');
    const statuses = this.shownStatuses();
    const term = this.term();
    const rows = this.rows().filter((contract) => statuses.has(contract.status) && within(contract.endsOn, term));
    if (query === '') return rows;
    return rows.filter((contract) =>
      [contract.number, contract.subject, contract.counterparty].some((text) =>
        text.toLocaleLowerCase('ru').includes(query),
      ),
    );
  });

  /** The register pages ten contracts at a time at first; a new search or filter goes back to the first page. */
  protected readonly pageSize = signal(10);
  protected readonly page = linkedSignal({
    source: () => [this.query(), this.shownStatuses(), this.term()] as const,
    computation: () => 1,
  });

  /** Contracts whose term has ended: the alert above the list names them, each a link to its page. */
  protected readonly expired = computed(() => this.rows().filter((contract) => contract.status === 'expired'));

  /** How many contracts the list shows, in Russian (1 договор, 2 договора, 5 договоров), and how many are chosen. */
  protected readonly count = computed(() => {
    const count = this.shown().length;
    const noun = { one: 'договор', few: 'договора', many: 'договоров', other: 'договора' } as const;
    const form = new Intl.PluralRules('ru').select(count);
    const shown = `${String(count)} ${form === 'zero' || form === 'two' ? noun.many : noun[form]}`;
    const chosen = this.selected().length;
    return chosen === 0 ? shown : `${shown}, выбрано ${String(chosen)}`;
  });

  /** The share of the register exported so far, or `null` before the first export. */
  protected readonly exported = signal<number | null>(null);
  protected readonly exporting = computed(() => {
    const done = this.exported();
    return done !== null && done < 1;
  });

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    const load = setTimeout(() => {
      this.rows.set(contracts);
      this.loading.set(false);
    }, loadDelay);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(load);
      clearInterval(this.timer);
    });
  }

  private readonly searchBox = viewChild.required<ElementRef<HTMLInputElement>>('searchBox');

  protected allStatuses(): ReadonlySet<ContractStatus> {
    return new Set(this.statusList);
  }

  protected toggle(status: ContractStatus): void {
    const next = new Set(this.shownStatuses());
    if (next.has(status)) next.delete(status);
    else next.add(status);
    this.shownStatuses.set(next);
  }

  /**
   * An applied filter's tag taken away: the list stops showing that status, or any term. Without the last status the
   * status filter is gone; once no tag is left, focus goes back to the search, since the tags go.
   */
  protected removeFilter(key: string): void {
    if (key === 'term') {
      this.term.set(null);
    } else {
      const next = new Set(this.shownStatuses());
      next.delete(key.replace('status:', '') as ContractStatus);
      this.shownStatuses.set(next.size > 0 ? next : this.allStatuses());
    }
    if (this.applied().length === 0) this.searchBox().nativeElement.focus();
  }

  /** Every filter taken away: every status and any term; focus goes back to the search. */
  protected clearFilters(): void {
    this.shownStatuses.set(this.allStatuses());
    this.term.set(null);
    this.searchBox().nativeElement.focus();
  }

  /** A term's dates for its tag: "01.01.2026 – 31.12.2026", or one end of it. */
  private period(term: AveDateRange): string {
    const start = term.start === null ? '…' : this.dates.numeric(term.start);
    const end = term.end === null ? '…' : this.dates.numeric(term.end);
    return `${start} – ${end}`;
  }

  /** The empty state's action: the search and the filters empty, and focus goes to the search. */
  protected resetSearch(): void {
    this.query.set('');
    this.shownStatuses.set(this.allStatuses());
    this.term.set(null);
    this.searchBox().nativeElement.focus();
  }

  /** A row's menu chose an action for its contract; a copy is confirmed by a toast that opens it. */
  protected act(contract: ContractRecord, action: RowAction): void {
    if (action === 'open') {
      this.viewed.set(contract);
      this.viewing.set(true);
    } else if (action === 'copy') {
      const id = this.nextId++;
      const copy: ContractRecord = {
        ...contract,
        id,
        number: `ДК-2026/${String(id)}`,
        status: 'draft',
        signedOn: null,
      };
      this.rows.set([copy, ...this.rows()]);
      this.toaster.show({
        message: `Создан черновик ${copy.number}`,
        variant: 'success',
        action: {
          label: 'Открыть',
          run: () => {
            this.act(copy, 'open');
          },
        },
      });
    } else {
      this.deleting.set(contract);
      this.asking.set(true);
    }
  }

  /** The contract whose card the drawer shows; kept while the drawer leaves. */
  protected readonly viewed = signal<ContractRecord | null>(null);
  protected readonly viewing = signal(false);

  /** The contract whose deletion the confirmation asks about; kept while the confirmation leaves. */
  protected readonly deleting = signal<ContractRecord | null>(null);
  protected readonly asking = signal(false);

  /** The confirmation said yes: the contract goes, and a toast confirms it. */
  protected remove(): void {
    const contract = this.deleting();
    if (contract === null) return;
    this.rows.set(this.rows().filter((row) => row.id !== contract.id));
    this.selected.set(this.selected().filter((id) => id !== contract.id));
    this.toaster.show({ message: `Договор ${contract.number} удалён`, variant: 'success' });
  }

  protected search(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.query.set(event.target.value);
  }

  protected amount(contract: ContractRecord): string {
    return `${this.sums.format(contract.amount)} сум`;
  }

  /** Whether the export's options are asked. */
  protected readonly exportOpen = signal(false);

  /** The pretend server exports the register a share at a time, once its options are chosen. */
  protected startExport(event: Event): void {
    event.preventDefault();
    this.exportOpen.set(false);
    clearInterval(this.timer);
    this.exported.set(0);
    this.timer = setInterval(() => {
      const next = Math.min(1, Math.round(((this.exported() ?? 0) + exportStep) * 100) / 100);
      this.exported.set(next);
      if (next === 1) clearInterval(this.timer);
    }, exportInterval);
  }
}
