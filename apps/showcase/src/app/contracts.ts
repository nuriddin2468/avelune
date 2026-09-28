import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveAlert } from '@avelune/ui/alert';
import { AveButton } from '@avelune/ui/button';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { AveProgress } from '@avelune/ui/progress';
import { AveSkeleton } from '@avelune/ui/skeleton';
import { contractStatuses, contracts, type ContractRecord } from './data';

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
  imports: [AveAlert, AveButton, AveProgress, AveSkeleton, RouterLink],
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
        @for (contract of rows(); track contract.id) {
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
          </li>
        }
      </ul>
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

  /** Contracts whose term has ended: the alert above the list names them. */
  protected readonly expired = computed(() => this.rows().filter((contract) => contract.status === 'expired'));
  protected readonly expiredText = computed(() =>
    this.expired()
      .map((contract) => `Договор ${contract.number} истёк ${this.dates.numeric(contract.endsOn)}.`)
      .join(' '),
  );

  /** How many contracts the list holds, in Russian: 1 договор, 2 договора, 5 договоров. */
  protected readonly count = computed(() => {
    const count = this.rows().length;
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
