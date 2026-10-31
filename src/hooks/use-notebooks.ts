import { useCallback, useEffect, useRef, useState } from 'react';
import type { IWebSocketData } from 'siyuan';
import { getLocalStorage, lsNotebooks, setLocalStorageVal } from '@/api/api';
import { useHost } from '@/lib/host';
import { CalendarNotebook } from '@/api/notebook';
import type { Notebook } from '@/types/domain';

const DAILY_NOTE_STORAGE_KEY = 'local-dailynoteid';
const NOTEBOOK_CHANGE_COMMANDS = new Set(['createnotebook', 'mount', 'unmount']);

function buildNotebooks(notebooks: Notebook[]): CalendarNotebook[] {
  return notebooks.map((notebook) => new CalendarNotebook(notebook.id, notebook.name));
}

export interface NotebooksState {
  notebooks: CalendarNotebook[];
  selectedNotebook: CalendarNotebook | undefined;
  selectedNotebookId: string | undefined;
  loading: boolean;
  selectNotebook: (id: string) => Promise<void>;
  refresh: () => Promise<boolean>;
}

export function useNotebooks(): NotebooksState {
  const { eventBus } = useHost();
  const [notebooks, setNotebooks] = useState<CalendarNotebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const persistedNotebookIdRef = useRef<string | undefined>(undefined);

  const load = useCallback(async (initial = false): Promise<boolean> => {
    const requestId = ++requestIdRef.current;
    if (initial) {
      setLoading(true);
    }
    try {
      const [notebookResponse, storage] = await Promise.all([lsNotebooks(), getLocalStorage()]);
      if (!notebookResponse) {
        return false;
      }
      const openNotebooks = notebookResponse.notebooks.filter((notebook) => !notebook.closed);
      const built = buildNotebooks(openNotebooks);
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return true;
      }

      const stored = storage?.[DAILY_NOTE_STORAGE_KEY];
      persistedNotebookIdRef.current = typeof stored === 'string' ? stored : undefined;
      setNotebooks(built);
      setSelectedNotebookId((current) => {
        const preferred = current ?? persistedNotebookIdRef.current;
        return preferred && built.some((notebook) => notebook.id === preferred) ? preferred : undefined;
      });
      return true;
    } catch {
      // Keep the previous list on a transient refresh failure.
      return false;
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load(true);
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    const onMessage = (event: CustomEvent<IWebSocketData>) => {
      const command = event.detail?.cmd;
      if (command && NOTEBOOK_CHANGE_COMMANDS.has(command)) {
        void load(false);
      }
    };
    eventBus.on('ws-main', onMessage);
    return () => eventBus.off('ws-main', onMessage);
  }, [eventBus, load]);

  const selectNotebook = useCallback(async (id: string) => {
    setSelectedNotebookId(id);
    if (persistedNotebookIdRef.current === id) {
      return;
    }
    persistedNotebookIdRef.current = id;
    await setLocalStorageVal(DAILY_NOTE_STORAGE_KEY, id);
  }, []);

  return {
    notebooks,
    selectedNotebook: notebooks.find((notebook) => notebook.id === selectedNotebookId),
    selectedNotebookId,
    loading,
    selectNotebook,
    refresh: () => load(false),
  };
}
