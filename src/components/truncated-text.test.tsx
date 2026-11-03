import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TruncatedText } from './truncated-text';

const LONG_TEXT = 'Click a date to open or create a daily note';

/** jsdom has no layout, so every box reports 0: fake the overflow instead. */
function stubTextWidth({ overflow }: { overflow: boolean }) {
  const define = (name: 'scrollWidth' | 'clientWidth', value: number) => {
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
  };
  define('scrollWidth', overflow ? 200 : 100);
  define('clientWidth', 100);
  return () => {
    delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth;
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
  };
}

describe('TruncatedText', () => {
  afterEach(() => {
    document.querySelectorAll('[role="tooltip"]').forEach((element) => element.remove());
  });

  it('renders the text without a tooltip when it fits', () => {
    const restore = stubTextWidth({ overflow: false });
    try {
      render(<TruncatedText text={LONG_TEXT} />);

      const text = screen.getByText(LONG_TEXT);
      fireEvent.mouseOver(text);
      expect(screen.queryByRole('tooltip')).toBeNull();
      expect(text).not.toHaveAttribute('tabindex');
    } finally {
      restore();
    }
  });

  it('reveals the full text on hover when truncated', async () => {
    const restore = stubTextWidth({ overflow: true });
    try {
      render(<TruncatedText text={LONG_TEXT} />);

      const text = screen.getByText(LONG_TEXT);
      expect(text).toHaveAttribute('tabindex', '0');

      fireEvent.mouseOver(text);
      expect(await screen.findByRole('tooltip')).toHaveTextContent(LONG_TEXT);

      fireEvent.mouseOut(text);
      await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    } finally {
      restore();
    }
  });

  it('reveals the full text on keyboard focus when truncated', async () => {
    const restore = stubTextWidth({ overflow: true });
    try {
      render(<TruncatedText text={LONG_TEXT} />);

      const text = screen.getByText(LONG_TEXT);
      text.focus();
      expect(await screen.findByRole('tooltip')).toHaveTextContent(LONG_TEXT);

      text.blur();
      await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    } finally {
      restore();
    }
  });
});
