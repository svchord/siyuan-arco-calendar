import { CALENDAR_PANEL_WIDTH } from '@/lib/layout';

/**
 * Placement for the calendar popup.
 *
 * SiYuan offers no general-purpose floating-layer API to plugins: `addFloatLayer`
 * renders its own ref/backlink preview cards (it requires `refDefs` and owns the
 * markup), and `IPosition` only types `Protyle.showMenu`. The panel therefore has
 * to place itself, which is what this module does.
 *
 * Three things the host does not do for us:
 *   - the topbar entry can be collapsed into the "more"/"plugins" overflow menus,
 *     so the anchor needs fallbacks,
 *   - the panel must stay inside the viewport on small windows,
 *   - when the entry sits on the right, the panel aligns to its right edge.
 */

/** Viewport rect the popup is anchored to (the topbar entry or its fallback). */
export interface AnchorRect {
  left: number;
  right: number;
  bottom: number;
}

const VIEWPORT_MARGIN = 8;
const ANCHOR_GAP = 4;
const FALLBACK_HEIGHT = 430;

/**
 * Place the popup below its anchor, clamped inside the viewport. Pure DOM math so
 * it can be reused from the initial mount and the resize observer.
 */
export function positionPopup(popup: HTMLElement, anchor: AnchorRect, alignRight: boolean): void {
  const width = popup.offsetWidth || CALENDAR_PANEL_WIDTH;
  const height = popup.offsetHeight || FALLBACK_HEIGHT;
  const preferredLeft = alignRight ? anchor.right - width : anchor.left;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(preferredLeft, window.innerWidth - width - VIEWPORT_MARGIN));
  const top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchor.bottom + ANCHOR_GAP, window.innerHeight - height - VIEWPORT_MARGIN)
  );
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  popup.style.visibility = 'visible';
}

/**
 * Locate the topbar entry to anchor the popup to. The entry may be hidden inside
 * the "more"/"plugins" overflow menus, in which case those act as the anchor.
 */
export function getAnchorRect(topElement: HTMLElement | undefined): AnchorRect {
  let rect: DOMRect | undefined = topElement?.getBoundingClientRect();
  if (!rect || rect.width === 0) {
    const moreButton = document.querySelector('#barMore');
    if (moreButton) {
      rect = moreButton.getBoundingClientRect();
    }
  }
  if (!rect || rect.width === 0) {
    const pluginsButton = document.querySelector('#barPlugins');
    if (pluginsButton) {
      rect = pluginsButton.getBoundingClientRect();
    }
  }
  if (!rect || rect.width === 0) {
    return { left: window.innerWidth - 44, right: window.innerWidth - 12, bottom: 36 };
  }
  return { left: rect.left, right: rect.right, bottom: rect.bottom };
}
