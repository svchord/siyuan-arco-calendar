import { addMonths, format, isValid, parse, startOfMonth } from 'date-fns';

export const DATE_KEY_FORMAT = 'yyyyMMdd';
export const MONTH_KEY_FORMAT = 'yyyyMM';
export const DISPLAY_DATE_FORMAT = 'yyyy-MM-dd';

export function formatDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT);
}

export function formatMonthKey(date: Date): string {
  return format(date, MONTH_KEY_FORMAT);
}

export function formatDisplayDate(date: Date): string {
  return format(date, DISPLAY_DATE_FORMAT);
}

export function parseDateKey(dateKey: string): Date | undefined {
  if (!/^\d{8}$/.test(dateKey)) {
    return undefined;
  }
  const date = parse(dateKey, DATE_KEY_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

/**
 * The calendar grid can show days from the previous and the next month, so
 * existing daily notes are loaded for a small window around the visible month.
 */
export function monthsAround(month: Date, radius = 1): Date[] {
  const firstDay = startOfMonth(month);
  return Array.from({ length: radius * 2 + 1 }, (_, index) => addMonths(firstDay, index - radius));
}

export function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}
