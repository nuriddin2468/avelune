import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveCount } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveCard, AveCardEnd, AveCardTitle } from '@avelune/ui/card';
import { AveDashboard, AveDashboardActions, AveDashboardMetric, AveDashboardWide } from '@avelune/ui/dashboard';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { AveLink } from '@avelune/ui/link';
import { contractStatuses, contracts, type ContractRecord, type ContractStatus } from './data';

const withStatus = (status: ContractStatus) => contracts.filter((contract) => contract.status === status);

/**
 * The department's overview, the showcase's home page, on the kit's dashboard (ADR 0098): the register in four key
 * figures, then the contracts that wait for someone, each a link to its page, and the ones signed last.
 */
@Component({
  selector: 'ave-showcase-overview',
  imports: [
    AveButton,
    AveCard,
    AveCardEnd,
    AveCardTitle,
    AveCount,
    AveDashboard,
    AveDashboardActions,
    AveDashboardMetric,
    AveDashboardWide,
    AveLink,
    RouterLink,
  ],
  template: `
    <ave-dashboard
      heading="Обзор"
      description="Договоры юридического департамента на сегодня"
      metricsLabel="Договоры в цифрах"
      lang="ru"
    >
      <div aveDashboardActions>
        <a aveButton routerLink="/contracts">Реестр договоров</a>
        <a aveButton variant="primary" routerLink="/contracts/new">Новый договор</a>
      </div>
      @for (figure of figures; track figure.label) {
        <ave-dashboard-metric [label]="figure.label" [value]="figure.value" [note]="figure.note" />
      }
      @for (group of groups; track group.title) {
        <ave-card role="region" [attr.aria-labelledby]="group.id">
          <h2 aveCardTitle [id]="group.id">{{ group.title }}</h2>
          <ave-count aveCardEnd [value]="group.rows.length" />
          @if (group.rows.length > 0) {
            <ul class="records">
              @for (contract of group.rows; track contract.id) {
                <li>
                  <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.number }}</a>
                  <span class="subject">{{ contract.subject }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="none">{{ group.none }}</p>
          }
        </ave-card>
      }
      <div aveDashboardWide>
        <ave-card role="region" aria-labelledby="recently-signed">
          <h2 aveCardTitle id="recently-signed">Подписаны недавно</h2>
          <ul class="records">
            @for (contract of recent; track contract.id) {
              <li class="signed">
                <span>
                  <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.number }}</a>
                  <span class="subject">{{ contract.subject }} · {{ contract.counterparty }}</span>
                </span>
                <span class="when">{{ signedOn(contract) }}</span>
              </li>
            }
          </ul>
        </ave-card>
      </div>
    </ave-dashboard>
  `,
  styleUrl: './overview.css',
})
export class OverviewPage {
  private readonly dates = aveDateFormat('ru');

  /** The register in four figures: what is in force, and what waits for someone. */
  protected readonly figures = (() => {
    const signed = withStatus('signed');
    const total = signed.reduce((sum, contract) => sum + contract.amount, 0);
    const compact = aveNumberFormat('ru', { notation: 'compact', maximumFractionDigits: 1 });
    return [
      { label: 'Действующие', value: String(signed.length), note: `на ${compact.format(total)} сум` },
      { label: contractStatuses.approval, value: String(withStatus('approval').length), note: 'ждут согласующих' },
      { label: 'Черновики', value: String(withStatus('draft').length), note: 'ещё не отправлены' },
      { label: 'Истекли', value: String(withStatus('expired').length), note: 'продлите или закройте' },
    ];
  })();

  /** The contracts that wait for someone, a card a status. */
  protected readonly groups = (
    [
      { status: 'approval', title: 'Ждут согласования', none: 'Все договоры согласованы.' },
      { status: 'draft', title: 'Черновики', none: 'Черновиков нет.' },
      { status: 'expired', title: 'Истекли', none: 'Истёкших договоров нет.' },
    ] as const
  ).map((group) => ({ ...group, id: `group-${group.status}`, rows: withStatus(group.status) }));

  /** The five contracts signed last. */
  protected readonly recent = [...contracts]
    .filter((contract) => contract.signedOn !== null)
    .sort((a, b) => (b.signedOn ?? '').localeCompare(a.signedOn ?? ''))
    .slice(0, 5);

  protected signedOn(contract: ContractRecord): string {
    return contract.signedOn === null ? '' : this.dates.numeric(contract.signedOn);
  }
}
