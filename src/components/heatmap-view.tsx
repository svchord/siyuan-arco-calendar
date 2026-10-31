import * as React from 'react';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  type Locale,
} from 'date-fns';
import { RefreshCwIcon } from 'lucide-react';
import { useIsDark } from '@/hooks/use-is-dark';
import { useHost } from '@/lib/host';
import { formatDisplayDate } from '@/lib/date';
import type { WeekStart } from '@/lib/storage';
import type { DayActivity } from '@/types/domain';
import { buildYearOptions } from '@/lib/years';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const LEVEL_CLASSES = ['bg-muted/45', 'bg-primary/15', 'bg-primary/30', 'bg-primary/45', 'bg-primary/65', 'bg-primary'];

function activityLevel(entry: DayActivity | undefined) {
  if (!entry) return 0;
  if (entry.blocks <= 0) return 1;
  if (entry.blocks <= 3) return 2;
  if (entry.blocks <= 8) return 3;
  if (entry.blocks <= 15) return 4;
  return 5;
}

interface HeatmapSection {
  key: string;
  start: Date;
  end: Date;
  weeks: Date[][];
  monthLabels: Array<{ label: string; start: number; span: number }>;
  weekdayLabels: string[];
}

function buildSection(key: string, start: Date, end: Date, weekStartsOn: WeekStart, locale: Locale): HeatmapSection {
  const gridStart = startOfWeek(start, { weekStartsOn });
  const gridEnd = endOfWeek(end, { weekStartsOn });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  const months = eachMonthOfInterval({ start, end });
  const monthLabels = months.map((month, index) => {
    const monthStart = startOfMonth(month);
    const nextMonthStart = index === months.length - 1 ? gridEnd : startOfMonth(months[index + 1]);
    const startWeek = Math.floor(differenceInCalendarDays(monthStart, gridStart) / 7);
    const nextWeek = Math.min(weeks.length, Math.ceil((differenceInCalendarDays(nextMonthStart, gridStart) + 1) / 7));
    return {
      label: format(monthStart, 'MMM', { locale }),
      start: startWeek,
      span: Math.max(1, nextWeek - startWeek),
    };
  });

  return {
    key,
    start,
    end,
    weeks,
    monthLabels,
    weekdayLabels: Array.from({ length: 7 }, (_, index) => format(days[index], 'EEEEE', { locale })),
  };
}

interface HeatmapViewProps {
  year: number;
  activity: Map<string, DayActivity>;
  locale: Locale;
  weekStartsOn: WeekStart;
  refreshing: boolean;
  onYearChange: (year: number) => void;
  onRefresh: () => void;
}

export function HeatmapView({
  year,
  activity,
  locale,
  weekStartsOn,
  refreshing,
  onYearChange,
  onRefresh,
}: HeatmapViewProps) {
  const { i18n } = useHost();
  const isDark = useIsDark();
  const years = React.useMemo(() => buildYearOptions(), []);
  const sections = React.useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const midYear = new Date(year, 6, 1);
    return [
      buildSection('h1', yearStart, endOfMonth(new Date(year, 5, 1)), weekStartsOn, locale),
      buildSection('h2', midYear, endOfYear(yearStart), weekStartsOn, locale),
    ];
  }, [locale, weekStartsOn, year]);

  return (
    <div className="w-full" data-slot="calendar-heatmap">
      <div className="flex items-center justify-center gap-1 py-1">
        <div className="flex items-center gap-1 rounded-lg bg-muted/35 p-0.5">
          <Select value={String(year)} onValueChange={(value) => value && onYearChange(Number(value))}>
            <SelectTrigger
              size="sm"
              aria-label={i18n.selectYear}
              data-slot="heatmap-year-select"
              className="h-7 w-[92px] justify-between border-0 bg-transparent px-2 text-xs font-medium shadow-none hover:bg-background/70"
            >
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              sideOffset={6}
              className={cn('sy-calendar-portal z-[100000] max-h-48 min-w-[96px]', isDark && 'dark')}
            >
              {years.map((yearOption) => (
                <SelectItem key={yearOption} value={String(yearOption)}>
                  {yearOption}
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

      <div className="mt-2 space-y-3">
        {sections.map((section) => (
          <div
            key={section.key}
            className="grid w-full"
            style={{
              gridTemplateColumns: `18px repeat(${section.weeks.length}, minmax(0, 1fr))`,
              gridTemplateRows: '14px repeat(7, auto)',
              columnGap: '2px',
              rowGap: '2px',
            }}
          >
            {section.monthLabels.map((month) => (
              <div
                key={`${month.label}-${month.start}`}
                className="truncate text-[9px] leading-none text-muted-foreground"
                style={{ gridColumn: `${month.start + 2} / span ${month.span}`, gridRow: 1 }}
              >
                {month.label}
              </div>
            ))}
            {section.weekdayLabels.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="flex items-center justify-end pr-1 text-[7px] leading-none text-muted-foreground"
                style={{ gridColumn: 1, gridRow: index + 2 }}
              >
                {index % 2 === 0 ? label : ''}
              </div>
            ))}
            {section.weeks.map((week, weekIndex) =>
              week.map((day, dayIndex) => {
                const dateStr = formatDisplayDate(day);
                const entry = activity.get(dateStr);
                const inSection = day >= section.start && day <= section.end;
                const level = activityLevel(entry);
                const detail = entry ? `${entry.blocks} ${i18n.heatmapBlocks}` : i18n.heatmapNoNote;
                const label = `${format(day, 'PPP', { locale })} · ${detail}`;

                return (
                  <div
                    key={dateStr}
                    title={label}
                    aria-label={label}
                    role="img"
                    data-date={dateStr}
                    data-level={level}
                    className={cn(
                      'relative aspect-square w-full rounded-[3px]',
                      LEVEL_CLASSES[level],
                      !inSection && 'invisible'
                    )}
                    style={{ gridColumn: weekIndex + 2, gridRow: dayIndex + 2 }}
                  />
                );
              })
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>{i18n.heatmapLess}</span>
        {LEVEL_CLASSES.slice(1).map((className) => (
          <span key={className} className={cn('size-2.5 rounded-[2px]', className)} />
        ))}
        <span>{i18n.heatmapMore}</span>
      </div>
    </div>
  );
}
