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
