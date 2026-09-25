import { aveFileSize, aveNumberFormat } from '@avelune/ui/i18n';
import { describe, expect, it } from 'vitest';

describe('aveNumberFormat', () => {
  it.each([
    ['uz-Latn', '1\u00a0234\u00a0567,8', '15%'],
    ['uz', '1\u00a0234\u00a0567,8', '15%'],
    ['uz-Cyrl', '1\u00a0234\u00a0567,8', '15%'],
    ['ru', '1\u00a0234\u00a0567,8', '15\u00a0%'],
    ['en-US', '1,234,567.8', '15%'],
  ])('writes %s numbers and percentages', (locale, number, percent) => {
    expect(aveNumberFormat(locale, { maximumFractionDigits: 1 }).format(1234567.84)).toBe(number);
    expect(aveNumberFormat(locale, { style: 'percent' }).format(0.15)).toBe(percent);
  });

  it('keeps the locale for other styles', () => {
    expect(aveNumberFormat('uz-Latn', { style: 'unit', unit: 'kilometer' }).resolvedOptions().locale).toMatch(/^uz/);
    expect(aveNumberFormat('uz-Latn', { style: 'unit', unit: 'kilometer' }).resolvedOptions().locale).not.toBe(
      'uz-Cyrl',
    );
  });
});

describe('aveFileSize', () => {
  it.each([
    [512, 'ru', '512\u00a0Б'],
    [2.4 * 1024 * 1024, 'ru', '2,4\u00a0МБ'],
    [2.4 * 1024 * 1024, 'uz-Latn', '2,4\u00a0MB'],
    [2.4 * 1024 * 1024, 'uz-Cyrl', '2,4\u00a0МБ'],
    [2.4 * 1024 * 1024, 'en-US', '2.4\u00a0MB'],
    [20 * 1024 * 1024, 'ru', '20\u00a0МБ'],
    [340 * 1024, 'en', '340\u00a0kB'],
    [3 * 1024 ** 4, 'en', '3,072\u00a0GB'],
    [-1, 'en', '0\u00a0B'],
  ])('writes %d bytes in %s as %s', (bytes, locale, text) => {
    expect(aveFileSize(bytes, locale)).toBe(text);
  });
});
