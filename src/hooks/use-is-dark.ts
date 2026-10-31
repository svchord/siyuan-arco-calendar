import { useSyncExternalStore } from 'react';

function readIsDark(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const html = document.documentElement;
  const body = document.body;
  return (
    html.getAttribute('data-theme-mode') === 'dark' ||
    body?.getAttribute('data-theme-mode') === 'dark' ||
    html.classList.contains('dark') ||
    Boolean(body?.classList.contains('dark'))
  );
}

const listeners = new Set<() => void>();
let observer: MutationObserver | undefined;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!observer && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(notify);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode', 'class'],
    });
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-theme-mode', 'class'],
      });
    }
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = undefined;
    }
  };
}

/**
 * One shared observer for every plugin surface. Previously each component
 * created its own MutationObserver just to follow the host theme.
 */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, readIsDark, () => false);
}
