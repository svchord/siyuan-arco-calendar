import { escapeSqlString, formatDisplayDate, formatMonthKey, monthsAround, parseDateKey } from '@/lib/date';
import { parseDailyNoteRows } from '@/lib/daily-note-rows';
import type { BlockRow, DailyNote, DayActivity, Notebook } from '@/types/domain';
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

  async getActivity(year: number): Promise<Map<string, DayActivity>> {
    const monthConditions = Array.from(
      { length: 12 },
      (_, index) => `a.name LIKE 'custom-dailynote-${year}${String(index + 1).padStart(2, '0')}__'`
    );
    const rows = await this.searchDailyNote(
      `id IN (SELECT block_id FROM attributes AS a WHERE ${monthConditions.join(' OR ')})`
    );
    const notes = parseDailyNoteRows(rows);
    const ids = notes.map((note) => `'${escapeSqlString(note.id)}'`).join(',');
    const dailyIdsCondition = notes.length > 0 ? `root_id IN (${ids})` : '1 = 0';

    const nonDailySql = `SELECT substr(created, 1, 8) AS date_key, COUNT(*) AS block_count
      FROM blocks
      WHERE box = '${escapeSqlString(this.id)}'
        AND type != 'd'
        AND created >= '${year}0101000000'
        AND created < '${year + 1}0101000000'
        AND root_id NOT IN (SELECT block_id FROM attributes WHERE name LIKE 'custom-dailynote-%')
      GROUP BY date_key`;

    const [nonDailyRows, dailyRows, taskRows] = await Promise.all([
      api.sql<BlockRow & { date_key: string; block_count: number }>(nonDailySql),
      api.sql<BlockRow & { block_count: number }>(
        `SELECT root_id, COUNT(*) AS block_count FROM blocks WHERE ${dailyIdsCondition} AND type != 'd' GROUP BY root_id`
      ),
      api.sql<BlockRow>(
        `SELECT DISTINCT root_id FROM blocks WHERE type = 'i' AND subtype = 't' AND markdown LIKE '%[ ]%' AND ${dailyIdsCondition}`
      ),
    ]);

    const dailyBlockCounts = new Map((dailyRows ?? []).map((row) => [row.root_id, Number(row.block_count)]));
    const openRootIds = new Set((taskRows ?? []).map((row) => row.root_id));
    const result = new Map<string, DayActivity>();

    // Daily-note blocks always belong to the note's diary date, even if a block
    // was created later than the day it belongs to.
    for (const note of notes) {
      result.set(note.dateStr, {
        id: note.id,
        dateStr: note.dateStr,
        blocks: dailyBlockCounts.get(note.id) ?? 0,
        hasOpenTasks: openRootIds.has(note.id),
      });
    }

    // Other notes are attributed to the day each content block was created.
    for (const row of nonDailyRows ?? []) {
      const date = parseDateKey(row.date_key);
      if (!date) {
        continue;
      }
      const dateStr = formatDisplayDate(date);
      const existing = result.get(dateStr);
      result.set(dateStr, {
        dateStr,
        id: existing?.id,
        blocks: (existing?.blocks ?? 0) + Number(row.block_count),
        hasOpenTasks: existing?.hasOpenTasks,
      });
    }

    return result;
  }
}
