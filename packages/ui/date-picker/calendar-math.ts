import { plainDateParts, toPlainDate, type AvePlainDate } from '@avelune/ui/i18n';

/** A month as a calendar shows it. */
export interface CalendarMonth {
  /** The year. */
  readonly year: number;
  /** The month, 1–12. */
  readonly month: number;
}

function parts(date: AvePlainDate): { year: number; month: number; day: number } {
  const value = plainDateParts(date);
  if (value === null) throw new Error(`Not an ISO calendar date: "${date}"`);
  return value;
}

/** The date a number of days away. */
export function addDays(date: AvePlainDate, days: number): AvePlainDate {
  const { year, month, day } = parts(date);
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  return toPlainDate(moved.getUTCFullYear(), moved.getUTCMonth() + 1, moved.getUTCDate());
}

/** The same day a number of months away, or the month's last day when it is shorter. */
export function addMonths(date: AvePlainDate, months: number): AvePlainDate {
  const { year, month, day } = parts(date);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return toPlainDate(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(day, last));
}

/** The month a date is in. */
export function monthOf(date: AvePlainDate): CalendarMonth {
  const { year, month } = parts(date);
  return { year, month };
}

/** Today in the browser's time zone. */
export function today(): AvePlainDate {
  const now = new Date();
  return toPlainDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** The day of the week, 1 Monday … 7 Sunday. */
export function weekday(date: AvePlainDate): number {
  const { year, month, day } = parts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
}

/** The weeks of a month, from the locale's first day of the week; days of other months are null. */
export function weeksOf(view: CalendarMonth, firstDay: number): (AvePlainDate | null)[][] {
  const first = toPlainDate(view.year, view.month, 1);
  const days = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate();
  const lead = (weekday(first) - firstDay + 7) % 7;
  const cells: (AvePlainDate | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, index) => toPlainDate(view.year, view.month, index + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (AvePlainDate | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

/** Whether a date lies within the bounds; a missing bound does not limit. */
export function within(date: AvePlainDate, min: AvePlainDate | null, max: AvePlainDate | null): boolean {
  return (min === null || date >= min) && (max === null || date <= max);
}
