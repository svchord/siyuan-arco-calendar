import { format } from 'date-fns';
import { CalendarDaysIcon, Settings2Icon } from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarSettings } from '@/components/calendar-settings';
import { CalendarView } from '@/components/calendar-view';
import { NotebookCombobox } from '@/components/notebook-combobox';
import { useDailyNotes } from '@/hooks/use-daily-notes';
import { useIsDark } from '@/hooks/use-is-dark';
import { useLocale } from '@/hooks/use-locale';
import { useNotebooks } from '@/hooks/use-notebooks';
import { useHost } from '@/lib/host';
import { DEFAULT_SETTINGS, type PluginSettings } from '@/lib/storage';
import { cn } from '@/lib/utils';

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
  const [refreshing, setRefreshing] = useState(false);

  const footerLabel = dailyNotes.selectedDate ? format(dailyNotes.selectedDate, 'PPP', { locale }) : i18n.hint;
  const refreshAll = async () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    try {
      await Promise.all([notebooks.refresh(), dailyNotes.refresh()]);
    } catch {
      // A failed refresh keeps the existing data visible.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={cn('sy-calendar-root w-full', isDark && 'dark')} data-slot="calendar-panel">
      <Card className="w-full gap-0 rounded-none bg-transparent p-0 shadow-none ring-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 p-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <CardTitle className="truncate text-sm font-semibold">{i18n.tabName}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <NotebookCombobox
              notebooks={notebooks.notebooks}
              selectedNotebookId={notebooks.selectedNotebookId}
              loading={notebooks.loading}
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
                className={cn('sy-calendar-portal z-[100000] w-[330px] gap-3 p-3', isDark && 'dark')}
              >
                <div className="text-sm font-semibold">{i18n.settings.title}</div>
                <CalendarSettings settings={settings} onChange={onSettingsChange} />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <PanelDivider />

        <CardContent className="p-0">
          <CalendarView
            month={dailyNotes.month}
            selectedDate={dailyNotes.selectedDate}
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
        </CardContent>

        <PanelDivider />

        <CardFooter className="justify-between gap-2 p-0">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{footerLabel}</span>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              void dailyNotes.goToToday();
            }}
            data-slot="calendar-today-button"
          >
            <CalendarDaysIcon className="size-3.5" />
            {i18n.today}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
