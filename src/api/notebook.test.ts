import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlockRow } from '@/types/domain';

vi.mock('@/api/api', () => ({
  batchSetBlockAttrs: vi.fn(),
  createDailyNote: vi.fn(),
  flushTransaction: vi.fn(async () => null),
  getDailyNoteInfo: vi.fn(),
  sql: vi.fn(),
}));

import * as api from '@/api/api';
import { CalendarNotebook } from './notebook';

const mocks = {
  batchSetBlockAttrs: vi.mocked(api.batchSetBlockAttrs),
  createDailyNote: vi.mocked(api.createDailyNote),
  flushTransaction: vi.mocked(api.flushTransaction),
  getDailyNoteInfo: vi.mocked(api.getDailyNoteInfo),
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
      .mockResolvedValueOnce([{ root_id: 'doc-1', block_count: 4 } as unknown as BlockRow]);

    const activity = await notebook.getActivity(2026);

    expect(activity.get('2026-01-15')).toMatchObject({ blocks: 2 });
    expect(activity.get('2026-09-30')).toMatchObject({ blocks: 4 });
    expect(activity.get('2026-10-01')).toMatchObject({ blocks: 0 });
    expect(activity.size).toBe(3);
    expect(mocks.sql.mock.calls[0][0]).toContain("box = 'box-1'");
  });

  it('repairs missing daily-note attributes for date-titled documents', async () => {
    const notebook = buildNotebook();
    mocks.sql.mockResolvedValueOnce([
      { id: 'doc-1', hpath: '/daily note/2026/10/2026-10-20', ial: '{: title="2026-10-20"}' },
      {
        id: 'doc-2',
        hpath: '/daily note/2026/10/2026-10-21',
        ial: '{: title="2026-10-21", custom-dailynote-20261021="20261021"}',
      },
      { id: 'doc-3', hpath: '/notes/2026-10-22', ial: '{: title="2026-10-22"}' },
      { id: 'doc-4', hpath: '/notes/2026-10-23', ial: '{: title="2026-10-23"}' },
    ]);
    mocks.getDailyNoteInfo.mockImplementation(async (_notebook, date) => {
      if (date === '2026-10-20') {
        return {
          id: 'doc-1',
          hPath: '/daily note/2026/10/2026-10-20',
          title: '2026-10-20',
          existed: true,
        };
      }
      if (date === '2026-10-23') {
        return {
          id: 'doc-4',
          hPath: '/daily note/2026/10/2026-10-23',
          title: '2026-10-23',
          existed: true,
        };
      }
      return {
        id: '',
        hPath: `/notes/${date}`,
        title: date,
        existed: false,
      };
    });

    const repaired = await notebook.reconcileDailyNoteAttrs(new Date(2026, 9, 1), new Date(2026, 9, 31));

    expect(repaired).toBe(1);
    expect(mocks.batchSetBlockAttrs).toHaveBeenCalledWith([
      { id: 'doc-1', attrs: { 'custom-dailynote-20261020': '20261020' } },
    ]);
    expect(mocks.flushTransaction).toHaveBeenCalledTimes(1);
  });

  it('delegates daily-note creation to the native kernel API', async () => {
    const notebook = buildNotebook();
    mocks.createDailyNote.mockResolvedValue('native-doc');

    const note = await notebook.createDailyNote(new Date(2026, 9, 30));

    expect(note).toEqual({ id: 'native-doc', dateStr: '2026-10-30' });
    expect(mocks.createDailyNote).toHaveBeenCalledWith('box-1', '2026-10-30');
  });
});
