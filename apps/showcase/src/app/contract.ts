import { Component, computed, input } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { RouterLink } from '@angular/router';
import { lucideFileX } from '@avelune/icons/lucide';
import { AveBreadcrumbs, type AveBreadcrumb } from '@avelune/ui/breadcrumbs';
import { AveButton } from '@avelune/ui/button';
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
 * A contract's own page, under the register: where it is in the product, its subject and its facts. The register
 * links each contract's number here.
 */
@Component({
  selector: 'ave-showcase-contract',
  imports: [AveBreadcrumbs, AveButton, AveEmptyState, AveEmptyStateActions, RouterLink],
  providers: [provideAveIcons([lucideFileX])],
  template: `
    <div class="page" lang="ru">
      @if (contract(); as contract) {
        <header class="header">
          <ave-breadcrumbs [items]="trail" [current]="contract.number" />
          <h1 class="title">Договор {{ contract.number }}</h1>
          <p class="subject">{{ contract.subject }}</p>
        </header>

        <section class="panel" aria-labelledby="facts-heading">
          <h2 class="panel-heading" id="facts-heading">Сведения</h2>
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
        </section>
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
  protected readonly trail: readonly AveBreadcrumb[] = [{ label: 'Договоры', link: '/contracts' }];
  protected readonly statuses = contractStatuses;
  protected readonly dates = aveDateFormat('ru');
  private readonly sums = aveNumberFormat('ru');

  protected amount(contract: ContractRecord): string {
    return `${this.sums.format(contract.amount)} сум`;
  }
}
