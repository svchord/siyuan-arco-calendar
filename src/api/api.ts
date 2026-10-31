import { Constants, fetchSyncPost } from 'siyuan';
import type { IWebSocketData } from 'siyuan';
import type { BlockRow, DailyNoteInfo, DocumentId, Notebook, NotebookId, SystemConfResponse } from '@/types/domain';

/**
 * Thin typed wrapper around SiYuan's synchronous kernel API.
 * Returns `null` when the kernel reports a non-zero response code so callers
 * can distinguish a failed request from a successful empty payload.
 */
export async function request<T = unknown>(url: string, data?: unknown): Promise<T | null> {
  const response = (await fetchSyncPost(url, data)) as IWebSocketData;
  if (response?.code !== 0) {
    return null;
  }
  return response.data as T;
}

/**
 * `fetchSyncPost` normally runs SiYuan's `processMessage`, which shows the
 * kernel error toast. Callers that surface the error themselves use this
 * variant to avoid two notifications for one failure.
 */
const fetchWithoutMessage = fetchSyncPost as unknown as (
  url: string,
  data?: unknown,
  headers?: Record<string, string>,
  processMessage?: boolean
) => Promise<IWebSocketData>;

// **************************************** Notebook ****************************************

export function lsNotebooks(): Promise<{ notebooks: Notebook[] } | null> {
  return request('/api/notebook/lsNotebooks', {});
}

// **************************************** File tree ****************************************

export function getDailyNoteInfo(notebook: NotebookId, date: string): Promise<DailyNoteInfo | null> {
  return request('/api/filetree/getDailyNoteInfo', { notebook, date });
}

/**
 * Native daily-note creation. Besides the path/template/icon handling, the
 * kernel creates all missing parent documents idempotently for a given date,
 * which avoids the duplicate-parent problem of manual nested creation.
 */
export async function createDailyNote(notebook: NotebookId, date: string): Promise<DocumentId> {
  const response = await fetchWithoutMessage(
    '/api/filetree/createDailyNote',
    { notebook, app: Constants.SIYUAN_APPID, date },
    undefined,
    false
  );
  if (response?.code !== 0 || !response.data?.id) {
    throw new Error(response?.msg || 'Unable to create daily note');
  }
  return response.data.id as DocumentId;
}

// **************************************** Block ****************************************

export function batchSetBlockAttrs(blockAttrs: Array<{ id: string; attrs: Record<string, string> }>) {
  return request('/api/attr/batchSetBlockAttrs', { blockAttrs });
}

// **************************************** SQL ****************************************

export function sql<T extends BlockRow = BlockRow>(stmt: string): Promise<T[] | null> {
  return request('/api/query/sql', { stmt });
}

// **************************************** Storage ****************************************

export function getLocalStorage(): Promise<Record<string, string> | null> {
  return request('/api/storage/getLocalStorage');
}

export function setLocalStorageVal(key: string, val: string) {
  return request('/api/storage/setLocalStorageVal', {
    app: Constants.SIYUAN_APPID,
    key,
    val,
  });
}

// **************************************** System ****************************************

export function getSystemConf(): Promise<SystemConfResponse | null> {
  return request('/api/system/getConf');
}

export function flushTransaction() {
  return request('/api/sqlite/flushTransaction');
}

// **************************************** Notification ****************************************

export function pushErrMsg(msg: string, timeout = 7000) {
  return request('/api/notification/pushErrMsg', { msg, timeout });
}

export function pushMsg(msg: string, timeout = 2500) {
  return request('/api/notification/pushMsg', { msg, timeout });
}
