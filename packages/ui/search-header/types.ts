import type { Signal } from '@angular/core';

/**
 * The filters a search header's button shows and hides (ADR 0093): a FilterPanel (ADR 0094), or an application's
 * own filters that keep this contract.
 *
 * @alpha
 */
export interface AveSearchFilters {
  /** The id of the element the button shows and hides while the filters open in a column (`aria-controls`). */
  readonly id: string;
  /** The button's words and the filters' name: "Фильтры". */
  readonly label: Signal<string>;
  /** How many filters are applied; the button counts them, and says nothing at 0. */
  readonly count: Signal<number>;
  /** Whether the filters are shown. */
  readonly open: Signal<boolean>;
  /** Whether the filters open in a modal drawer, on a narrow page, rather than in a column beside the list. */
  readonly modal: Signal<boolean>;
  /** Shows the filters, or hides them. */
  toggle(): void;
}
