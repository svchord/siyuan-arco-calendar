import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHost } from '@/lib/host';

export type PanelViewMode = 'calendar' | 'heatmap';

/**
 * Tab labels are curated to fit this budget: measured across all 22 SiYuan
 * locales the widest is ja "ヒートマップ" at 84px. The cap is layout insurance
 * only — an over-budget label ellipsises instead of squeezing the notebook
 * selector. Re-measure when a locale is added or a label is reworded.
 */
const TAB_LABEL = 'block max-w-[5.5rem] truncate';

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
          <span className={TAB_LABEL}>{i18n.calendarView}</span>
        </TabsTrigger>
        <TabsTrigger value="heatmap" data-panel-view="heatmap">
          <span className={TAB_LABEL}>{i18n.heatmapView}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
