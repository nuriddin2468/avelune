import { Component, Directive } from '@angular/core';

/**
 * A search header's actions (ADR 0093): the page's main action and at most one more, at the end of the heading's
 * row, 8px apart; on a narrow page they wrap under the heading, the primary last.
 *
 * ```html
 * <div aveSearchHeaderActions>
 *   <button aveButton type="button">Выгрузить в Excel</button>
 *   <a aveButton variant="primary" routerLink="/contracts/new">Новый договор</a>
 * </div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveSearchHeaderActions]',
  template: '<ng-content />',
  styleUrl: './actions.css',
})
export class AveSearchHeaderActions {}

/**
 * Marks the application's search input, which the search header places across its second row, inside the search
 * landmark (ADR 0093). The application binds its value.
 *
 * ```html
 * <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" (input)="search($event)" />
 * ```
 *
 * @alpha
 */
@Directive({ selector: 'input[aveSearchHeaderSearch]' })
export class AveSearchHeaderSearch {}
