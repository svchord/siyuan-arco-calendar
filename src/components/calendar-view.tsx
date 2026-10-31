import * as React from 'react';
import type { Locale } from 'date-fns';
import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsDark } from '@/hooks/use-is-dark';
import { formatDisplayDate } from '@/lib/date';
import { useHost } from '@/lib/host';
import type { WeekStart } from '@/lib/storage';
import type { DailyNote } from '@/types/domain';
import { cn } from '@/lib/utils';

const YEAR_RADIUS = 50;
const CURRENT_YEAR = new Date().getFullYear();

function buildYears(around: number) {
  return Array.from({ length: YEAR_RADIUS * 2 + 1 }, (_, index) => around - YEAR_RADIUS + index);
}

function ExistingDayButton({ children, ...props }: React.ComponentProps<typeof CalendarDayButton>) {
  const hasExistingNote = props.modifiers.existing;
  return (
    <CalendarDayButton
      {...props}
      data-day={props.day.isoDate}
      data-existing-note={hasExistingNote ? 'true' : undefined}
      data-open-tasks={props.modifiers.openTasks ? 'true' : undefined}
      data-today={props.modifiers.today ? 'true' : undefined}
    >
      {children}
    </CalendarDayButton>
  );
}

interface CalendarViewProps {
  month: Date;
  selectedDate: Date | undefined;
  existMap: Map<string, DailyNote>;
  locale: Locale;
  weekStartsOn?: WeekStart;
  showWeekNumbers?: boolean;
  showTaskMarkers?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function CalendarView({
  month,
  selectedDate,
  existMap,
  locale,
  weekStartsOn = 1,
  showWeekNumbers = false,
  showTaskMarkers = true,
  refreshing = false,
  onRefresh,
  onMonthChange,
  onSelectDate,
}: CalendarViewProps) {
  const { i18n } = useHost();
  const isDark = useIsDark();
  const existingMatcher = React.useCallback((date: Date) => existMap.has(formatDisplayDate(date)), [existMap]);
  const openTaskMatcher = React.useCallback(
    (date: Date) => showTaskMarkers && Boolean(existMap.get(formatDisplayDate(date))?.hasOpenTasks),
    [existMap, showTaskMarkers]
  );
  const monthNames = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(locale.code ?? 'en-US', { month: 'short' }).format(new Date(2024, index, 1))
      ),
    [locale.code]
  );
  const years = React.useMemo(() => buildYears(CURRENT_YEAR), []);
  const selectedYear = month.getFullYear();
  const selectMonth = (value: string | null) => {
    if (value === null) return;
    onMonthChange(new Date(selectedYear, Number(value), 1));
  };
  const selectYear = (value: string | null) => {
    if (value === null) return;
    onMonthChange(new Date(Number(value), month.getMonth(), 1));
  };

  return (
    <div className="w-full" data-slot="calendar-view">
      <div className="flex items-center justify-center gap-1 py-1">
        <div className="flex items-center gap-1 rounded-lg bg-muted/35 p-0.5">
          <Select value={String(month.getMonth())} onValueChange={selectMonth}>
            <SelectTrigger
              size="sm"
              aria-label={i18n.selectMonth}
              data-slot="calendar-month-select"
              className="h-7 w-[78px] justify-between border-0 bg-transparent px-2 text-xs font-medium shadow-none hover:bg-background/70"
            >
              <SelectValue>{monthNames[month.getMonth()]}</SelectValue>
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              sideOffset={6}
              className={cn('sy-calendar-portal z-[100000] max-h-48 min-w-[90px]', isDark && 'dark')}
            >
              {monthNames.map((name, index) => (
                <SelectItem key={name} value={String(index)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={selectYear}>
            <SelectTrigger
              size="sm"
              aria-label={i18n.selectYear}
              data-slot="calendar-year-select"
              className="h-7 w-[70px] justify-between border-0 bg-transparent px-2 text-xs font-medium shadow-none hover:bg-background/70"
            >
              <SelectValue>{selectedYear}</SelectValue>
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              sideOffset={6}
              className={cn('sy-calendar-portal z-[100000] max-h-48 min-w-[86px]', isDark && 'dark')}
            >
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={i18n.refreshHint}
          title={i18n.refreshHint}
          disabled={refreshing}
          data-slot="calendar-refresh-button"
          className="size-8 rounded-lg bg-background text-muted-foreground shadow-xs hover:text-foreground"
          onClick={onRefresh}
        >
          <RefreshCwIcon className={cn('size-3.5', refreshing && 'animate-spin')} />
        </Button>
      </div>
      <Calendar
        mode="single"
        required
        selected={selectedDate}
        month={month}
        onMonthChange={onMonthChange}
        onSelect={(date) => {
          if (date) {
            onSelectDate(date);
          }
        }}
        locale={locale}
        weekStartsOn={weekStartsOn}
        showWeekNumber={showWeekNumbers}
        modifiers={{ existing: existingMatcher, openTasks: openTaskMatcher }}
        components={{ DayButton: ExistingDayButton }}
        showOutsideDays
        hideNavigation
        classNames={{ month_caption: 'hidden' }}
        className="w-full pt-0"
      />
    </div>
  );
}
