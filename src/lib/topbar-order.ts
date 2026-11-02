import { request } from '@/api/api';

/**
 * The host re-sorts topbar entries by `entryVisibility`. `addTopBar` only changes
 * `data-location`, so switching the entry position also requires moving this one
 * entry in the persisted order. Other plugins and the dock order are left alone.
 *
 * Returns true when the order was actually written.
 */
export async function syncTopBarOrder(entryKey: string | undefined, direction: 'left' | 'right'): Promise<boolean> {
  if (!entryKey) {
    return false;
  }

  const entryVisibility = (
    window.siyuan?.config as unknown as {
      appearance?: { entryVisibility?: EntryVisibility };
    }
  )?.appearance?.entryVisibility;
  if (!entryVisibility) {
    return false;
  }

  const profile = entryVisibility.profiles.find((item) => item.id === entryVisibility.active);
  const currentOrder = profile?.orders?.topBar;
  if (!profile || !currentOrder) {
    return false;
  }

  const nextOrder = currentOrder.filter((key) => key !== entryKey);
  const dragIndex = nextOrder.indexOf('drag');
  if (dragIndex === -1) {
    return false;
  }
  nextOrder.splice(direction === 'left' ? dragIndex : dragIndex + 1, 0, entryKey);
  if (nextOrder.every((key, index) => key === currentOrder[index])) {
    return false;
  }

  const nextEntryVisibility = {
    ...entryVisibility,
    profiles: entryVisibility.profiles.map((item) =>
      item.id === profile.id ? { ...item, orders: { ...item.orders, topBar: nextOrder } } : item
    ),
  };
  await request('/api/setting/setEntryVisibility', nextEntryVisibility);
  return true;
}

interface EntryVisibilityProfile {
  id: string;
  orders?: Record<string, string[]>;
}

interface EntryVisibility {
  active: string;
  profiles: EntryVisibilityProfile[];
  [key: string]: unknown;
}
