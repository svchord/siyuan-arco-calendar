import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { enUS } from 'date-fns/locale';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { App, EventBus } from 'siyuan';
import { CalendarView } from './calendar-view';
import { CalendarPanel } from './calendar-panel';
import { CalendarSettings } from './calendar-settings';
import { HostContext, type HostContextValue } from '@/lib/host';
import type { PluginI18n } from '@/types/i18n';
import { pushErrMsg, pushMsg } from '@/api/api';

vi.mock('@/api/api', () => ({
  getSystemConf: vi.fn(async () => ({ conf: { lang: 'en' } })),
  pushErrMsg: vi.fn(async () => null),
  pushMsg: vi.fn(async () => null),
}));

vi.mock('@/hooks/use-notebooks', () => ({
  useNotebooks: () => ({
    notebooks: [{ id: 'box-1', name: 'Journal' }],
    selectedNotebookId: 'box-1',
    loading: false,
    selectNotebook: vi.fn(),
    refresh: vi.fn(async () => true),
  }),
}));

vi.mock('@/hooks/use-daily-notes', () => ({
  useDailyNotes: () => ({
    month: new Date(2026, 9, 1),
    existMap: new Map(),
    selectedDate: undefined,
    refresh: vi.fn(async () => true),
    changeMonth: vi.fn(),
    openDailyNote: vi.fn(),
    goToToday: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-note-activity', () => ({
  useNoteActivity: () => ({
    activity: new Map(),
    refresh: vi.fn(async () => true),
  }),
}));

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

function createHost(): HostContextValue {
  return {
    app: { plugins: [], appId: 'test' } as App,
    eventBus: {} as EventBus,
    i18n,
    isMobile: false,
  };
}

function renderWithHost(node: ReactNode) {
  return render(<HostContext.Provider value={createHost()}>{node}</HostContext.Provider>);
}

describe('CalendarView', () => {
  it('opens the clicked date and marks days that already have a daily note', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    renderWithHost(
      <CalendarView
        month={new Date(2026, 9, 1)}
        selectedDate={undefined}
        existMap={new Map([['2026-10-15', { id: 'doc-15', dateStr: '2026-10-15', hasOpenTasks: true }]])}
        locale={enUS}
        onMonthChange={vi.fn()}
        onSelectDate={onSelectDate}
      />
    );

    await waitFor(() => expect(document.querySelector('td[data-day="2026-10-15"] button')).not.toBeNull());
    const dayButton = document.querySelector('td[data-day="2026-10-15"] button') as HTMLButtonElement;
    expect(dayButton.getAttribute('data-existing-note')).toBe('true');
    expect(dayButton.getAttribute('data-open-tasks')).toBe('true');

    await user.click(dayButton);
    expect(onSelectDate).toHaveBeenCalledTimes(1);
    expect((onSelectDate.mock.calls[0][0] as Date).getDate()).toBe(15);
  });

  it('changes month and year through the dropdowns', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    renderWithHost(
      <CalendarView
        month={new Date(2026, 9, 1)}
        selectedDate={undefined}
        existMap={new Map()}
        locale={enUS}
        onMonthChange={onMonthChange}
        onSelectDate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Select month' }));
    await user.click(await screen.findByRole('option', { name: 'Nov' }));
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect((onMonthChange.mock.calls[0][0] as Date).getMonth()).toBe(10);

    await user.click(screen.getByRole('combobox', { name: 'Select year' }));
    await user.click(await screen.findByRole('option', { name: '2027' }));
    expect(onMonthChange).toHaveBeenCalledTimes(2);
    expect((onMonthChange.mock.calls[1][0] as Date).getFullYear()).toBe(2027);
  });

  it('exposes refresh next to the month and year selectors', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderWithHost(
      <CalendarView
        month={new Date(2026, 9, 1)}
        selectedDate={undefined}
        existMap={new Map()}
        locale={enUS}
        onRefresh={onRefresh}
        onMonthChange={vi.fn()}
        onSelectDate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Refresh notebooks and daily notes' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('supports Sunday-first weeks and optional week numbers', () => {
    renderWithHost(
      <CalendarView
        month={new Date(2026, 9, 1)}
        selectedDate={undefined}
        existMap={new Map()}
        locale={enUS}
        weekStartsOn={0}
        showWeekNumbers
        onMonthChange={vi.fn()}
        onSelectDate={vi.fn()}
      />
    );

    expect(document.querySelector('.rdp-weekday')?.textContent).toBe('Su');
    expect(document.querySelectorAll('.rdp-week_number').length).toBeGreaterThan(0);
  });
});

describe('CalendarPanel', () => {
  it('renders the tab and notebook selector and wires the today button', async () => {
    const user = userEvent.setup();
    renderWithHost(<CalendarPanel />);

    expect(screen.getByRole('tab', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh notebooks and daily notes' })).toBeInTheDocument();

    await user.click(screen.getByText('Today'));
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('reports a successful refresh', async () => {
    const user = userEvent.setup();
    renderWithHost(<CalendarPanel />);

    await user.click(screen.getByRole('button', { name: 'Refresh notebooks and daily notes' }));

    await waitFor(() => expect(pushMsg).toHaveBeenCalledWith('[Calendar Plugin] Refreshed'));
    expect(pushErrMsg).not.toHaveBeenCalled();
  });

  it('switches to the yearly heatmap view', async () => {
    const user = userEvent.setup();
    renderWithHost(<CalendarPanel />);

    await user.click(screen.getByRole('tab', { name: 'Heatmap' }));

    expect(document.querySelector('[data-slot="calendar-heatmap"]')).not.toBeNull();
    expect(document.querySelectorAll('[data-slot="calendar-heatmap"] [data-date]').length).toBeGreaterThan(300);
  });
});

describe('CalendarSettings', () => {
  it('updates week start and week-number preferences', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithHost(
      <CalendarSettings
        settings={{ position: 'top-left', weekStartsOn: 1, showWeekNumbers: false, showTaskMarkers: true }}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'First day of week' }));
    await user.click(await screen.findByRole('option', { name: 'Sunday' }));
    expect(onChange).toHaveBeenCalledWith({ weekStartsOn: 0 });

    await user.click(screen.getByRole('switch', { name: 'Show week numbers' }));
    expect(onChange).toHaveBeenCalledWith({ showWeekNumbers: true });
  });
});
