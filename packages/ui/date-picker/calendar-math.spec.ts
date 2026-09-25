import { describe, expect, it } from 'vitest';
import { addDays, addMonths, monthOf, today, weekday, weeksOf, within } from './calendar-math';

describe('calendar math', () => {
  it('moves by days and months across their ends, keeping the day where the month allows', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-15', -14)).toBe('2025-01-15');
    expect(() => addDays('someday', 1)).toThrow('Not an ISO calendar date: "someday"');
  });

  it('lays a month out in weeks from Monday or Sunday, with the days of other months left empty', () => {
    const monday = weeksOf({ year: 2026, month: 9 }, 1);
    expect(monday[0]).toEqual([
      null,
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(monday.at(-1)?.at(-1)).toBeNull();
    const sunday = weeksOf({ year: 2026, month: 2 }, 7);
    expect(sunday).toHaveLength(4);
    expect(sunday[0]?.[0]).toBe('2026-02-01');
    expect(weekday('2026-09-27')).toBe(7);
  });

  it('knows the month of a date, today, and the bounds', () => {
    expect(monthOf('2026-09-23')).toEqual({ year: 2026, month: 9 });
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(within('2026-09-23', null, null)).toBe(true);
    expect(within('2026-09-23', '2026-09-24', null)).toBe(false);
    expect(within('2026-09-23', null, '2026-09-22')).toBe(false);
  });
});
