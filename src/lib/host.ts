import { createContext, useContext } from 'react';
import type { App, EventBus } from 'siyuan';
import type { PluginI18n } from '@/types/i18n';

export interface HostContextValue {
  app: App;
  i18n: PluginI18n;
  eventBus: EventBus;
  isMobile: boolean;
}

export const HostContext = createContext<HostContextValue | null>(null);

export function useHost(): HostContextValue {
  const context = useContext(HostContext);
  if (!context) {
    throw new Error('useHost must be used inside a HostContext.Provider');
  }
  return context;
}
