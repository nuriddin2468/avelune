import { Component, computed, input, signal } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { RouterLink } from '@angular/router';
import { lucideFileX, lucidePaperclip } from '@avelune/icons/lucide';
import { AveBreadcrumbs, type AveBreadcrumb } from '@avelune/ui/breadcrumbs';
import { AveButton } from '@avelune/ui/button';
import { AveTab, AveTabs } from '@avelune/ui/tabs';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { contractStatuses, contracts, type ContractRecord } from './data';

/** The contract a route's `:id` names, if the register holds it. */
function contractOf(id: string | undefined): ContractRecord | undefined {
  return contracts.find((contract) => String(contract.id) === id);
}

/** The page's title: the contract's number, or that it was not found. */
export const contractTitle: ResolveFn<string> = (route) => {
  const contract = contractOf(route.paramMap.get('id') ?? undefined);
  return `${contract === undefined ? 'Договор не найден' : `Договор ${contract.number}`} · Avelune`;
};

/**
 * A contract's own page, under the register: where it is in the product, its subject, and its facts, approval, files
 * and history in tabs. The register links each contract's number here.
 */
@Component({
  selector: 'ave-showcase-contract',
  imports: [AveBreadcrumbs, AveButton, AveEmptyState, AveEmptyStateActions, AveTab, AveTabs, RouterLink],
  providers: [provideAveIcons([lucideFileX, lucidePaperclip])],
  template: `
    <div class="page" lang="ru">
      @if (contract(); as contract) {
        <header class="header">
          <ave-breadcrumbs [items]="trail" [current]="contract.number" />
          <h1 class="title">Договор {{ contract.number }}</h1>
          <p class="subject">{{ contract.subject }}</p>
        </header>

        <ave-tabs label="Разделы договора" [(selected)]="section">
          <ave-tab value="facts" label="Сведения">
            <dl class="facts">
              <div class="fact">
                <dt>Контрагент</dt>
                <dd>{{ contract.counterparty }}</dd>
              </div>
              <div class="fact">
                <dt>Сумма без НДС</dt>
                <dd class="amount">{{ amount(contract) }}</dd>
              </div>
              <div class="fact">
                <dt>Статус</dt>
                <dd>{{ statuses[contract.status] }}</dd>
              </div>
              <div class="fact">
                <dt>Подписан</dt>
                <dd>{{ contract.signedOn === null ? 'Ещё не подписан' : dates.numeric(contract.signedOn) }}</dd>
              </div>
              <div class="fact">
                <dt>Действует до</dt>
                <dd>{{ dates.numeric(contract.endsOn) }}</dd>
              </div>
            </dl>
          </ave-tab>
          <ave-tab value="approval" label="Согласование">
            <ol class="events">
              @for (step of approval; track step.department) {
                <li class="event">
                  <span>{{ step.department }}</span>
                  <span class="when">{{ step.state }}</span>
                </li>
              }
            </ol>
          </ave-tab>
          <ave-tab value="files" label="Файлы" icon="paperclip">
            <ul class="events">
              @for (file of files; track file.name) {
                <li class="event">
                  <span>{{ file.name }}</span>
                  <span class="when">{{ file.size }}</span>
                </li>
              }
            </ul>
          </ave-tab>
          <ave-tab value="history" label="История">
            <ol class="events">
              @for (event of history; track event.what) {
                <li class="event">
                  <span>{{ event.what }}</span>
                  <span class="when">{{ dates.numeric(event.on) }}</span>
                </li>
              }
            </ol>
          </ave-tab>
        </ave-tabs>
      } @else {
        <header class="header">
          <ave-breadcrumbs [items]="trail" current="Договор не найден" />
        </header>
        <section class="panel" aria-label="Договор">
          <ave-empty-state icon="file-x" heading="Договор не найден">
            <p>В реестре нет договора с таким номером: его удалили или ссылка неверна.</p>
            <div aveEmptyStateActions><a aveButton routerLink="/contracts">Открыть реестр договоров</a></div>
          </ave-empty-state>
        </section>
      }
    </div>
  `,
  styleUrl: './contract.css',
})
export class ContractPage {
  /** The route's `:id`, bound by the router. */
  readonly id = input.required<string>();

  protected readonly contract = computed(() => contractOf(this.id()));

  /** The section the page shows; the facts first. */
  protected readonly section = signal('facts');

  /** Who approves the contract, in order, and where each stands. */
  protected readonly approval = [
    { department: 'Юридический отдел', state: 'Согласовано' },
    { department: 'Финансовый отдел', state: 'На рассмотрении' },
    { department: 'Служба безопасности', state: 'Ожидает' },
  ];

  /** The contract's files. */
  protected readonly files = [
    { name: 'Договор поставки.pdf', size: '1,2 МБ' },
    { name: 'Спецификация оборудования.xlsx', size: '86 КБ' },
  ];

  /** What happened to the contract, newest first. */
  protected readonly history = [
    { what: 'Отправлен на согласование', on: '2026-09-18' },
    { what: 'Создан черновик', on: '2026-09-16' },
  ];
  protected readonly trail: readonly AveBreadcrumb[] = [{ label: 'Договоры', link: '/contracts' }];
  protected readonly statuses = contractStatuses;
  protected readonly dates = aveDateFormat('ru');
  private readonly sums = aveNumberFormat('ru');

  protected amount(contract: ContractRecord): string {
    return `${this.sums.format(contract.amount)} сум`;
  }
}
