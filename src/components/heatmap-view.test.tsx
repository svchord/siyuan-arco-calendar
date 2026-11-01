import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { enUS } from 'date-fns/locale';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { App, EventBus } from 'siyuan';
import { HeatmapView } from './heatmap-view';
import { HostContext, type HostContextValue } from '@/lib/host';
import type { DayActivity } from '@/types/domain';
import type { PluginI18n } from '@/types/i18n';

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
  heatmapYearTotal: '{count} blocks this year',
  heatmapBlocks: 'blocks',
  heatmapNoNote: 'No daily note',
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

function renderWithHost(node: ReactNode) {
  const host: HostContextValue = {
    app: { plugins: [], appId: 'test' } as App,
    eventBus: {} as EventBus,
    i18n,
    isMobile: false,
  };
  return render(<HostContext.Provider value={host}>{node}</HostContext.Provider>);
}

function renderHeatmap(activity: Map<string, DayActivity>, onOpenDailyNote = vi.fn()) {
  return renderWithHost(
    <HeatmapView
      year={2026}
      activity={activity}
      locale={enUS}
      weekStartsOn={1}
      refreshing={false}
      onYearChange={vi.fn()}
      onRefresh={vi.fn()}
      onOpenDailyNote={onOpenDailyNote}
    />
  );
}

describe('HeatmapView', () => {
  it('does not duplicate the annual total inside the heatmap body', () => {
    renderHeatmap(
      new Map<string, DayActivity>([
        ['2026-01-03', { dateStr: '2026-01-03', blocks: 5 }],
        ['2026-06-10', { dateStr: '2026-06-10', blocks: 7, id: 'doc-1' }],
        ['2025-12-31', { dateStr: '2025-12-31', blocks: 100 }],
      ])
    );

    expect(screen.queryByText('12 blocks this year')).toBeNull();
  });

  it('shows the daily block count in a tooltip when hovering a heatmap cell', async () => {
    const user = userEvent.setup();
    renderHeatmap(new Map([['2026-03-05', { dateStr: '2026-03-05', blocks: 9, id: 'doc-2' }]]));

    expect(screen.queryByRole('tooltip')).toBeNull();
    const cell = document.querySelector('[data-date="2026-03-05"]') as HTMLElement;
    await user.hover(cell);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip).toHaveTextContent('March 5th, 2026');
    expect(tooltip).toHaveTextContent('9 blocks');

    await user.unhover(cell);
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('keeps the same tooltip mounted while moving between adjacent cells', async () => {
    const user = userEvent.setup();
    renderHeatmap(
      new Map([
        ['2026-05-06', { dateStr: '2026-05-06', blocks: 4, id: 'doc-a' }],
        ['2026-05-07', { dateStr: '2026-05-07', blocks: 6, id: 'doc-b' }],
      ])
    );

    const first = document.querySelector('[data-date="2026-05-06"]') as HTMLElement;
    const second = document.querySelector('[data-date="2026-05-07"]') as HTMLElement;
    await user.hover(first);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('4 blocks');

    await user.hover(second);
    expect(screen.getByRole('tooltip')).toBe(tooltip);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.getByRole('tooltip')).toBe(tooltip);
    expect(tooltip).toHaveTextContent('6 blocks');
  });

  it('opens the clicked day through the daily-note handler', async () => {
    const user = userEvent.setup();
    const onOpenDailyNote = vi.fn();
    renderHeatmap(new Map([['2026-04-08', { dateStr: '2026-04-08', blocks: 3, id: 'doc-8' }]]), onOpenDailyNote);

    await user.click(document.querySelector('[data-date="2026-04-08"]') as HTMLElement);

    expect(onOpenDailyNote).toHaveBeenCalledTimes(1);
    expect(onOpenDailyNote).toHaveBeenCalledWith(new Date(2026, 3, 8), 'doc-8');
  });

  it('passes no daily-note id for days that only have blocks from other notes', async () => {
    const user = userEvent.setup();
    const onOpenDailyNote = vi.fn();
    renderHeatmap(new Map([['2026-04-09', { dateStr: '2026-04-09', blocks: 2 }]]), onOpenDailyNote);

    await user.click(document.querySelector('[data-date="2026-04-09"]') as HTMLElement);

    expect(onOpenDailyNote).toHaveBeenCalledWith(new Date(2026, 3, 9), undefined);
  });

  it('reports zero blocks and the missing note for a day without activity', async () => {
    const user = userEvent.setup();
    renderHeatmap(new Map());

    const cell = document.querySelector('[data-date="2026-08-20"]') as HTMLElement;
    await user.hover(cell);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('0 blocks');
    expect(tooltip).toHaveTextContent('No daily note');
  });
});
