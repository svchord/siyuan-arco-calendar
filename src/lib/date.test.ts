import { describe, expect, it } from 'vitest';
import { escapeSqlString, formatDateKey, formatDisplayDate, formatMonthKey, monthsAround, parseDateKey } from './date';

describe('date helpers', () => {
  it('formats date keys using local calendar dates', () => {
    const date = new Date(2026, 9, 30);
    expect(formatDateKey(date)).toBe('20261030');
    expect(formatMonthKey(date)).toBe('202610');
    expect(formatDisplayDate(date)).toBe('2026-10-30');
  });

  it('parses valid date keys and rejects invalid input', () => {
    const parsed = parseDateKey('20261030');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9);
    expect(parsed?.getDate()).toBe(30);
    expect(parseDateKey('2026-10-30')).toBeUndefined();
    expect(parseDateKey('20261399')).toBeUndefined();
  });

  it('builds a three month window around the visible month', () => {
    const months = monthsAround(new Date(2026, 0, 15)).map(formatMonthKey);
    expect(months).toEqual(['202512', '202601', '202602']);
  });

  it('escapes SQL string literals', () => {
    expect(escapeSqlString("O'Brien")).toBe("O''Brien");
  });
});
