import { aveMessagesRu } from '@avelune/ui/i18n';
import { describe, expect, it } from 'vitest';
import { isChosen, presetPeriod, showPreset } from './presets';
import type { AveDateRangePresetName } from './types';

/** Thursday, 24 September 2026. */
const today = '2026-09-24';

describe('presetPeriod', () => {
  it.each<[AveDateRangePresetName, string, string]>([
    ['today', '2026-09-24', '2026-09-24'],
    ['yesterday', '2026-09-23', '2026-09-23'],
    ['thisWeek', '2026-09-21', '2026-09-27'],
    ['lastWeek', '2026-09-14', '2026-09-20'],
    ['thisMonth', '2026-09-01', '2026-09-30'],
    ['lastMonth', '2026-08-01', '2026-08-31'],
    ['thisQuarter', '2026-07-01', '2026-09-30'],
    ['thisYear', '2026-01-01', '2026-12-31'],
    ['last7Days', '2026-09-18', '2026-09-24'],
    ['last30Days', '2026-08-26', '2026-09-24'],
  ])('makes %s whole, weeks from Monday', (name, start, end) => {
    expect(presetPeriod(name, today, 1)).toEqual({ start, end });
  });

  it('starts weeks on the locale first day, and crosses years at their edges', () => {
    expect(presetPeriod('thisWeek', today, 7)).toEqual({ start: '2026-09-20', end: '2026-09-26' });
    expect(presetPeriod('thisWeek', '2026-09-20', 1)).toEqual({ start: '2026-09-14', end: '2026-09-20' });
    expect(presetPeriod('lastMonth', '2026-01-15', 1)).toEqual({ start: '2025-12-01', end: '2025-12-31' });
    expect(presetPeriod('thisQuarter', '2026-01-01', 1)).toEqual({ start: '2026-01-01', end: '2026-03-31' });
    expect(presetPeriod('thisQuarter', '2026-12-31', 1)).toEqual({ start: '2026-10-01', end: '2026-12-31' });
    expect(presetPeriod('lastMonth', '2024-03-31', 1)).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });
});

describe('showPreset', () => {
  const context = { today, firstDayOfWeek: 1, messages: aveMessagesRu, min: '2026-09-10', max: '2026-12-31' };

  it('names the kit presets in the locale, cuts them to the bounds, and has none outside them', () => {
    expect(showPreset('thisMonth', context)).toEqual({
      label: 'Этот месяц',
      range: { start: '2026-09-10', end: '2026-09-30' },
    });
    expect(showPreset('lastMonth', context)).toEqual({ label: 'Прошлый месяц', range: null });
    expect(showPreset({ label: 'Второе полугодие', start: '2026-07-01', end: '2027-06-30' }, context)).toEqual({
      label: 'Второе полугодие',
      range: { start: '2026-09-10', end: '2026-12-31' },
    });
    expect(showPreset('today', { ...context, min: null, max: null }).range).toEqual({ start: today, end: today });
  });

  it('says whether a preset is the range chosen now', () => {
    const shown = showPreset('thisWeek', { ...context, min: null });
    expect(isChosen(shown, { start: '2026-09-21', end: '2026-09-27' })).toBe(true);
    expect(isChosen(shown, { start: '2026-09-21', end: null })).toBe(false);
    expect(isChosen(shown, null)).toBe(false);
    expect(isChosen({ label: 'Прошлый месяц', range: null }, null)).toBe(false);
  });
});
