import {
  escapeSqlString,
  formatDateKey,
  formatDisplayDate,
  formatMonthKey,
  monthsAround,
  parseDateKey,
} from '@/lib/date';
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

  /**
   * Older/manual documents can look exactly like a daily note (date title and
   * matching path) without the `custom-dailynote-*` attribute. Find those
   * documents during an explicit refresh and add the missing attributes.
   */
  async reconcileDailyNoteAttrs(start: Date, end: Date): Promise<number> {
    const rows = await this.searchDailyNote(`ial LIKE '%title="____-__-__"%' AND ial NOT LIKE '%custom-dailynote-%'`);
    const startKey = formatDateKey(start);
    const endKey = formatDateKey(end);
    const candidates: Array<{ id: string; title: string; dateKey: string; hPath: string }> = [];

    for (const row of rows) {
      if (row.ial?.includes('custom-dailynote-')) {
        continue;
      }
      const match = row.ial?.match(/title="(\d{4})-(\d{2})-(\d{2})"/);
      if (!match) {
        continue;
      }
      const title = `${match[1]}-${match[2]}-${match[3]}`;
      const dateKey = `${match[1]}${match[2]}${match[3]}`;
      const date = parseDateKey(dateKey);
      if (!date || dateKey < startKey || dateKey > endKey) {
        continue;
      }
      const hPath = row.hpath;
      if (!hPath?.endsWith(`/${title}`)) {
        continue;
      }
      candidates.push({ id: row.id, title, dateKey, hPath });
    }

    // A date-shaped title is not enough: the candidate must be the exact
    // document the kernel resolves as this notebook's daily note.
    const validated = await Promise.all(
      candidates.map(async (candidate) => {
        const info = await api.getDailyNoteInfo(this.id, candidate.title);
        return info?.existed && info.id === candidate.id && info.hPath === candidate.hPath ? candidate : null;
      })
    );
    const updates = validated
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .map((candidate) => ({
        id: candidate.id,
        attrs: { [`custom-dailynote-${candidate.dateKey}`]: candidate.dateKey },
      }));

    if (updates.length === 0) {
      return 0;
    }
    await api.batchSetBlockAttrs(updates);
    await api.flushTransaction();
    return updates.length;
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

    const [nonDailyRows, dailyRows] = await Promise.all([
      api.sql<BlockRow & { date_key: string; block_count: number }>(nonDailySql),
      api.sql<BlockRow & { block_count: number }>(
        `SELECT root_id, COUNT(*) AS block_count FROM blocks WHERE ${dailyIdsCondition} AND type != 'd' GROUP BY root_id`
      ),
    ]);

    const dailyBlockCounts = new Map((dailyRows ?? []).map((row) => [row.root_id, Number(row.block_count)]));
    const result = new Map<string, DayActivity>();

    // Daily-note blocks always belong to the note's diary date, even if a block
    // was created later than the day it belongs to.
    for (const note of notes) {
      result.set(note.dateStr, {
        id: note.id,
        dateStr: note.dateStr,
        blocks: dailyBlockCounts.get(note.id) ?? 0,
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
      });
    }

    return result;
  }
}
