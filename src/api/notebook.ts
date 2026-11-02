import { endOfMonth } from 'date-fns';
import { escapeSqlString, formatDateKey, formatDisplayDate, monthsAround, parseDateKey } from '@/lib/date';
import type { BlockRow, DailyNote, DayActivity, Notebook } from '@/types/domain';
import * as api from '@/api/api';

// Heatmap queries group by calendar day, so 366 rows are enough for a year.
const ACTIVITY_DAY_LIMIT = 500;
// Reconcile scans a small window of date-titled documents, not every block.
const RECONCILE_ROW_LIMIT = 1000;

interface DailyDateRow {
  date_key: string;
  id: string;
}

interface DateCountRow {
  date_key: string;
  block_count: number | string;
}

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
        `SELECT * FROM blocks WHERE type = 'd' AND box = '${escapeSqlString(this.id)}' AND ${condition} LIMIT ${RECONCILE_ROW_LIMIT}`
      )) ?? []
    );
  }

  /**
   * Load daily notes for the previous, current and next month. This keeps the
   * outside days of the calendar grid highlighted just like in-month days.
   */
  async getExistDailyNotesAround(date: Date, radius = 1): Promise<DailyNote[]> {
    const months = monthsAround(date, radius);
    const startKey = formatDateKey(months[0]);
    const endKey = formatDateKey(endOfMonth(months[months.length - 1]));
    const rows = await api.sql<DailyDateRow>(this.dailyNoteDateQuery(startKey, endKey));

    const notes: DailyNote[] = [];
    for (const row of rows ?? []) {
      const parsed = parseDateKey(row.date_key);
      if (!parsed) {
        continue;
      }
      notes.push({ id: row.id, dateStr: formatDisplayDate(parsed) });
    }
    return this.withOpenTaskStatus(notes);
  }

  /**
   * Return one row per diary date, not one row per raw block/document. The
   * result is bounded by calendar days (366 for a year, not by note count).
   */
  private dailyNoteDateQuery(startKey: string, endKey: string): string {
    return `WITH ranked AS (
      SELECT substr(a.name, 18, 8) AS date_key,
             b.id AS id,
             ROW_NUMBER() OVER (
               PARTITION BY substr(a.name, 18, 8)
               ORDER BY b.created DESC
             ) AS rn
      FROM attributes a
      JOIN blocks b ON b.id = a.block_id AND b.type = 'd'
      WHERE a.box = '${escapeSqlString(this.id)}'
        AND a.name BETWEEN 'custom-dailynote-${startKey}' AND 'custom-dailynote-${endKey}'
    )
    SELECT date_key, id
    FROM ranked
    WHERE rn = 1
    ORDER BY date_key
    LIMIT ${ACTIVITY_DAY_LIMIT}`;
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
      `SELECT DISTINCT root_id FROM blocks WHERE type = 'i' AND subtype = 't' AND markdown LIKE '%[ ]%' AND root_id IN (${ids}) LIMIT ${ACTIVITY_DAY_LIMIT}`
    );
    const openRootIds = new Set((rows ?? []).map((row) => row.root_id));
    return notes.map((note) => (openRootIds.has(note.id) ? { ...note, hasOpenTasks: true } : note));
  }

  async createDailyNote(date: Date): Promise<DailyNote> {
    const dateStr = formatDisplayDate(date);
    const id = await api.createDailyNote(this.id, dateStr);
    // Make sure the new document is visible to the SQL index before the heatmap
    // refresh runs immediately after creation.
    await api.flushTransaction();
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
    const startKey = `${year}0101`;
    const endKey = `${year}1231`;
    const box = escapeSqlString(this.id);
    const dailyBlockSql = `SELECT substr(a.name, 18, 8) AS date_key, COUNT(c.id) AS block_count
      FROM attributes a
      JOIN blocks b ON b.id = a.block_id AND b.type = 'd'
      LEFT JOIN blocks c ON c.root_id = b.id AND c.type != 'd'
      WHERE a.box = '${box}'
        AND a.name BETWEEN 'custom-dailynote-${startKey}' AND 'custom-dailynote-${endKey}'
      GROUP BY date_key
      ORDER BY date_key
      LIMIT ${ACTIVITY_DAY_LIMIT}`;
    const nonDailySql = `SELECT substr(created, 1, 8) AS date_key, COUNT(*) AS block_count
      FROM blocks
      WHERE box = '${box}'
        AND type != 'd'
        AND created >= '${year}0101000000'
        AND created < '${year + 1}0101000000'
        AND root_id NOT IN (
          SELECT block_id FROM attributes WHERE box = '${box}' AND name LIKE 'custom-dailynote-%'
        )
      GROUP BY date_key
      ORDER BY date_key
      LIMIT ${ACTIVITY_DAY_LIMIT}`;

    const [dailyRows, dailyBlockRows, nonDailyRows] = await Promise.all([
      api.sql<DailyDateRow>(this.dailyNoteDateQuery(startKey, endKey)),
      api.sql<DateCountRow>(dailyBlockSql),
      api.sql<DateCountRow>(nonDailySql),
    ]);

    const dailyBlockCounts = new Map((dailyBlockRows ?? []).map((row) => [row.date_key, Number(row.block_count)]));
    const result = new Map<string, DayActivity>();

    // Daily-note blocks always belong to the note's diary date, even if a block
    // was created later than the day it belongs to.
    for (const row of dailyRows ?? []) {
      const date = parseDateKey(row.date_key);
      if (!date) {
        continue;
      }
      const dateStr = formatDisplayDate(date);
      result.set(dateStr, {
        id: row.id,
        dateStr,
        blocks: dailyBlockCounts.get(row.date_key) ?? 0,
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
