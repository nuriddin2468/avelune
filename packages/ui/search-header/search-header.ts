import { Component, input } from '@angular/core';
import { lucideListFilter } from '@avelune/icons/lucide';
import { AveCount } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import type { AveSearchFilters } from './types';

/**
 * The header of a list page (brief §9.4, ADR 0091, 0093): the page's heading, the count of its records and its main
 * action on the first row; the search across the second, with the button that shows and hides its filters.
 *
 * ```html
 * <ave-search-header heading="Договоры" [summary]="summary()" searchLabel="Поиск договоров" [filters]="filters">
 *   <div aveSearchHeaderActions><a aveButton variant="primary" routerLink="/contracts/new">Новый договор</a></div>
 *   <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" (input)="search($event)" />
 * </ave-search-header>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-search-header',
  imports: [AveButton, AveCount, AveIcon],
  providers: [provideAveIcons([lucideListFilter])],
  template: `
    <div class="head">
      <div class="title">
        <h1 class="heading">{{ heading() }}</h1>
        <p class="summary" role="status">{{ summary() }}</p>
      </div>
      <ng-content select="[aveSearchHeaderActions]" />
    </div>
    <search class="search" [attr.aria-label]="searchLabel() ?? null">
      <ng-content select="[aveSearchHeaderSearch]" />
      @if (filters(); as filters) {
        <button
          aveButton
          type="button"
          [attr.aria-expanded]="filters.modal() ? null : filters.open()"
          [attr.aria-controls]="filters.modal() ? null : filters.id"
          [attr.aria-haspopup]="filters.modal() ? 'dialog' : null"
          (click)="filters.toggle()"
        >
          <ave-icon name="list-filter" decorative />
          {{ filters.label() }}
          <ave-count [value]="filters.count()" />
        </button>
      }
    </search>
  `,
  styleUrl: './search-header.css',
})
export class AveSearchHeader {
  /** The page's heading, its `h1`: "Договоры". */
  readonly heading = input.required<string>();

  /**
   * The count of the page's records in the application's words, after the heading: "34 договора", "Загрузка
   * договоров…". Screen readers hear it when it changes. None by default.
   */
  readonly summary = input('');

  /** Names the search landmark: "Поиск договоров". Needed when the page has another search. */
  readonly searchLabel = input<string>();

  /** The filters the button at the search's end shows and hides: a FilterPanel (ADR 0094). No button without them. */
  readonly filters = input<AveSearchFilters | null>(null);
}
