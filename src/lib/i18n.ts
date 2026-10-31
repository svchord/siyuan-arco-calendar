import type { PluginI18n } from '@/types/i18n';

export function formatMsg(i18n: PluginI18n, message: string): string {
  return `${i18n.msg.begin} ${message}`;
}
