import { InjectionToken, type Signal } from '@angular/core';

/** What a list tells its items: whether they come after its first rows, and their place among those that came together. */
export interface AveListContext {
  /** Whether the list has drawn its first rows. */
  readonly ready: Signal<boolean>;
  /** The place of a row that comes among the rows that came with it. */
  order(): number;
}

/** Provided by `<ave-list>` for its items. */
export const AVE_LIST = new InjectionToken<AveListContext>('AVE_LIST');
