import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { CalendarDaysIcon, Settings2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { pushErrMsg, pushMsg } from '@/api/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarSettings } from '@/components/calendar-settings';
import { CalendarView } from '@/components/calendar-view';
import { HeatmapView } from '@/components/heatmap-view';
import { NotebookCombobox } from '@/components/notebook-combobox';
import { PanelViewSwitch, type PanelViewMode } from '@/components/panel-view-switch';
import { useNoteActivity } from '@/hooks/use-note-activity';
import { useDailyNotes } from '@/hooks/use-daily-notes';
import { useIsDark } from '@/hooks/use-is-dark';
import { useLocale } from '@/hooks/use-locale';
import { useNotebooks } from '@/hooks/use-notebooks';
import { useHost } from '@/lib/host';
import { formatMsg } from '@/lib/i18n';
import { CALENDAR_SETTINGS_WIDTH } from '@/lib/layout';
import { DEFAULT_SETTINGS, type PluginSettings } from '@/lib/storage';
import { cn } from '@/lib/utils';

const VIEW_STORAGE_KEY = 'arco-calendar-view';

function initialView(): PanelViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'heatmap' ? 'heatmap' : 'calendar';
  } catch {
    return 'calendar';
  }
}

function PanelDivider() {
  return <div role="separator" aria-orientation="horizontal" className="my-3 h-px w-full shrink-0 bg-border/70" />;
}

export function CalendarPanel({
  settings = DEFAULT_SETTINGS,
  onSettingsChange = () => undefined,
}: {
  settings?: PluginSettings;
  onSettingsChange?: (patch: Partial<PluginSettings>) => void;
}) {
  const { i18n } = useHost();
  const isDark = useIsDark();
  const locale = useLocale();
  const notebooks = useNotebooks();
  const dailyNotes = useDailyNotes(notebooks.selectedNotebook);
  const [view, setView] = useState<PanelViewMode>(initialView);
  const [heatmapYear, setHeatmapYear] = useState(() => new Date().getFullYear());
  const [focusDate, setFocusDate] = useState<Date>();
  const activity = useNoteActivity(notebooks.selectedNotebook, view === 'heatmap' ? heatmapYear : undefined);
  const [refreshing, setRefreshing] = useState(false);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale.code), [locale.code]);
  const heatmapYearBlocks = useMemo(() => {
    let total = 0;
    for (const entry of activity.activity.values()) {
      if (entry.dateStr.startsWith(`${heatmapYear}-`)) {
        total += entry.blocks;
      }
    }
    return total;
  }, [activity.activity, heatmapYear]);

  const changeView = (next: PanelViewMode) => {
    setView(next);
    if (next === 'heatmap') {
      setFocusDate(undefined);
    }
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Persisting the active view is optional.
    }
  };

  const footerLabel =
    view === 'heatmap'
      ? i18n.heatmapYearTotal.replace('{count}', numberFormatter.format(heatmapYearBlocks))
      : dailyNotes.selectedDate
        ? format(dailyNotes.selectedDate, 'PPP', { locale })
        : i18n.hint;

  const refreshAll = async () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    let success = false;
    try {
      const results = await Promise.all([notebooks.refresh(), dailyNotes.refresh(), activity.refresh()]);
      success = results.every(Boolean);

      const rangeStart =
        view === 'heatmap' ? new Date(heatmapYear, 0, 1) : startOfMonth(addMonths(dailyNotes.month, -1));
      const rangeEnd = view === 'heatmap' ? new Date(heatmapYear, 11, 31) : endOfMonth(addMonths(dailyNotes.month, 1));
      const repaired = notebooks.selectedNotebook
        ? await notebooks.selectedNotebook.reconcileDailyNoteAttrs(rangeStart, rangeEnd)
        : 0;

      if (repaired > 0) {
        const refreshed = await Promise.all([dailyNotes.refresh(), activity.refresh()]);
        success = success && refreshed.every(Boolean);
      }
    } catch {
      success = false;
    } finally {
      setRefreshing(false);
    }

    const message = formatMsg(i18n, success ? i18n.msg.refreshSuccess : i18n.msg.refreshFailed);
    try {
      if (success) {
        await pushMsg(message);
      } else {
        await pushErrMsg(message);
      }
    } catch {
      // Notifications are best-effort.
    }
  };

  const goToToday = () => {
    if (view === 'heatmap') {
      setHeatmapYear(new Date().getFullYear());
    } else {
      setFocusDate(new Date());
    }
    void dailyNotes.goToToday();
  };

  return (
    <div className={cn('sy-calendar-root w-full', isDark && 'dark')} data-slot="calendar-panel" data-view={view}>
      <Card className="w-full gap-0 rounded-none bg-transparent p-0 shadow-none ring-0">
        <CardHeader className="flex flex-row items-center justify-between gap-1 p-0">
          <PanelViewSwitch view={view} onChange={changeView} />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            <NotebookCombobox
              notebooks={notebooks.notebooks}
              selectedNotebookId={notebooks.selectedNotebookId}
              loading={notebooks.loading}
              triggerClassName="min-w-0 max-w-[150px] flex-1 shrink"
              onSelect={(notebookId) => {
                void notebooks.selectNotebook(notebookId);
              }}
            />
            <Popover>
              <PopoverTrigger
                aria-label={i18n.settings.title}
                title={i18n.settings.title}
                data-slot="calendar-settings-trigger"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                  'text-muted-foreground hover:text-foreground'
                )}
              >
                <Settings2Icon className="size-4" />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={6}
                style={{ width: CALENDAR_SETTINGS_WIDTH, maxWidth: 'calc(100vw - 16px)' }}
                className={cn('sy-calendar-portal gap-3 p-3', isDark && 'dark')}
              >
                <div className="text-sm font-semibold">{i18n.settings.title}</div>
                <CalendarSettings settings={settings} onChange={onSettingsChange} />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <PanelDivider />

        <CardContent className="p-0">
          {view === 'calendar' ? (
            <CalendarView
              month={dailyNotes.month}
              selectedDate={dailyNotes.selectedDate}
              focusDate={focusDate}
              existMap={dailyNotes.existMap}
              locale={locale}
              weekStartsOn={settings.weekStartsOn}
              showWeekNumbers={settings.showWeekNumbers}
              showTaskMarkers={settings.showTaskMarkers}
              refreshing={refreshing}
              onRefresh={() => {
                void refreshAll();
              }}
              onMonthChange={dailyNotes.changeMonth}
              onSelectDate={(date) => {
                void dailyNotes.openDailyNote(date);
              }}
            />
          ) : (
            <HeatmapView
              year={heatmapYear}
              activity={activity.activity}
              locale={locale}
              weekStartsOn={settings.weekStartsOn}
              refreshing={refreshing}
              onYearChange={setHeatmapYear}
              onRefresh={() => {
                void refreshAll();
              }}
              onOpenDailyNote={(date, dailyNoteId) => {
                void (async () => {
                  await dailyNotes.openDailyNote(date, dailyNoteId);
                  // Creating a note changes whether that day has a daily note, so
                  // reload the heatmap activity instead of waiting for a manual refresh.
                  if (dailyNoteId === undefined) {
                    await activity.refresh();
                  }
                })();
              }}
            />
          )}
        </CardContent>

        <PanelDivider />

        <CardFooter className="justify-between gap-2 p-0" data-slot="calendar-footer">
          <span
            className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
            data-slot={view === 'heatmap' ? 'heatmap-year-total' : undefined}
          >
            {footerLabel}
          </span>
          <Button type="button" size="sm" onClick={goToToday} data-slot="calendar-today-button">
            <CalendarDaysIcon className="size-3.5" />
            {i18n.today}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
