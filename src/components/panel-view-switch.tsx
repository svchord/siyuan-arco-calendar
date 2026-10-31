import { useHost } from '@/lib/host';
import { cn } from '@/lib/utils';

export type PanelViewMode = 'calendar' | 'heatmap';

export function PanelViewSwitch({ view, onChange }: { view: PanelViewMode; onChange: (view: PanelViewMode) => void }) {
  const { i18n } = useHost();
  const items: Array<{ value: PanelViewMode; label: string }> = [
    { value: 'calendar', label: i18n.calendarView },
    { value: 'heatmap', label: i18n.heatmapView },
  ];

  return (
    <div
      role="tablist"
      aria-label={`${i18n.calendarView} / ${i18n.heatmapView}`}
      data-slot="calendar-view-switch"
      className="flex shrink-0 items-center gap-0.5 rounded-lg bg-muted/35 p-0.5"
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={view === item.value}
          data-slot="calendar-view-tab"
          data-panel-view={item.value}
          className={cn(
            'h-7 rounded-md px-2 text-xs font-medium transition-colors',
            view === item.value
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
