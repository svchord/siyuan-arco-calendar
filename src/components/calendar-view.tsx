import * as React from 'react';
import { addMonths } from 'date-fns';
import type { Locale } from 'date-fns';
import { getDefaultClassNames } from 'react-day-picker';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsDark } from '@/hooks/use-is-dark';
import { formatDisplayDate } from '@/lib/date';
import { useHost } from '@/lib/host';
import type { WeekStart } from '@/lib/storage';
import type { DailyNote } from '@/types/domain';
import { cn } from '@/lib/utils';
import { buildYearOptions } from '@/lib/years';

const DAY_BUTTON_MARKERS = cn(
  'h-full',
  // Hide DayPicker's "focus target" when it is not the keyboard-focused element.
  'group-data-[focused=true]/day:border-transparent group-data-[focused=true]/day:ring-0',
  // Existing daily note: quiet disc behind the day number. Tinted from the theme
  // accent rather than the neutral --muted wash so it belongs to the same colour
  // family as the selected chip, but at a much lower alpha: it marks "there is a
  // note here" and must stay clearly quieter than the selected day.
  'data-[existing-note=true]:not-data-[selected-single=true]:bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_10%,transparent)_0_13px,transparent_13.5px)]',
  // The number picks up the accent too, so the disc and its text read as one unit.
  // Light mode keeps the pure accent; dark mode mixes it toward --foreground
  // because the accent alone only reached 3.54:1 on a dark surface.
  'data-[existing-note=true]:not-data-[selected-single=true]:text-primary',
  'dark:data-[existing-note=true]:not-data-[selected-single=true]:text-[color-mix(in_oklch,var(--primary)_70%,var(--foreground))]',
  // Keep the same colour on hover in dark mode too: ghost's
  // `dark:hover:text-foreground` ties the rule above on specificity.
  'dark:data-[existing-note=true]:not-data-[selected-single=true]:hover:text-[color-mix(in_oklch,var(--primary)_70%,var(--foreground))]',
  // Hover: theme-tinted wash instead of ghost's neutral --muted, so hovering a day
  // belongs to the same palette as the selection. The dark: twin is required
  // because ghost also ships `dark:hover:bg-muted/50` at the same specificity.
  'hover:bg-primary/10',
  'dark:hover:bg-primary/10',
  // On hover, use the normal rounded button surface instead of the note disc.
  'data-[existing-note=true]:hover:bg-none',
  // Selected day: solid theme fill with a halo derived from the same accent, so
  // the outline tracks the chip colour instead of the neutral --ring tone.
  'data-[selected-single=true]:bg-primary',
  'data-[selected-single=true]:text-primary-foreground',
  'data-[selected-single=true]:shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_60%,transparent),0_0_0_3px_color-mix(in_oklch,var(--primary)_25%,transparent)]',
  'data-[selected-single=true]:hover:bg-primary',
  'data-[selected-single=true]:hover:text-primary-foreground',
  // Ghost's hover utilities tie the rules above on specificity, so restate the
  // selected fill for dark mode where `dark:hover:bg-muted/50` would otherwise win
  // on source order and drain the chip back to a faint wash.
  'dark:data-[selected-single=true]:hover:bg-primary',
  'dark:data-[selected-single=true]:hover:text-primary-foreground',
  // Open task: amber dot in the top-right corner.
  'data-[open-tasks=true]:after:absolute data-[open-tasks=true]:after:top-[3px] data-[open-tasks=true]:after:right-[3px] data-[open-tasks=true]:after:block data-[open-tasks=true]:after:size-[7px] data-[open-tasks=true]:after:rounded-full data-[open-tasks=true]:after:border data-[open-tasks=true]:after:border-background data-[open-tasks=true]:after:bg-[var(--task-color)] data-[open-tasks=true]:after:content-[""]',
  // Today: small dot below the day number, so the note disc remains visible.
  // On the selected (solid accent) chip the dot switches to the on-accent colour,
  // otherwise it would disappear into the same-accent fill.
  'data-[today=true]:before:absolute data-[today=true]:before:bottom-[2px] data-[today=true]:before:left-1/2 data-[today=true]:before:size-[3px] data-[today=true]:before:-translate-x-1/2 data-[today=true]:before:rounded-full data-[today=true]:before:bg-primary data-[today=true]:before:pointer-events-none data-[today=true]:before:content-[""]',
  'data-[today=true]:data-[selected-single=true]:before:bg-primary-foreground'
);

function ExistingDayButton({ children, className, ...props }: React.ComponentProps<typeof CalendarDayButton>) {
  const hasExistingNote = props.modifiers.existing;
  return (
    <CalendarDayButton
      {...props}
      className={cn(className, DAY_BUTTON_MARKERS)}
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
  focusDate?: Date;
  existMap: Map<string, DailyNote>;
  locale: Locale;
  weekStartsOn?: WeekStart;
  showWeekNumbers?: boolean;
  showTaskMarkers?: boolean;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}

export function CalendarView({
  month,
  selectedDate,
  focusDate,
  existMap,
  locale,
  weekStartsOn = 1,
  showWeekNumbers = false,
  showTaskMarkers = true,
  onMonthChange,
  onSelectDate,
}: CalendarViewProps) {
  const { i18n } = useHost();
  const isDark = useIsDark();
  const calendarRootRef = React.useRef<HTMLDivElement>(null);
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
  const years = React.useMemo(() => buildYearOptions(), []);
  const selectedYear = month.getFullYear();
  const restoreFocusRef = React.useRef<HTMLButtonElement | null>(null);
  const defaultClassNames = React.useMemo(() => getDefaultClassNames(), []);
  const dayPickerClassNames = React.useMemo(
    () => ({
      root: cn('w-full bg-transparent', defaultClassNames.root),
      months: cn('relative flex w-full flex-col gap-0 md:flex-row', defaultClassNames.months),
      month: cn('flex w-full flex-col gap-0', defaultClassNames.month),
      month_grid: cn('w-full table-fixed border-collapse', defaultClassNames.month_grid),
      weekdays: cn('flex w-full', defaultClassNames.weekdays),
      week: cn('mt-2 flex w-full', defaultClassNames.week),
      week_number: cn(
        'flex h-auto w-(--cell-size) min-w-(--cell-size) flex-none items-center justify-center self-center text-[0.8rem] text-muted-foreground select-none',
        defaultClassNames.week_number
      ),
      day: cn(
        'group/day relative aspect-square h-full w-full flex-1 rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)',
        showWeekNumbers
          ? '[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)'
          : '[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)',
        defaultClassNames.day
      ),
      today: cn(
        'rounded-(--cell-radius) bg-transparent text-foreground data-[selected=true]:rounded-none',
        defaultClassNames.today
      ),
      month_caption: 'hidden',
    }),
    [defaultClassNames, showWeekNumbers]
  );
  const navigateMonth = (delta: number, button: HTMLButtonElement) => {
    restoreFocusRef.current = button;
    onMonthChange(addMonths(month, delta));
  };

  React.useEffect(() => {
    const button = restoreFocusRef.current;
    if (!button) {
      return;
    }
    restoreFocusRef.current = null;
    const frame = window.requestAnimationFrame(() => button.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [month]);

  const selectMonth = (value: string | null) => {
    if (value === null) return;
    onMonthChange(new Date(selectedYear, Number(value), 1));
  };
  const selectYear = (value: string | null) => {
    if (value === null) return;
    onMonthChange(new Date(Number(value), month.getMonth(), 1));
  };

  React.useEffect(() => {
    if (!focusDate) {
      return;
    }
    const key = formatDisplayDate(focusDate);
    const button = calendarRootRef.current?.querySelector<HTMLButtonElement>(`button[data-day="${key}"]`);
    button?.focus({ preventScroll: true });
  }, [focusDate]);

  return (
    <div ref={calendarRootRef} className="w-full" data-slot="calendar-view">
      <div className="flex items-center justify-center gap-1 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={i18n.previousMonth}
          title={i18n.previousMonth}
          className="text-muted-foreground hover:text-foreground"
          onClick={(event) => navigateMonth(-1, event.currentTarget)}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <Select value={String(month.getMonth())} onValueChange={selectMonth}>
          <SelectTrigger
            size="sm"
            aria-label={i18n.selectMonth}
            data-slot="calendar-month-select"
            className="w-[100px]"
          >
            <SelectValue>{monthNames[month.getMonth()]}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className={cn('sy-calendar-portal max-h-64', isDark && 'dark')}>
            {monthNames.map((name, index) => (
              <SelectItem key={name} value={String(index)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(selectedYear)} onValueChange={selectYear}>
          <SelectTrigger size="sm" aria-label={i18n.selectYear} data-slot="calendar-year-select" className="w-[100px]">
            <SelectValue>{selectedYear}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className={cn('sy-calendar-portal max-h-64', isDark && 'dark')}>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={i18n.nextMonth}
          title={i18n.nextMonth}
          className="text-muted-foreground hover:text-foreground"
          onClick={(event) => navigateMonth(1, event.currentTarget)}
        >
          <ChevronRightIcon className="size-4" />
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
        classNames={dayPickerClassNames}
        className="w-full pt-0"
      />
    </div>
  );
}
