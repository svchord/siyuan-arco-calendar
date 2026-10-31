import type { HostContextValue } from '@/lib/host';
import { HostContext } from '@/lib/host';
import type { PluginSettings } from '@/lib/storage';
import { CalendarPanel } from './calendar-panel';

export function CalendarApp({
  host,
  settings,
  onSettingsChange,
}: {
  host: HostContextValue;
  settings: PluginSettings;
  onSettingsChange: (patch: Partial<PluginSettings>) => void;
}) {
  return (
    <HostContext.Provider value={host}>
      <CalendarPanel settings={settings} onSettingsChange={onSettingsChange} />
    </HostContext.Provider>
  );
}
