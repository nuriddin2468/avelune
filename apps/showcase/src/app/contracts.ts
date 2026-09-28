import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveButton } from '@avelune/ui/button';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { AveProgress } from '@avelune/ui/progress';
import { contractStatuses, contracts, type ContractRecord } from './data';

/** How the pretend export advances: a share of the register every step. */
const exportStep = 0.2;
const exportInterval = 400;

/**
 * The department's register of contracts: the list, its actions, and the feedback of the kit's third wave around
 * them. The export runs on a pretend server and shows its progress under the page's heading.
 */
@Component({
  selector: 'ave-showcase-contracts',
  imports: [AveButton, AveProgress, RouterLink],
  template: `
    <div class="page" lang="ru">
      <header class="header">
        <h1 class="title">Договоры</h1>
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

      <ul class="list" aria-label="Договоры подразделения">
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

  protected readonly rows = signal<readonly ContractRecord[]>(contracts);

  /** The share of the register exported so far, or `null` before the first export. */
  protected readonly exported = signal<number | null>(null);
  protected readonly exporting = computed(() => {
    const done = this.exported();
    return done !== null && done < 1;
  });

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
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
