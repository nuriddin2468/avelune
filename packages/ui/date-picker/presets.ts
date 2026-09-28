import { toPlainDate, type AveMessages, type AvePlainDate } from '@avelune/ui/i18n';
import { addDays, addMonths, daysIn, monthOf, weekday } from './calendar-math';
import type { AveDateRange, AveDateRangePreset, AveDateRangePresetName } from './types';

/** A preset as the list shows it: its label and its period within the bounds, or `null` when none of it is. */
export interface ShownPreset {
  /** What the list says: the kit's message, or the application's label. */
  readonly label: string;
  /** The period within the bounds, or `null` when no day of it is inside them. */
  readonly range: { readonly start: AvePlainDate; readonly end: AvePlainDate } | null;
}

/** The message that names each built-in preset (ADR 0054). */
const names = {
  today: 'rangeToday',
  yesterday: 'rangeYesterday',
  thisWeek: 'rangeThisWeek',
  lastWeek: 'rangeLastWeek',
  thisMonth: 'rangeThisMonth',
  lastMonth: 'rangeLastMonth',
  thisQuarter: 'rangeThisQuarter',
  thisYear: 'rangeThisYear',
  last7Days: 'rangeLast7Days',
  last30Days: 'rangeLast30Days',
} as const satisfies Readonly<Record<AveDateRangePresetName, keyof AveMessages>>;

/** A month from its first to its last day. */
function wholeMonths(year: number, first: number, last: number): { start: AvePlainDate; end: AvePlainDate } {
  return { start: toPlainDate(year, first, 1), end: toPlainDate(year, last, daysIn(year, last)) };
}

/**
 * The period of a built-in preset, whole, from today: a week from the locale's first day (1 Monday … 7 Sunday), a
 * month, a quarter or a year; the last 7 and 30 days end today.
 */
export function presetPeriod(
  name: AveDateRangePresetName,
  today: AvePlainDate,
  firstDayOfWeek: number,
): { start: AvePlainDate; end: AvePlainDate } {
  const { year, month } = monthOf(today);
  const weekStart = addDays(today, -((weekday(today) - firstDayOfWeek + 7) % 7));
  const previous = monthOf(addMonths(toPlainDate(year, month, 1), -1));
  const quarter = Math.floor((month - 1) / 3) * 3 + 1;
  const periods: Readonly<Record<AveDateRangePresetName, () => { start: AvePlainDate; end: AvePlainDate }>> = {
    today: () => ({ start: today, end: today }),
    yesterday: () => ({ start: addDays(today, -1), end: addDays(today, -1) }),
    thisWeek: () => ({ start: weekStart, end: addDays(weekStart, 6) }),
    lastWeek: () => ({ start: addDays(weekStart, -7), end: addDays(weekStart, -1) }),
    thisMonth: () => wholeMonths(year, month, month),
    lastMonth: () => wholeMonths(previous.year, previous.month, previous.month),
    thisQuarter: () => wholeMonths(year, quarter, quarter + 2),
    thisYear: () => wholeMonths(year, 1, 12),
    last7Days: () => ({ start: addDays(today, -6), end: today }),
    last30Days: () => ({ start: addDays(today, -29), end: today }),
  };
  return periods[name]();
}

/** A preset's label and period, cut to the bounds; `null` when no day of it is inside them. */
export function showPreset(
  preset: AveDateRangePreset,
  context: {
    readonly today: AvePlainDate;
    readonly firstDayOfWeek: number;
    readonly messages: AveMessages;
    readonly min: AvePlainDate | null;
    readonly max: AvePlainDate | null;
  },
): ShownPreset {
  const { label, start, end } =
    typeof preset === 'string'
      ? { label: context.messages[names[preset]], ...presetPeriod(preset, context.today, context.firstDayOfWeek) }
      : preset;
  const { min, max } = context;
  const from = min !== null && start < min ? min : start;
  const to = max !== null && end > max ? max : end;
  return { label, range: from <= to ? { start: from, end: to } : null };
}

/** Whether a preset's period is the range chosen now. */
export function isChosen(preset: ShownPreset, value: AveDateRange | null): boolean {
  return preset.range !== null && preset.range.start === value?.start && preset.range.end === value.end;
}
