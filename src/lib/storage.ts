export type EntryPosition = 'top-left' | 'top-right' | 'dock';
export type WeekStart = 0 | 1;

export interface PluginSettings {
  position: EntryPosition;
  weekStartsOn: WeekStart;
  showWeekNumbers: boolean;
  showTaskMarkers: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  position: 'top-left',
  weekStartsOn: 1,
  showWeekNumbers: false,
  showTaskMarkers: true,
};

const POSITIONS: EntryPosition[] = ['top-left', 'top-right', 'dock'];

export function isEntryPosition(value: unknown): value is EntryPosition {
  return typeof value === 'string' && POSITIONS.includes(value as EntryPosition);
}

export function isWeekStart(value: unknown): value is WeekStart {
  return value === 0 || value === 1;
}

export function isValidSettings(value: unknown): value is PluginSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const settings = value as Partial<PluginSettings>;
  return (
    isEntryPosition(settings.position) &&
    isWeekStart(settings.weekStartsOn) &&
    typeof settings.showWeekNumbers === 'boolean' &&
    typeof settings.showTaskMarkers === 'boolean'
  );
}

export function normalizeSettings(value: unknown): PluginSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  const settings = value as Partial<PluginSettings>;
  return {
    position: isEntryPosition(settings.position) ? settings.position : DEFAULT_SETTINGS.position,
    weekStartsOn: isWeekStart(settings.weekStartsOn) ? settings.weekStartsOn : DEFAULT_SETTINGS.weekStartsOn,
    showWeekNumbers:
      typeof settings.showWeekNumbers === 'boolean' ? settings.showWeekNumbers : DEFAULT_SETTINGS.showWeekNumbers,
    showTaskMarkers:
      typeof settings.showTaskMarkers === 'boolean' ? settings.showTaskMarkers : DEFAULT_SETTINGS.showTaskMarkers,
  };
}
