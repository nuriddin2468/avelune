import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

/**
 * A filter panel as the page around it sees it: whether its column is shown.
 *
 * @alpha
 */
export interface AveFilterPanelState {
  /** Whether the filters are shown. */
  readonly open: Signal<boolean>;
  /** Whether they open in a drawer rather than a column. */
  readonly modal: Signal<boolean>;
}

/**
 * A page that lays out a filter panel's column (ADR 0094, 0095): the List page provides it, and the panel inside says
 * it is there for as long as it lives, so the page gives its column room while it is open.
 *
 * @alpha
 */
export interface AveFilterPanelLayout {
  /** The panel the page holds, or `null`. */
  readonly panel: WritableSignal<AveFilterPanelState | null>;
}

/**
 * Provided by a page that lays out a filter panel's column, such as `<ave-list-page>`.
 *
 * @alpha
 */
export const AVE_FILTER_PANEL_LAYOUT = new InjectionToken<AveFilterPanelLayout>('AVE_FILTER_PANEL_LAYOUT');
