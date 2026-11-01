import { afterEach, describe, expect, it } from 'vitest';
import { CALENDAR_ICON_ID, HOST_CALENDAR_ICON_ID, resolveCalendarIconId } from './icons';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('resolveCalendarIconId', () => {
  it('falls back to the plugin-owned icon when the host symbol is missing', () => {
    expect(resolveCalendarIconId()).toBe(CALENDAR_ICON_ID);
  });

  it('uses the host calendar symbol when the active icon theme provides it', () => {
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    symbol.id = HOST_CALENDAR_ICON_ID;
    document.body.append(symbol);

    expect(resolveCalendarIconId()).toBe(HOST_CALENDAR_ICON_ID);
  });
});
