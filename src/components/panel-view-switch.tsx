import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHost } from '@/lib/host';

export type PanelViewMode = 'calendar' | 'heatmap';

export function PanelViewSwitch({ view, onChange }: { view: PanelViewMode; onChange: (view: PanelViewMode) => void }) {
  const { i18n } = useHost();

  return (
    <Tabs
      value={view}
      onValueChange={(value) => onChange(value as PanelViewMode)}
      data-slot="calendar-view-switch"
      className="shrink-0 gap-0"
    >
      <TabsList aria-label={`${i18n.calendarView} / ${i18n.heatmapView}`}>
        <TabsTrigger value="calendar" data-panel-view="calendar">
          {i18n.calendarView}
        </TabsTrigger>
        <TabsTrigger value="heatmap" data-panel-view="heatmap">
          {i18n.heatmapView}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
