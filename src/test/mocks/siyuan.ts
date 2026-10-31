import { vi } from 'vitest';

export const fetchSyncPost = vi.fn(async (): Promise<{ code: number; msg: string; data: unknown }> => ({
  code: 0,
  msg: '',
  data: null,
}));
export const openTab = vi.fn(async (): Promise<void> => undefined);
export const openMobileFileById = vi.fn((..._args: unknown[]): void => undefined);
export const getFrontend = vi.fn((): string => 'desktop');
export const Constants = {
  SIYUAN_APPID: 'test-app',
};

export class Plugin {}
export class Setting {}
