import { Component, DestroyRef, type ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveAlert } from '@avelune/ui/alert';
import { lucideCopy, lucideEllipsis, lucideSearch, lucideTrash } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveChoiceGroup } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { AvePopover } from '@avelune/ui/popover';
import { AveProgress } from '@avelune/ui/progress';
import { AveSkeleton } from '@avelune/ui/skeleton';
import { contractStatuses, contracts, type ContractRecord, type ContractStatus } from './data';

/** What a row's menu does to its contract. */
type RowAction = 'copy' | 'delete';

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
    AveButton,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveEmptyState,
    AveEmptyStateActions,
    AveInput,
    AveMenu,
    AvePopover,
    AveProgress,
    AveSkeleton,
    RouterLink,
  ],
  providers: [provideAveIcons([lucideCopy, lucideEllipsis, lucideSearch, lucideTrash])],
  template: `
    <div class="page" lang="ru">
      <header class="header">
        <div class="heading">
          <h1 class="title">Договоры</h1>
          <p class="count" role="status">{{ loading() ? 'Загрузка договоров…' : count() }}</p>
        </div>
        <div class="actions">
          <button aveButton type="button" [disabled]="exporting()" (click)="startExport()">Выгрузить в Excel</button>
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
          {{ expiredText() }} Продлите или закройте истёкшие договоры, чтобы они не попадали в отчёты.
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

      @if (!loading() && shown().length === 0) {
        <section class="empty" aria-label="Договоры подразделения">
          <ave-empty-state icon="search" heading="Ничего не найдено">
            <p>Ни один договор не подходит под поиск и выбранные статусы.</p>
            <div aveEmptyStateActions>
              <button aveButton type="button" (click)="resetSearch()">Сбросить поиск и фильтры</button>
            </div>
          </ave-empty-state>
        </section>
      } @else {
        <ul class="list" aria-label="Договоры подразделения" [attr.aria-busy]="loading() ? 'true' : null">
          @if (loading()) {
            @for (row of placeholders; track row) {
              <li class="row" data-placeholder>
                <div class="main">
                  <ave-skeleton class="short" />
                  <ave-skeleton lines="2" />
                </div>
                <div class="facts">
                  <ave-skeleton class="long" />
                  <ave-skeleton class="short" />
                </div>
              </li>
            }
          }
          @for (contract of shown(); track contract.id) {
            <li class="row">
              <div class="main">
                <span class="number">{{ contract.number }}</span>
                <span class="subject">{{ contract.subject }}</span>
                <span class="counterparty">{{ contract.counterparty }}</span>
              </div>
              <div class="facts">
                <span class="amount">{{ amount(contract) }}</span>
                <span class="status" [attr.data-status]="contract.status">{{ statuses[contract.status] }}</span>
                <span class="ends">до {{ dates.numeric(contract.endsOn) }}</span>
              </div>
              <ave-menu
                class="row-actions"
                icon="ellipsis"
                variant="ghost"
                size="sm"
                [label]="'Действия с договором ' + contract.number"
                [items]="rowActions"
                (itemSelected)="act(contract, $event)"
              />
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './contracts.css',
})
export class ContractsPage {
  protected readonly statuses = contractStatuses;
  protected readonly dates = aveDateFormat('ru');
  protected readonly percent = aveNumberFormat('ru', { style: 'percent' });
  private readonly sums = aveNumberFormat('ru');

  /** The register comes from a pretend server: skeleton rows hold its place until it arrives. */
  protected readonly loading = signal(true);
  protected readonly rows = signal<readonly ContractRecord[]>([]);
  protected readonly placeholders = [1, 2, 3];

  /** The actions of every row: a copy as a new draft, and deleting it. */
  protected readonly rowActions: readonly AveMenuEntry<RowAction>[] = [
    { value: 'copy', label: 'Дублировать', icon: 'copy' },
    { separator: true },
    { value: 'delete', label: 'Удалить договор', icon: 'trash', danger: true },
  ];
  private nextId = 115;

  /** The statuses the list shows, chosen in the Status popover; all of them at first. */
  protected readonly statusList = Object.keys(contractStatuses) as ContractStatus[];
  protected readonly shownStatuses = signal<ReadonlySet<ContractStatus>>(this.allStatuses());
  protected readonly filtering = signal(false);

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

  /** Contracts whose term has ended: the alert above the list names them. */
  protected readonly expired = computed(() => this.rows().filter((contract) => contract.status === 'expired'));
  protected readonly expiredText = computed(() =>
    this.expired()
      .map((contract) => `Договор ${contract.number} истёк ${this.dates.numeric(contract.endsOn)}.`)
      .join(' '),
  );

  /** How many contracts the list shows, in Russian: 1 договор, 2 договора, 5 договоров. */
  protected readonly count = computed(() => {
    const count = this.shown().length;
    const noun = { one: 'договор', few: 'договора', many: 'договоров', other: 'договора' } as const;
    const form = new Intl.PluralRules('ru').select(count);
    return `${String(count)} ${form === 'zero' || form === 'two' ? noun.many : noun[form]}`;
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

  /** The empty state's action: the search and the filters empty, and focus goes to the search. */
  protected resetSearch(): void {
    this.query.set('');
    this.shownStatuses.set(this.allStatuses());
    this.searchBox().nativeElement.focus();
  }

  /** A row's menu chose an action for its contract. */
  protected act(contract: ContractRecord, action: RowAction): void {
    if (action === 'copy') {
      const id = this.nextId++;
      const copy: ContractRecord = {
        ...contract,
        id,
        number: `ДК-2026/${String(id)}`,
        status: 'draft',
        signedOn: null,
      };
      this.rows.set([copy, ...this.rows()]);
    } else {
      this.rows.set(this.rows().filter((row) => row.id !== contract.id));
    }
  }

  protected search(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.query.set(event.target.value);
  }

  protected amount(contract: ContractRecord): string {
    return `${this.sums.format(contract.amount)} сум`;
  }

  /** The pretend server exports the register a share at a time. */
  protected startExport(): void {
    clearInterval(this.timer);
    this.exported.set(0);
    this.timer = setInterval(() => {
      const next = Math.min(1, Math.round(((this.exported() ?? 0) + exportStep) * 100) / 100);
      this.exported.set(next);
      if (next === 1) clearInterval(this.timer);
    }, exportInterval);
  }
}
