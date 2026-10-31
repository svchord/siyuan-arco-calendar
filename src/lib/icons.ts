/**
 * A plugin-owned calendar icon. Relying on the host's `iconCalendar` symbol is
 * fragile across SiYuan icon themes, so ship a small self-contained glyph.
 */
export const CALENDAR_ICON_ID = 'iconArcoCalendar';

export const CALENDAR_ICON_SVG = `<symbol id="${CALENDAR_ICON_ID}" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm11 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Z"/>
  <path fill="currentColor" d="M8 12h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2ZM8 15h2v2H8v-2Zm3 0h2v2h-2v-2Z"/>
</symbol>`;
