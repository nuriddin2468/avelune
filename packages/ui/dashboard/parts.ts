import { Component, input } from '@angular/core';

/**
 * A key figure of a dashboard (ADR 0098): what it counts, the number in the application's words and format, and what
 * it means. It sits on a card's surface, with no interaction of its own.
 *
 * ```html
 * <ave-dashboard-metric label="Истекают в этом месяце" value="3" note="до 31 октября" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-dashboard-metric',
  host: { role: 'listitem' },
  template: `
    <span class="label">{{ label() }}</span>
    <span class="value">{{ value() }}</span>
    @if (note(); as note) {
      <span class="note">{{ note }}</span>
    }
  `,
  styleUrl: './metric.css',
})
export class AveDashboardMetric {
  /** What the figure counts: "На согласовании". */
  readonly label = input.required<string>();

  /** The figure, as the application writes it for the locale: "34", "1,2 млрд сум". */
  readonly value = input.required<string>();

  /** What the figure means, under it: "+3 за месяц", "до 31 октября". None by default. */
  readonly note = input('');
}

/**
 * Marks the application's element around a dashboard card that needs room (ADR 0098), such as a list with many
 * columns: it spans two columns from `container.md`.
 *
 * ```html
 * <div aveDashboardWide><ave-card>…</ave-card></div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveDashboardWide]',
  template: '<ng-content />',
  styleUrl: './wide.css',
})
export class AveDashboardWide {}

/**
 * A dashboard's actions at the end of its heading's row (ADR 0098): a period, "Настроить". They wrap under the
 * heading on a narrow page.
 *
 * ```html
 * <div aveDashboardActions><ave-select [options]="periods" [(value)]="period" /></div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveDashboardActions]',
  template: '<ng-content />',
  styleUrl: './actions.css',
})
export class AveDashboardActions {}
