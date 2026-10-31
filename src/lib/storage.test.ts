import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, isValidSettings, normalizeSettings } from './storage';

describe('plugin settings', () => {
  it('normalizes each supported entry position', () => {
    expect(normalizeSettings({ position: 'top-left' }).position).toBe('top-left');
    expect(normalizeSettings({ position: 'top-right' }).position).toBe('top-right');
    expect(normalizeSettings({ position: 'dock' }).position).toBe('dock');
  });

  it('keeps calendar display preferences', () => {
    expect(
      normalizeSettings({
        position: 'top-left',
        weekStartsOn: 0,
        showWeekNumbers: true,
        showTaskMarkers: false,
      })
    ).toEqual({
      position: 'top-left',
      weekStartsOn: 0,
      showWeekNumbers: true,
      showTaskMarkers: false,
    });
  });

  it('migrates old settings that only contain a position', () => {
    expect(normalizeSettings({ position: 'top-right' })).toEqual({
      ...DEFAULT_SETTINGS,
      position: 'top-right',
    });
    expect(isValidSettings({ position: 'top-right' })).toBe(false);
  });

  it('falls back to defaults for missing or invalid data', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('')).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ position: 'somewhere' })).toEqual(DEFAULT_SETTINGS);
    expect(isValidSettings({ ...DEFAULT_SETTINGS })).toBe(true);
    expect(isValidSettings({})).toBe(false);
  });
});
