import { describe, expect, it } from 'vitest';
import { parseDailyNoteRows } from './daily-note-rows';

describe('daily note helpers', () => {
  it('parses daily note rows from their custom attributes', () => {
    const notes = parseDailyNoteRows([
      { id: 'doc1', ial: '{: custom-dailynote-20261001="20261001"}' },
      { id: 'doc2', ial: '{: custom-dailynote-20261030="20261030"}' },
      { id: 'doc3', ial: '{: other="value"}' },
      { id: 'doc4', ial: '{: custom-dailynote-20261399="20261399"}' },
    ]);
    expect(notes).toEqual([
      { id: 'doc1', dateStr: '2026-10-01' },
      { id: 'doc2', dateStr: '2026-10-30' },
    ]);
  });
});
