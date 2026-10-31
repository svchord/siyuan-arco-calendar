import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { App, EventBus } from 'siyuan';
import type { DailyNote } from '@/types/domain';
import type { CalendarNotebook } from '@/api/notebook';
import { HostContext, type HostContextValue } from '@/lib/host';
import type { PluginI18n } from '@/types/i18n';
import { formatDisplayDate } from '@/lib/date';

vi.mock('@/api/api', () => ({
  flushTransaction: vi.fn(async () => null),
  pushErrMsg: vi.fn(async () => null),
}));
vi.mock('@/api/open-doc', () => ({
  openDoc: vi.fn(),
}));

import { openDoc } from '@/api/open-doc';
import { pushErrMsg } from '@/api/api';
import { useDailyNotes } from './use-daily-notes';

const i18n: PluginI18n = {
  openCalendar: 'Open calendar',
  tabName: 'Calendar',
  placeholder: 'Select notebook...',
  today: 'Today',
  refreshHint: 'Refresh notebooks and daily notes',
  hint: 'Click a date to open or create a daily note',
  selectMonth: 'Select month',
  selectYear: 'Select year',
  calendarView: 'Calendar',
  heatmapView: 'Heatmap',
  heatmapHint: 'Note activity by content-block count',
  heatmapBlocks: 'blocks',
  heatmapNoNote: 'No daily note',
  heatmapOpenTasks: 'Open tasks',
  heatmapLess: 'Less',
  heatmapMore: 'More',
  loading: 'Loading...',
  noNotebooks: 'No open notebooks',
  msg: {
    begin: '[Calendar Plugin]',
    notNoteBook: 'Notebook missing',
    createFailed: 'Create failed',
    refreshSuccess: 'Refreshed',
    refreshFailed: 'Refresh failed',
  },
  position: {
    title: 'Position',
    description: 'Entry position',
    topLeft: 'Top left',
    topRight: 'Top right',
    dock: 'Dock',
  },
  settings: {
    title: 'Calendar settings',
    description: 'Configure the calendar',
  },
  weekStart: {
    title: 'First day of week',
    description: 'Choose the first day of the week',
    monday: 'Monday',
    sunday: 'Sunday',
  },
  weekNumbers: {
    title: 'Show week numbers',
    description: 'Display week numbers',
  },
  taskMarkers: {
    title: 'Show unfinished task markers',
    description: 'Show an amber dot for open tasks',
  },
};

const host: HostContextValue = {
  app: { plugins: [], appId: 'test' } as App,
  eventBus: { on: vi.fn(), off: vi.fn() } as unknown as EventBus,
  i18n,
  isMobile: false,
};

function wrapper({ children }: { children: ReactNode }) {
  return <HostContext.Provider value={host}>{children}</HostContext.Provider>;
}

function createNotebook(existing: DailyNote[] = []) {
  return {
    id: 'box-1',
    getExistDailyNotesAround: vi.fn(async () => existing),
    createDailyNote: vi.fn(async (date: Date) => ({ id: 'created-doc', dateStr: formatDisplayDate(date) })),
  } as unknown as CalendarNotebook;
}

describe('useDailyNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens an existing daily note without creating a new document', async () => {
    const notebook = createNotebook([{ id: 'existing-doc', dateStr: '2026-10-15' }]);
    const { result } = renderHook(() => useDailyNotes(notebook), { wrapper });

    await waitFor(() => expect(result.current.existMap.get('2026-10-15')?.id).toBe('existing-doc'));

    await act(async () => {
      await result.current.openDailyNote(new Date(2026, 9, 15));
    });

    expect(openDoc).toHaveBeenCalledWith(host.app, 'existing-doc', false);
    expect(notebook.createDailyNote).not.toHaveBeenCalled();
  });

  it('creates a new daily note only once when the same date is clicked repeatedly', async () => {
    const notebook = createNotebook();
    const { result } = renderHook(() => useDailyNotes(notebook), { wrapper });

    await waitFor(() => expect(notebook.getExistDailyNotesAround).toHaveBeenCalled());

    await act(async () => {
      await result.current.openDailyNote(new Date(2026, 9, 16));
    });
    await act(async () => {
      await result.current.openDailyNote(new Date(2026, 9, 16));
    });

    expect(notebook.createDailyNote).toHaveBeenCalledTimes(1);
    expect(openDoc).toHaveBeenCalledTimes(2);
  });

  it('shows the real kernel error when daily note creation fails', async () => {
    const notebook = createNotebook();
    vi.mocked(notebook.createDailyNote).mockRejectedValue(new Error('document metadata is not ready'));

    const { result } = renderHook(() => useDailyNotes(notebook), { wrapper });
    await waitFor(() => expect(notebook.getExistDailyNotesAround).toHaveBeenCalled());

    await act(async () => {
      await result.current.openDailyNote(new Date(2026, 10, 1));
    });

    expect(openDoc).not.toHaveBeenCalled();
    expect(pushErrMsg).toHaveBeenCalledWith('[Calendar Plugin] Create failed: document metadata is not ready');
  });
});
