import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { useIsDark } from '@/hooks/use-is-dark';
import { cn } from '@/lib/utils';

type TruncatedTextProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  text: string;
};

const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 6;

/**
 * One line of text that ellipsises when its box is too narrow and reveals the
 * full string in a tooltip. Truncation is visual only: the whole text stays in
 * the DOM, so assistive technology never needs the tooltip.
 *
 * Only for text whose length the layout cannot bound (footer hint, setting
 * titles). Curated labels such as the view tabs are budgeted instead.
 */
export function TruncatedText({ text, className, tabIndex, ...props }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const isDark = useIsDark();

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) {
      return;
    }
    const measure = () => setTruncated(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  // Measure the bubble only once it is in the DOM, then clamp it to the viewport.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    const anchorElement = textRef.current;
    if (!open || !bubble || !anchorElement) {
      return;
    }
    const anchor = anchorElement.getBoundingClientRect();
    const rect = bubble.getBoundingClientRect();
    const left = Math.min(
      Math.max(anchor.left + anchor.width / 2 - rect.width / 2, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN)
    );
    const fitsAbove = anchor.top - ANCHOR_GAP - rect.height >= VIEWPORT_MARGIN;
    const top = fitsAbove ? anchor.top - ANCHOR_GAP - rect.height : anchor.bottom + ANCHOR_GAP;
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.top = `${Math.round(Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - rect.height - VIEWPORT_MARGIN)))}px`;
    bubble.style.visibility = 'visible';
  }, [open]);

  // A fixed bubble would drift away from its text while the panel scrolls.
  useEffect(() => {
    if (!open) {
      return;
    }
    const dismiss = () => setOpen(false);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  return (
    <>
      <span
        {...props}
        ref={textRef}
        className={cn('block truncate', className)}
        tabIndex={tabIndex ?? (truncated ? 0 : undefined)}
        onMouseEnter={() => truncated && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => truncated && setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {text}
      </span>
      {open && truncated
        ? createPortal(
            <div
              ref={bubbleRef}
              role="tooltip"
              className={cn(
                'sy-calendar-portal pointer-events-none fixed z-[100002] max-w-[min(20rem,calc(100vw-16px))] rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-xs leading-snug break-words whitespace-normal text-popover-foreground shadow-md ring-1 ring-foreground/10',
                isDark && 'dark'
              )}
              style={{ visibility: 'hidden' }}
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
