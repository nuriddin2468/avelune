/**
 * What a toast is about: `info` (default), `success`, `warning` or `danger`, each with its icon.
 *
 * @beta
 */
export type AveToastVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * The one action a toast may offer, such as Undo: its words and what it does. Choosing it closes the toast.
 *
 * @beta
 */
export interface AveToastAction {
  /** The words: a verb ("Отменить"). */
  readonly label: string;
  /** What choosing it does. */
  readonly run: () => void;
}

/**
 * A toast to show (ADR 0068).
 *
 * @beta
 */
export interface AveToastOptions {
  /** What happened, in one sentence ("Договор удалён"). */
  readonly message: string;
  /** What the toast is about: `info` (default), `success`, `warning` or `danger`. */
  readonly variant?: AveToastVariant;
  /** One action, such as Undo. */
  readonly action?: AveToastAction;
}

/**
 * A toast that was shown, or waits its turn.
 *
 * @beta
 */
export interface AveToastRef {
  /** Closes the toast, or takes it out of the queue. */
  dismiss(): void;
}

/** A toast as the toaster keeps it; internal to the entry point. */
export interface Toast {
  /** Its number, unique in the application, which ties it to its reference. */
  readonly id: number;
  /** What happened. */
  readonly message: string;
  /** What it is about. */
  readonly variant: AveToastVariant;
  /** Its action, if any. */
  readonly action: AveToastAction | undefined;
}
