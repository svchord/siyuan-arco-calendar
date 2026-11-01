import { afterEach, describe, expect, it } from 'vitest';
import {
  CALENDAR_ICON_ID,
  CALENDAR_ICON_SVG,
  HOST_CALENDAR_ICON_ID,
  resolveCalendarIconId,
  watchForHostCalendarIcon,
} from './icons';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CALENDAR_ICON_SVG', () => {
  it('ships a self-contained icon that fills its view box', () => {
    expect(CALENDAR_ICON_SVG).toContain(`id="${CALENDAR_ICON_ID}"`);
    expect(CALENDAR_ICON_SVG).toContain('viewBox="2 2 20 20"');
  });
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

describe('watchForHostCalendarIcon', () => {
  it('calls back as soon as the icon theme inserts the host symbol', async () => {
    let calls = 0;
    const stop = watchForHostCalendarIcon(() => {
      calls += 1;
    });

    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    symbol.id = HOST_CALENDAR_ICON_ID;
    document.body.append(symbol);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls).toBe(1);
    stop();
  });

  it('calls back immediately when the host symbol already exists', () => {
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    symbol.id = HOST_CALENDAR_ICON_ID;
    document.body.append(symbol);

    let calls = 0;
    const stop = watchForHostCalendarIcon(() => {
      calls += 1;
    });
    stop();

    expect(calls).toBe(1);
  });
});
