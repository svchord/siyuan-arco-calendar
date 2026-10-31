import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlockRow } from '@/types/domain';

vi.mock('@/api/api', () => ({
  createDailyNote: vi.fn(),
  sql: vi.fn(),
}));

import * as api from '@/api/api';
import { CalendarNotebook } from './notebook';

const mocks = {
  createDailyNote: vi.mocked(api.createDailyNote),
  sql: vi.mocked(api.sql),
};

function buildNotebook() {
  return new CalendarNotebook('box-1', 'Diary');
}

describe('CalendarNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sql.mockResolvedValue([]);
  });

  it('loads existing daily notes for the surrounding months', async () => {
    const notebook = buildNotebook();
    const rows: BlockRow[] = [
      { id: 'doc-1', ial: '{: custom-dailynote-20260930="20260930"}' },
      { id: 'doc-2', ial: '{: custom-dailynote-20261001="20261001"}' },
    ];
    mocks.sql.mockResolvedValue(rows);

    const notes = await notebook.getExistDailyNotesAround(new Date(2026, 9, 15));

    expect(notes).toEqual([
      { id: 'doc-1', dateStr: '2026-09-30' },
      { id: 'doc-2', dateStr: '2026-10-01' },
    ]);
    const statement = mocks.sql.mock.calls[0][0];
    expect(statement).toContain('custom-dailynote-202609__');
    expect(statement).toContain('custom-dailynote-202610__');
    expect(statement).toContain('custom-dailynote-202611__');
  });

  it('marks daily notes that contain unfinished task list items', async () => {
    const notebook = buildNotebook();
    const rows: BlockRow[] = [
      { id: 'doc-1', ial: '{: custom-dailynote-20260930="20260930"}' },
      { id: 'doc-2', ial: '{: custom-dailynote-20261001="20261001"}' },
    ];
    mocks.sql.mockResolvedValueOnce(rows).mockResolvedValueOnce([{ id: 'task-1', root_id: 'doc-1' }]);

    const notes = await notebook.getExistDailyNotesAround(new Date(2026, 9, 15));

    expect(notes[0]).toMatchObject({ id: 'doc-1', hasOpenTasks: true });
    expect(notes[1].hasOpenTasks).toBeUndefined();
  });

  it('attributes daily-note blocks to their diary date and other notes to block creation date', async () => {
    const notebook = buildNotebook();
    mocks.sql
      .mockResolvedValueOnce([
        { id: 'doc-1', ial: '{: custom-dailynote-20260930="20260930"}' },
        { id: 'doc-2', ial: '{: custom-dailynote-20261001="20261001"}' },
      ])
      .mockResolvedValueOnce([{ date_key: '20260115', block_count: 2 } as unknown as BlockRow])
      .mockResolvedValueOnce([{ root_id: 'doc-1', block_count: 4 } as unknown as BlockRow])
      .mockResolvedValueOnce([{ id: 'task-1', root_id: 'doc-1' }]);

    const activity = await notebook.getActivity(2026);

    expect(activity.get('2026-01-15')).toMatchObject({ blocks: 2 });
    expect(activity.get('2026-09-30')).toMatchObject({ blocks: 4, hasOpenTasks: true });
    expect(activity.get('2026-10-01')).toMatchObject({ blocks: 0, hasOpenTasks: false });
    expect(activity.size).toBe(3);
    expect(mocks.sql.mock.calls[0][0]).toContain("box = 'box-1'");
  });

  it('delegates daily-note creation to the native kernel API', async () => {
    const notebook = buildNotebook();
    mocks.createDailyNote.mockResolvedValue('native-doc');

    const note = await notebook.createDailyNote(new Date(2026, 9, 30));

    expect(note).toEqual({ id: 'native-doc', dateStr: '2026-10-30' });
    expect(mocks.createDailyNote).toHaveBeenCalledWith('box-1', '2026-10-30');
  });
});
