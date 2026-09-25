import { aveDateFormat, plainDateParts, toPlainDate } from '@avelune/ui/i18n';
import { describe, expect, it } from 'vitest';

describe('aveDateFormat', () => {
  it.each([
    ['ru', '23.09.2026', '23 сентября 2026 г.', 'Сентябрь 2026 г.', 'дд.мм.гггг', 1],
    ['en-US', '09/23/2026', 'September 23, 2026', 'September 2026', 'mm/dd/yyyy', 7],
    ['uz-Latn', '23/09/2026', '23-sentabr, 2026', 'Sentabr, 2026', 'kk/oo/yyyy', 1],
    ['uz', '23/09/2026', '23-sentabr, 2026', 'Sentabr, 2026', 'kk/oo/yyyy', 1],
    ['uz-Cyrl', '23/09/2026', '23 сентябр, 2026', 'Сентябр, 2026', 'кк/оо/йййй', 1],
  ])('writes %s dates', (locale, numeric, long, monthYear, placeholder, firstDay) => {
    const format = aveDateFormat(locale);
    expect(format.numeric('2026-09-23')).toBe(numeric);
    expect(format.long('2026-09-23')).toBe(long);
    expect(format.monthYear(2026, 9)).toBe(monthYear);
    expect(format.placeholder).toBe(placeholder);
    expect(format.firstDayOfWeek).toBe(firstDay);
    expect(format.parse(numeric)).toBe('2026-09-23');
  });

  it('writes a locale outside the four in its own words, with the numeric form of the others', () => {
    const german = aveDateFormat('de');
    expect(german.placeholder).toBe('dd/mm/yyyy');
    expect(german.numeric('2026-09-23')).toBe('23/09/2026');
    expect(german.monthYear(2026, 9)).toBe('September 2026');
    expect(german.firstDayOfWeek).toBe(1);
  });

  it('names the weekdays from Sunday, abbreviated with a capital, in Uzbek Latin from its own data', () => {
    expect(aveDateFormat('uz-Latn').weekdays[1]).toEqual({ long: 'dushanba', short: 'Dush' });
    expect(aveDateFormat('ru').weekdays[0]).toEqual({ long: 'воскресенье', short: 'Вс' });
    expect(aveDateFormat('uz-Cyrl').weekdays[1]?.short).toBe('Душ');
    expect(aveDateFormat('en').weekdays.map((day) => day.short)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
  });

  it('reads short years, other separators and spaces, and nothing that is not a real date', () => {
    const ru = aveDateFormat('ru');
    expect(ru.parse(' 1-2-26 ')).toBe('2026-02-01');
    expect(ru.parse('1 2 2026')).toBe('2026-02-01');
    expect(ru.parse('31.02.2026')).toBeNull();
    expect(ru.parse('2026-02-01')).toBeNull();
    expect(ru.parse('')).toBeNull();
    expect(aveDateFormat('en').parse('2/1/2026')).toBe('2026-02-01');
    expect(ru.numeric('2026-13-01')).toBe('');
    expect(aveDateFormat('uz').long('not a date')).toBe('');
    expect(() => ru.long('not a date')).toThrow('Not an ISO calendar date: "not a date"');
  });
});

describe('plain dates', () => {
  it('splits and joins ISO dates, and refuses what is not a real one', () => {
    expect(plainDateParts('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
    expect(plainDateParts('2026-02-29')).toBeNull();
    expect(plainDateParts('2026-9-1')).toBeNull();
    expect(toPlainDate(2026, 9, 1)).toBe('2026-09-01');
  });
});
