import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { startOfMonth } from 'date-fns';
import type { IWebSocketData } from 'siyuan';
import { flushTransaction, pushErrMsg } from '@/api/api';
import { openDoc } from '@/api/open-doc';
import { formatDisplayDate } from '@/lib/date';
import { formatMsg } from '@/lib/i18n';
import { useHost } from '@/lib/host';
import type { DailyNote } from '@/types/domain';
import type { CalendarNotebook } from '@/api/notebook';

const DAILY_NOTE_CHANGE_COMMANDS = new Set(['removeDoc', 'createdailynote']);

export interface DailyNotesState {
  month: Date;
  existMap: Map<string, DailyNote>;
  selectedDate: Date | undefined;
  refresh: () => Promise<boolean>;
  changeMonth: (date: Date) => void;
  openDailyNote: (date: Date) => Promise<void>;
  goToToday: () => Promise<void>;
}

export function useDailyNotes(notebook: CalendarNotebook | undefined): DailyNotesState {
  const { app, eventBus, i18n, isMobile } = useHost();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [existMap, setExistMap] = useState<Map<string, DailyNote>>(() => new Map());
  const [selectedDate, setSelectedDate] = useState<Date>();

  const pendingRef = useRef(new Set<string>());
  const previousNotebookIdRef = useRef<string | undefined>(undefined);
  const requestIdRef = useRef(0);
  const refreshRef = useRef<() => Promise<boolean>>(async () => true);

  const refresh = useCallback(async (): Promise<boolean> => {
    const requestId = ++requestIdRef.current;
    if (!notebook) {
      setExistMap(new Map());
      return true;
    }

    try {
      const notes = await notebook.getExistDailyNotesAround(month);
      if (requestId !== requestIdRef.current) {
        return true;
      }
      const next = new Map<string, DailyNote>();
      for (const note of notes) {
        next.set(note.dateStr, note);
      }
      setExistMap(next);
      return true;
    } catch {
      if (requestId === requestIdRef.current) {
        setExistMap(new Map());
      }
      return false;
    }
  }, [notebook, month]);

  useEffect(() => {
    const notebookId = notebook?.id;
    if (previousNotebookIdRef.current !== notebookId) {
      previousNotebookIdRef.current = notebookId;
      setExistMap(new Map());
      setSelectedDate(undefined);
    }
    void refresh();
  }, [notebook, month, refresh]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const onMessage = async (event: CustomEvent<IWebSocketData>) => {
      const command = event.detail?.cmd;
      if (command && DAILY_NOTE_CHANGE_COMMANDS.has(command)) {
        await flushTransaction();
        await refreshRef.current();
      }
    };
    eventBus.on('ws-main', onMessage);
    return () => eventBus.off('ws-main', onMessage);
  }, [eventBus]);

  const changeMonth = useCallback((date: Date) => {
    setMonth(startOfMonth(date));
  }, []);

  const openDailyNote = useCallback(
    async (date: Date) => {
      if (!notebook) {
        await pushErrMsg(formatMsg(i18n, i18n.msg.notNoteBook));
        return;
      }

      const key = formatDisplayDate(date);
      if (pendingRef.current.has(key)) {
        return;
      }

      setSelectedDate(date);
      const existing = existMap.get(key);
      if (existing) {
        openDoc(app, existing.id, isMobile);
        return;
      }

      pendingRef.current.add(key);
      try {
        const note = await notebook.createDailyNote(date);
        setExistMap((current) => new Map(current).set(note.dateStr, note));
        openDoc(app, note.id, isMobile);
      } catch (error) {
        const detail = error instanceof Error && error.message ? `: ${error.message}` : '';
        await pushErrMsg(`${formatMsg(i18n, i18n.msg.createFailed)}${detail}`);
      } finally {
        pendingRef.current.delete(key);
      }
    },
    [app, existMap, i18n, isMobile, notebook]
  );

  const goToToday = useCallback(async () => {
    const today = new Date();
    setMonth(startOfMonth(today));
    setSelectedDate(today);
    await openDailyNote(today);
  }, [openDailyNote]);

  return useMemo(
    () => ({
      month,
      existMap,
      selectedDate,
      refresh,
      changeMonth,
      openDailyNote,
      goToToday,
    }),
    [month, existMap, selectedDate, refresh, changeMonth, openDailyNote, goToToday]
  );
}
