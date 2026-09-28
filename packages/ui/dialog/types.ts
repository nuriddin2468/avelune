/**
 * The width of a dialog: at most `sm` 480px, `md` 640px (default) or `lg` 960px, and never wider than the viewport
 * less its margins.
 *
 * @alpha
 */
export type AveDialogSize = 'sm' | 'md' | 'lg';

/**
 * The confirming button of a confirmation: `danger` (default) for an action that destroys or cannot be undone,
 * `primary` for one that can.
 *
 * @alpha
 */
export type AveConfirmVariant = 'danger' | 'primary';

/**
 * The edge a drawer slides in from: `end` (default), the inline end, or `start`.
 *
 * @alpha
 */
export type AveDrawerSide = 'end' | 'start';

/**
 * The width of a drawer: at most `sm` 320px, `md` 480px (default) or `lg` 640px, and never wider than the viewport.
 *
 * @alpha
 */
export type AveDrawerSize = 'sm' | 'md' | 'lg';
