import * as React from 'react';
import { createPortal } from 'react-dom';
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

interface HoveredDay {
  dateLabel: string;
  blocks: number;
  hasDailyNote: boolean;
  anchor: { left: number; top: number; right: number; bottom: number };
}

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
  onOpenDailyNote?: (date: Date, dailyNoteId?: string) => void;
}

export function HeatmapView({
  year,
  activity,
  locale,
  weekStartsOn,
  refreshing,
  onYearChange,
  onRefresh,
  onOpenDailyNote,
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
  const [hovered, setHovered] = React.useState<HoveredDay | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const tooltipPositionedRef = React.useRef(false);
  const hideTimerRef = React.useRef<number | undefined>(undefined);
  const clearHideTimer = React.useCallback(() => {
    if (hideTimerRef.current !== undefined) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }
  }, []);
  const scheduleHide = React.useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = undefined;
      setHovered(null);
    }, 120);
  }, [clearHideTimer]);
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat(locale.code), [locale.code]);
  const tooltipVisible = hovered !== null;

  // A fixed-position tooltip would drift away from its cell while the panel scrolls.
  React.useEffect(() => {
    if (!tooltipVisible) {
      return;
    }
    const dismiss = () => setHovered(null);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [tooltipVisible]);

  React.useEffect(() => clearHideTimer, [clearHideTimer]);

  // Clamp against the rendered tooltip instead of assuming a fixed width; long
  // dates would otherwise overflow near the panel edges and look like it flickers.
  React.useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!hovered || !tooltip) {
      tooltipPositionedRef.current = false;
      return;
    }
    const anchor = hovered.anchor;
    const rect = tooltip.getBoundingClientRect();
    const gap = 6;
    const margin = 8;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const center = (anchor.left + anchor.right) / 2;
    const left = Math.min(
      Math.max(center - rect.width / 2, margin),
      Math.max(margin, viewportWidth - rect.width - margin)
    );
    const fitsAbove = anchor.top - gap - rect.height >= margin;
    const top = fitsAbove ? anchor.top - gap - rect.height : anchor.bottom + gap;
    const nextLeft = `${Math.round(left)}px`;
    const nextTop = `${Math.round(Math.max(margin, Math.min(top, viewportHeight - rect.height - margin)))}px`;

    if (!tooltipPositionedRef.current) {
      // Place the very first tooltip without an animation; only subsequent cell
      // changes should glide, otherwise it would slide in from the viewport corner.
      tooltip.style.transition = 'none';
      tooltip.style.left = nextLeft;
      tooltip.style.top = nextTop;
      tooltip.style.willChange = 'left, top';
      tooltip.style.visibility = 'visible';
      void tooltip.offsetWidth;
      tooltip.style.transition = 'left 140ms cubic-bezier(0.22, 1, 0.36, 1), top 140ms cubic-bezier(0.22, 1, 0.36, 1)';
      tooltipPositionedRef.current = true;
      return;
    }

    tooltip.style.left = nextLeft;
    tooltip.style.top = nextTop;
  }, [hovered]);

  const showTooltip = (element: HTMLElement, day: Date, entry: DayActivity | undefined) => {
    const rect = element.getBoundingClientRect();
    setHovered({
      dateLabel: format(day, 'PPP', { locale }),
      blocks: entry?.blocks ?? 0,
      hasDailyNote: entry?.id !== undefined,
      anchor: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    });
  };

  const openDailyNote = (day: Date, entry: DayActivity | undefined) => {
    setHovered(null);
    onOpenDailyNote?.(day, entry?.id);
  };

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
                const blocks = entry?.blocks ?? 0;
                const hasDailyNote = entry?.id !== undefined;
                const detail = `${blocks} ${i18n.heatmapBlocks}${hasDailyNote ? '' : ` · ${i18n.heatmapNoNote}`}`;
                const label = `${format(day, 'PPP', { locale })} · ${detail}`;

                return (
                  <div
                    key={dateStr}
                    aria-label={label}
                    role="img"
                    data-date={dateStr}
                    data-level={level}
                    data-blocks={blocks}
                    className={cn(
                      'relative aspect-square w-full rounded-[3px]',
                      LEVEL_CLASSES[level],
                      inSection && onOpenDailyNote && 'cursor-pointer',
                      !inSection && 'invisible'
                    )}
                    style={{ gridColumn: weekIndex + 2, gridRow: dayIndex + 2 }}
                    onMouseEnter={
                      inSection
                        ? (event) => {
                            clearHideTimer();
                            showTooltip(event.currentTarget, day, entry);
                          }
                        : undefined
                    }
                    onMouseLeave={inSection ? scheduleHide : undefined}
                    onClick={inSection && onOpenDailyNote ? () => openDailyNote(day, entry) : undefined}
                  />
                );
              })
            )}
          </div>
        ))}
      </div>

      {hovered &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            data-slot="heatmap-tooltip"
            className={cn(
              'sy-calendar-portal pointer-events-none fixed z-[100002] rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10',
              isDark && 'dark'
            )}
            style={{ visibility: 'hidden' }}
          >
            <div className="whitespace-nowrap text-[11px] font-medium leading-tight">{hovered.dateLabel}</div>
            <div className="mt-0.5 whitespace-nowrap text-[10px] leading-tight text-muted-foreground">
              {numberFormatter.format(hovered.blocks)} {i18n.heatmapBlocks}
              {!hovered.hasDailyNote && ` · ${i18n.heatmapNoNote}`}
            </div>
          </div>,
          document.body
        )}

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
