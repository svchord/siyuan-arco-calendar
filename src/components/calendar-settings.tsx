import type { ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PositionSelect } from '@/components/position-select';
import { useIsDark } from '@/hooks/use-is-dark';
import { useHost } from '@/lib/host';
import type { PluginSettings, WeekStart } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface CalendarSettingsProps {
  settings: PluginSettings;
  onChange: (patch: Partial<PluginSettings>) => void;
}

function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-5 px-3 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function CalendarSettings({ settings, onChange }: CalendarSettingsProps) {
  const { i18n } = useHost();
  const isDark = useIsDark();

  return (
    <div className={cn('sy-calendar-setting w-full', isDark && 'dark')} data-slot="calendar-settings">
      <p className="text-xs leading-5 text-muted-foreground">{i18n.settings.description}</p>
      <div className="mt-3 divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70 bg-background/40">
        <SettingRow title={i18n.position.title} description={i18n.position.description}>
          <PositionSelect
            value={settings.position}
            className="w-[160px]"
            onChange={(position) => onChange({ position })}
          />
        </SettingRow>

        <SettingRow title={i18n.weekStart.title} description={i18n.weekStart.description}>
          <Select
            value={String(settings.weekStartsOn)}
            onValueChange={(value) => {
              if (value !== null) {
                onChange({ weekStartsOn: Number(value) as WeekStart });
              }
            }}
          >
            <SelectTrigger size="sm" className="w-[130px]" aria-label={i18n.weekStart.title}>
              <SelectValue>{settings.weekStartsOn === 1 ? i18n.weekStart.monday : i18n.weekStart.sunday}</SelectValue>
            </SelectTrigger>
            <SelectContent className={cn('sy-calendar-portal z-[100000]', isDark && 'dark')}>
              <SelectItem value="1">{i18n.weekStart.monday}</SelectItem>
              <SelectItem value="0">{i18n.weekStart.sunday}</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow title={i18n.weekNumbers.title} description={i18n.weekNumbers.description}>
          <Switch
            checked={settings.showWeekNumbers}
            aria-label={i18n.weekNumbers.title}
            onCheckedChange={(checked) => onChange({ showWeekNumbers: checked })}
          />
        </SettingRow>

        <SettingRow title={i18n.taskMarkers.title} description={i18n.taskMarkers.description}>
          <Switch
            checked={settings.showTaskMarkers}
            aria-label={i18n.taskMarkers.title}
            onCheckedChange={(checked) => onChange({ showTaskMarkers: checked })}
          />
        </SettingRow>
      </div>
    </div>
  );
}
