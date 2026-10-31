import type { BlockRow, DailyNote } from '@/types/domain';
import { formatDisplayDate, parseDateKey } from './date';

export function parseDailyNoteRows(rows: BlockRow[] | null | undefined): DailyNote[] {
  const result: DailyNote[] = [];
  for (const row of rows ?? []) {
    const match = row.ial?.match(/custom-dailynote-(\d{8})/);
    if (!match) {
      continue;
    }
    const date = parseDateKey(match[1]);
    if (!date) {
      continue;
    }
    result.push({ id: row.id, dateStr: formatDisplayDate(date) });
  }
  return result;
}
