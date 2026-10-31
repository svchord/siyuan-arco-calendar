import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalendarNotebook } from '@/api/notebook';
import type { DayActivity } from '@/types/domain';

export interface NoteActivityState {
  activity: Map<string, DayActivity>;
  refresh: () => Promise<boolean>;
}

export function useNoteActivity(notebook: CalendarNotebook | undefined, year: number | undefined): NoteActivityState {
  const [activity, setActivity] = useState<Map<string, DayActivity>>(() => new Map());
  const requestIdRef = useRef(0);

  const refresh = useCallback(async (): Promise<boolean> => {
    const requestId = ++requestIdRef.current;
    if (!notebook || !year) {
      setActivity(new Map());
      return true;
    }

    try {
      const next = await notebook.getActivity(year);
      if (requestId !== requestIdRef.current) {
        return true;
      }
      setActivity(next);
      return true;
    } catch {
      if (requestId === requestIdRef.current) {
        setActivity(new Map());
      }
      return false;
    }
  }, [notebook, year]);

  useEffect(() => {
    // Never show the previous notebook's heatmap while the new one is loading.
    setActivity(new Map());
    void refresh();
  }, [refresh]);

  return { activity, refresh };
}
