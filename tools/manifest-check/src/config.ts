// What the manifest need not hold, each with its reason (ADR 0090, 0101). Adding one needs an ADR.

/** Entry points whose exports are the kit's own plumbing. */
export const exempt: ReadonlyMap<string, string> = new Map([
  ['forms', 'the plumbing of the kit’s own controls (ADR 0039, 0052): an application binds the controls, never these'],
  ['overlay', 'what the kit’s overlays share (ADR 0046, 0064, 0066): an application uses the overlays, never these'],
]);

/** Exports that one of the kit's entry points gives another, and an application never uses (ADR 0101). */
export const exemptExports: ReadonlyMap<string, string> = new Map([
  ['aveStatusIcon', 'alert gives it to the toast region (ADR 0068)'],
  ['aveStatusIcons', 'alert gives it to the toast region (ADR 0068)'],
  ['aveStatusLabel', 'alert gives it to the toast region (ADR 0068)'],
  ['aveStatusRole', 'alert gives it to the toast region (ADR 0068)'],
  ['AVE_TAG_FIELD', 'tag gives it to the multiselect, whose chosen values are tags (ADR 0081)'],
  ['AVE_FILTER_PANEL_LAYOUT', 'filter-panel gives it to the list page, which lays out the panel (ADR 0095)'],
  ['AveFilterPanelLayout', 'filter-panel gives it to the list page, which lays out the panel (ADR 0095)'],
  ['AveModal', 'the shared behaviour of the dialogs, exported because their classes implement it (ADR 0066)'],
  ['aveDelayedSpinner', 'theme gives it to Spinner, Button and the select family’s lists (ADR 0056, 0058)'],
  ['aveDurationToken', 'theme gives it to the tooltip, the toast region and the delayed spinner (ADR 0056, 0063)'],
]);
