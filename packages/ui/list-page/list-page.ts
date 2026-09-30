import { Component, Directive, computed, signal } from '@angular/core';
import { AVE_FILTER_PANEL_LAYOUT, type AveFilterPanelLayout, type AveFilterPanelState } from '@avelune/ui/filter-panel';

/**
 * Marks a notice about the whole list, which a list page places under its header (ADR 0095): an alert about some of
 * its records, the progress of an export.
 *
 * ```html
 * <ave-alert aveListPageNotice variant="warning" heading="Есть истёкшие договоры">…</ave-alert>
 * ```
 *
 * @beta
 */
@Directive({ selector: '[aveListPageNotice]' })
export class AveListPageNotice {}

/**
 * A register's page (brief §9.4, ADR 0091, 0095): the search header with the page's heading, the notices about the
 * list, the applied filters over it, the filters' column at its start while the panel is open, and the list, a
 * DataTable or a List, as the rest of its content. It takes the width its parent gives it.
 *
 * ```html
 * <ave-list-page>
 *   <ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">…</ave-search-header>
 *   <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
 *   <ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">…</ave-filter-panel>
 *   <ave-data-table label="Договоры подразделения" [rows]="rows()" [columns]="columns" [rowKey]="byId" />
 * </ave-list-page>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-list-page',
  providers: [{ provide: AVE_FILTER_PANEL_LAYOUT, useExisting: AveListPage }],
  template: `
    <ng-content select="ave-search-header" />
    <ng-content select="[aveListPageNotice]" />
    <div class="list">
      <ng-content select="ave-applied-filters" />
      <div class="body" [attr.data-filters]="column() ? 'open' : null">
        <ng-content select="ave-filter-panel" />
        <div class="content"><ng-content /></div>
      </div>
    </div>
  `,
  styleUrl: './list-page.css',
})
export class AveListPage implements AveFilterPanelLayout {
  /** @internal The filter panel inside, which says it is there (a signal query's arrow would go uncovered). */
  readonly panel = signal<AveFilterPanelState | null>(null);

  /** Whether the filters stand as a column at the list's start: the panel is open, and not a drawer. */
  protected readonly column = computed(() => {
    const panel = this.panel();
    return panel !== null && panel.open() && !panel.modal();
  });
}
