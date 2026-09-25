import type { AvePlainDate } from '@avelune/ui/i18n';

/**
 * The sizes of a date field: the control sizes shared with every control (`control.height.*`), `sm` 32px, `md`
 * 36px, `lg` 40px, one step smaller in compact density.
 *
 * @alpha
 */
export type AveDatePickerSize = 'sm' | 'md' | 'lg';

/**
 * The value of a date range field: its first and last date, either of which may still be missing. The field's value
 * is `null` while both are.
 *
 * @alpha
 */
export interface AveDateRange {
  /** The first date of the range. */
  readonly start: AvePlainDate | null;
  /** The last date of the range, never before the first. */
  readonly end: AvePlainDate | null;
}
