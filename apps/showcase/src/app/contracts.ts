import { Component, DestroyRef, ElementRef, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveAlert } from '@avelune/ui/alert';
import { AveBadge } from '@avelune/ui/badge';
import { lucideCopy, lucideEllipsis, lucideFileText, lucideSearch, lucideTrash } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveCellTemplate, AveDataTable, type AveColumn, type AveSort } from '@avelune/ui/data-table';
import { AveConfirmDialog, AveDialog, AveDialogActions, AveDrawer } from '@avelune/ui/dialog';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveChoiceGroup } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveLink } from '@avelune/ui/link';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { AvePopover } from '@avelune/ui/popover';
import { AveRadio } from '@avelune/ui/radio';
import { AveProgress } from '@avelune/ui/progress';
import { AveTag } from '@avelune/ui/tag';
import { AveToaster } from '@avelune/ui/toast';
import { contractStatusVariants, contractStatuses, contracts, type ContractRecord, type ContractStatus } from './data';

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
    AveBadge,
    AveButton,
    AveCellTemplate,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveConfirmDialog,
    AveDataTable,
    AveDialog,
    AveDialogActions,
    AveDrawer,
    AveEmptyState,
    AveEmptyStateActions,
    AveInput,
    AveLink,
    AveMenu,
    AvePopover,
    AveProgress,
    AveRadio,
    AveTag,
    RouterLink,
  ],
  providers: [provideAveIcons([lucideCopy, lucideEllipsis, lucideFileText, lucideSearch, lucideTrash])],
  template: `
    <div class="page" lang="ru">
      <header class="header">
        <div class="heading">
          <h1 class="title">Договоры</h1>
          <p class="count" role="status">{{ loading() ? 'Загрузка договоров…' : count() }}</p>
        </div>
        <div class="actions">
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
      </header>

      @if (exported() !== null) {
        <section class="export" aria-label="Выгрузка реестра">
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
        <ave-alert variant="warning" heading="Есть истёкшие договоры">
          @for (contract of expired(); track contract.id) {
            Договор <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.number }}</a> истёк
            {{ dates.numeric(contract.endsOn) }}.
          }
          Продлите или закройте истёкшие договоры, чтобы они не попадали в отчёты.
        </ave-alert>
      }

      <div class="toolbar">
        <input
          #searchBox
          aveInput
          class="search"
          type="search"
          autocomplete="off"
          aria-label="Поиск договоров"
          placeholder="Номер, предмет или контрагент"
          [value]="query()"
          (input)="search($event)"
        />
        <ave-popover label="Статус" heading="Статус договора" [(open)]="filtering">
          <fieldset aveChoiceGroup legend="Показывать договоры">
            @for (status of statusList; track status) {
              <label aveChoice>
                <input type="checkbox" aveCheckbox [checked]="shownStatuses().has(status)" (change)="toggle(status)" />
                {{ statuses[status] }}
              </label>
            }
          </fieldset>
          <div class="filter-actions">
            <button aveButton type="button" variant="ghost" (click)="shownStatuses.set(allStatuses())">
              Все статусы
            </button>
            <button aveButton type="button" variant="primary" (click)="filtering.set(false)">Готово</button>
          </div>
        </ave-popover>
      </div>

      @if (narrowed()) {
        <div class="filters">
          <span class="filters-caption" id="shown-statuses">Показаны статусы</span>
          <ul class="filter-tags" aria-labelledby="shown-statuses">
            @for (status of shownList(); track status) {
              <li>
                <ave-tag removable (remove)="removeStatus(status)">{{ statuses[status] }}</ave-tag>
              </li>
            }
          </ul>
          <button aveButton type="button" variant="ghost" size="sm" (click)="showAllStatuses()">Все статусы</button>
        </div>
      }

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
    </div>

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

  /** The statuses the list shows, chosen in the Status popover; all of them at first. */
  protected readonly statusList = Object.keys(contractStatuses) as ContractStatus[];
  protected readonly shownStatuses = signal<ReadonlySet<ContractStatus>>(this.allStatuses());
  protected readonly filtering = signal(false);
  /** The statuses shown, in the popover's order, while the filter leaves some out. */
  protected readonly shownList = computed(() => this.statusList.filter((status) => this.shownStatuses().has(status)));
  protected readonly narrowed = computed(() => this.shownList().length < this.statusList.length);

  /** What the person searches for: part of a number, a subject or a counterparty. */
  protected readonly query = signal('');
  protected readonly shown = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('ru');
    const statuses = this.shownStatuses();
    const rows = this.rows().filter((contract) => statuses.has(contract.status));
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
    source: () => [this.query(), this.shownStatuses()] as const,
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
  private readonly statusFilter = viewChild.required<AvePopover, ElementRef<HTMLElement>>(AvePopover, {
    read: ElementRef,
  });

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
   * A status's tag taken away: the list stops showing it. Without the last one the filter is gone, and focus goes to
   * the Status button, since the tags go too.
   */
  protected removeStatus(status: ContractStatus): void {
    const next = new Set(this.shownStatuses());
    next.delete(status);
    if (next.size > 0) this.shownStatuses.set(next);
    else this.showAllStatuses();
  }

  /** Every status shown again; the tags go, and focus goes to the Status button. */
  protected showAllStatuses(): void {
    this.shownStatuses.set(this.allStatuses());
    this.statusFilter().nativeElement.querySelector('button')?.focus();
  }

  /** The empty state's action: the search and the filters empty, and focus goes to the search. */
  protected resetSearch(): void {
    this.query.set('');
    this.shownStatuses.set(this.allStatuses());
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
