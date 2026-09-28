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

/**
 * The date range presets the kit names itself, in the application's language (ADR 0054). Periods are whole, from
 * today in the browser's time zone: a week from the locale's first day, a month, a quarter (from January, April, July,
 * October) or a year; the last 7 and 30 days end today.
 *
 * @alpha
 */
export type AveDateRangePresetName =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'last7Days'
  | 'last30Days';

/**
 * A date range preset of the application's own: its label and its dates.
 *
 * @alpha
 */
export interface AveDateRangeCustomPreset {
  /** What the preset says, in the application's language ("Первое полугодие"). */
  readonly label: string;
  /** The first date of the period, as an ISO date. */
  readonly start: AvePlainDate;
  /** The last date of the period, never before the first. */
  readonly end: AvePlainDate;
}

/**
 * A preset of a date range field: one the kit names, or one of the application's own.
 *
 * @alpha
 */
export type AveDateRangePreset = AveDateRangePresetName | AveDateRangeCustomPreset;
