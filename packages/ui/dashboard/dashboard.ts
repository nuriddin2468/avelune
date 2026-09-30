import { Component, input } from '@angular/core';

/**
 * A work system's overview (brief §9.4, ADR 0091, 0098): the page's heading and its actions, a row of key figures,
 * and the application's cards in one column, two from `container.md` and three from `container.lg`.
 *
 * ```html
 * <ave-dashboard heading="Обзор" description="Договоры отдела на сегодня">
 *   <ave-dashboard-metric label="На согласовании" value="5" note="2 ждут вас" />
 *   <ave-card>…</ave-card>
 *   <div aveDashboardWide><ave-card>…</ave-card></div>
 * </ave-dashboard>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-dashboard',
  template: `
    <div class="header">
      <div class="title">
        <h1 class="heading">{{ heading() }}</h1>
        @if (description(); as description) {
          <p class="description">{{ description }}</p>
        }
      </div>
      <ng-content select="[aveDashboardActions]" />
    </div>
    <div class="metrics" role="list" [attr.aria-label]="metricsLabel() ?? null">
      <ng-content select="ave-dashboard-metric" />
    </div>
    <div class="tiles"><ng-content /></div>
  `,
  styleUrl: './dashboard.css',
})
export class AveDashboard {
  /** The page's heading, its `h1`: "Обзор". */
  readonly heading = input.required<string>();

  /** What the page sums up, muted under the heading; none by default. */
  readonly description = input('');

  /** Names the list of key figures: "Договоры в цифрах". None by default. */
  readonly metricsLabel = input<string>();
}
