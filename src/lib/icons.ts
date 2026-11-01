/**
 * Plugin-owned fallback calendar icon. Prefer SiYuan's built-in `iconCalendar`
 * symbol when it exists so the top-bar icon follows the active icon theme;
 * keep this self-contained glyph for hosts/icon packs that omit that symbol.
 */
export const CALENDAR_ICON_ID = 'iconArcoCalendar';
export const HOST_CALENDAR_ICON_ID = 'iconCalendar';

export const CALENDAR_ICON_SVG = `<symbol id="${CALENDAR_ICON_ID}" viewBox="2 2 20 20">
  <path fill="currentColor" d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm11 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Z"/>
  <path fill="currentColor" d="M8 12h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2ZM8 15h2v2H8v-2Zm3 0h2v2h-2v-2Z"/>
</symbol>`;

/** Use the host icon when available so icon-theme changes are inherited. */
export function resolveCalendarIconId(): string {
  return typeof document !== 'undefined' && document.getElementById(HOST_CALENDAR_ICON_ID)
    ? HOST_CALENDAR_ICON_ID
    : CALENDAR_ICON_ID;
}

/**
 * Watch for the active icon theme inserting its host symbol. Icon resources
 * load asynchronously, so this resolves the choice as soon as the symbol is
 * available without relying on a fixed timeout.
 */
export function watchForHostCalendarIcon(onReady: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => undefined;
  }
  if (document.getElementById(HOST_CALENDAR_ICON_ID)) {
    onReady();
    return () => undefined;
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById(HOST_CALENDAR_ICON_ID)) {
      observer.disconnect();
      onReady();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}
