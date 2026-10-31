import { escapeSqlString, formatDisplayDate, formatMonthKey, monthsAround } from '@/lib/date';
import { parseDailyNoteRows } from '@/lib/daily-note-rows';
import type { BlockRow, DailyNote, Notebook } from '@/types/domain';
import * as api from '@/api/api';

/**
 * A notebook enriched with the lookups needed by the calendar. Daily-note
 * creation itself is delegated to SiYuan's native daily-note API.
 */
export class CalendarNotebook implements Notebook {
  constructor(
    public id: string,
    public name: string
  ) {}

  async searchDailyNote(condition: string) {
    return (
      (await api.sql(
        `SELECT * FROM blocks WHERE type = 'd' AND box = '${escapeSqlString(this.id)}' AND ${condition}`
      )) ?? []
    );
  }

  /**
   * Load daily notes for the previous, current and next month. This keeps the
   * outside days of the calendar grid highlighted just like in-month days.
   */
  async getExistDailyNotesAround(date: Date, radius = 1): Promise<DailyNote[]> {
    const conditions = monthsAround(date, radius).map(
      (month) => `a.name LIKE 'custom-dailynote-${formatMonthKey(month)}__'`
    );
    const rows = await this.searchDailyNote(
      `id IN (SELECT block_id FROM attributes AS a WHERE ${conditions.join(' OR ')})`
    );
    return this.withOpenTaskStatus(parseDailyNoteRows(rows));
  }

  /**
   * SiYuan stores task list items as `type=i, subtype=t` blocks. A checked
   * task has `[X]` in its markdown, so `[ ]` identifies open tasks.
   */
  private async withOpenTaskStatus(notes: DailyNote[]): Promise<DailyNote[]> {
    if (notes.length === 0) {
      return notes;
    }
    const ids = notes.map((note) => `'${escapeSqlString(note.id)}'`).join(',');
    const rows = await api.sql<BlockRow>(
      `SELECT DISTINCT root_id FROM blocks WHERE type = 'i' AND subtype = 't' AND markdown LIKE '%[ ]%' AND root_id IN (${ids})`
    );
    const openRootIds = new Set((rows ?? []).map((row) => row.root_id));
    return notes.map((note) => (openRootIds.has(note.id) ? { ...note, hasOpenTasks: true } : note));
  }

  async createDailyNote(date: Date): Promise<DailyNote> {
    const dateStr = formatDisplayDate(date);
    const id = await api.createDailyNote(this.id, dateStr);
    return { id, dateStr };
  }
}
