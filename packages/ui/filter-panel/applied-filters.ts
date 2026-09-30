import { Component, input, output } from '@angular/core';
import { AveButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveTag } from '@avelune/ui/tag';
import type { AveAppliedFilter } from './types';

/**
 * The filters applied to a list, above it (ADR 0094): each a Tag whose button takes it away, then "Сбросить
 * фильтры". It draws nothing while no filter is applied, and shows them while the filter panel is closed.
 *
 * ```html
 * <ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-applied-filters',
  imports: [AveButton, AveTag],
  host: { '[attr.data-empty]': "filters().length === 0 ? '' : null" },
  template: `
    @if (filters().length > 0) {
      <ul class="list" [attr.aria-label]="label()">
        @for (filter of filters(); track filter.key) {
          <li>
            <ave-tag removable (remove)="remove.emit(filter.key)">{{ filter.label }}</ave-tag>
          </li>
        }
      </ul>
      <button aveButton type="button" variant="ghost" size="sm" (click)="clear.emit()">
        {{ messages.clearFilters }}
      </button>
    }
  `,
  styleUrl: './applied-filters.css',
})
export class AveAppliedFilters {
  protected readonly messages = injectAveMessages();

  /** The applied filters, in order, each with its field and value in words: "Статус: Подписан". */
  readonly filters = input.required<readonly AveAppliedFilter[]>();

  /** Names the list of tags: the kit's "Применённые фильтры" by default. */
  readonly label = input(this.messages.appliedFilters);

  /** Emits a filter's key when the person takes it away with its tag's button. */
  readonly remove = output<string>();

  /** Emits when the person presses "Сбросить фильтры": take every filter away. */
  readonly clear = output();
}
