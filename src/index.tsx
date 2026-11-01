import { createRoot, type Root } from 'react-dom/client';
import { Plugin, getFrontend } from 'siyuan';
import { CalendarApp } from '@/components/calendar-app';
import { DEFAULT_SETTINGS, isValidSettings, normalizeSettings, type PluginSettings } from '@/lib/storage';
import { type HostContextValue } from '@/lib/host';
import { CALENDAR_ICON_ID, CALENDAR_ICON_SVG, resolveCalendarIconId, watchForHostCalendarIcon } from '@/lib/icons';
import type { PluginI18n } from '@/types/i18n';
import './index.css';

const STORAGE_NAME = 'arco-calendar-entry';
const TOP_BAR_ID = 'arco-calendar-topbar';
const DOCK_ID = 'arco-calendar-dock';
const FALLBACK_WIDTH = 340;

interface AnchorRect {
  left: number;
  right: number;
  bottom: number;
}

export default class ArcoCalendarPlugin extends Plugin {
  private host!: HostContextValue;
  private i18nData!: PluginI18n;
  private settings: PluginSettings = { ...DEFAULT_SETTINGS };
  private isReadonly = false;
  private topElement?: HTMLElement;
  private popupElement?: HTMLElement;
  private popupRoot?: Root;
  private dockId?: string;
  private dockRoots = new Map<HTMLElement, Root>();
  private cleanupPopupListeners?: () => void;
  private popupResizeObserver?: ResizeObserver;
  private entryMounted = false;
  private topIconCleanup?: () => void;

  async onload() {
    this.i18nData = this.i18n as unknown as PluginI18n;
    this.host = {
      app: this.app,
      i18n: this.i18nData,
      eventBus: this.eventBus,
      isMobile: ['mobile', 'browser-mobile'].includes(getFrontend()),
    };
    this.isReadonly = Boolean(window.siyuan?.config?.readonly || window.siyuan?.isPublish);
    this.addIcons(CALENDAR_ICON_SVG);

    await this.loadSettings();
    if (this.isReadonly) {
      return;
    }
  }

  async onLayoutReady() {
    if (this.isReadonly) {
      return;
    }
    this.mountEntry();
  }

  async onDataChanged() {
    if (this.isReadonly) {
      return;
    }
    const previousPosition = this.settings.position;
    await this.loadSettings();
    if (previousPosition !== this.settings.position && this.entryMounted) {
      this.disposeEntry();
      this.mountEntry();
    } else {
      this.renderEntries();
    }
  }

  async onunload() {
    this.disposeEntry();
  }

  async uninstall() {
    await this.removeData(STORAGE_NAME).catch(() => {
      // The plugin is being removed; storage may already be unavailable.
    });
  }

  private async loadSettings() {
    const raw = await this.loadData(STORAGE_NAME).catch(() => null);
    this.settings = normalizeSettings(raw);
    if (!isValidSettings(raw)) {
      await this.saveData(STORAGE_NAME, this.settings).catch(() => {
        // A read-only publish session cannot persist plugin data.
      });
    }
  }

  private async updateSettings(patch: Partial<PluginSettings>) {
    const next = normalizeSettings({ ...this.settings, ...patch });
    if (JSON.stringify(next) === JSON.stringify(this.settings)) {
      return;
    }

    const previousPosition = this.settings.position;
    await this.saveData(STORAGE_NAME, next);
    this.settings = next;

    if (previousPosition !== next.position && this.entryMounted) {
      this.disposeEntry();
      this.mountEntry();
    } else {
      this.renderEntries();
    }
  }

  private readonly handleSettingsChange = (patch: Partial<PluginSettings>) => {
    void this.updateSettings(patch).catch(() => {
      // Keep the previous settings if persistence fails.
    });
  };

  private renderEntries() {
    const render = (root: Root | undefined) => {
      root?.render(
        <CalendarApp host={this.host} settings={this.settings} onSettingsChange={this.handleSettingsChange} />
      );
    };
    render(this.popupRoot);
    for (const root of this.dockRoots.values()) {
      render(root);
    }
    if (this.popupElement) {
      requestAnimationFrame(() => {
        if (this.popupElement) {
          this.positionPopup(this.popupElement, this.getAnchorRect());
        }
      });
    }
  }

  private mountEntry() {
    this.entryMounted = true;
    if (this.settings.position === 'dock') {
      this.addDockItem();
    } else {
      this.addTopItem(this.settings.position === 'top-right' ? 'right' : 'left');
    }
  }

  private disposeEntry() {
    this.entryMounted = false;
    this.topIconCleanup?.();
    this.topIconCleanup = undefined;
    this.closeCalendar();
    if (this.topElement) {
      this.removeTopBar(TOP_BAR_ID);
      this.topElement = undefined;
    }
    if (this.dockId) {
      this.removeDock(this.dockId);
      this.dockId = undefined;
    }
    for (const root of this.dockRoots.values()) {
      root.unmount();
    }
    this.dockRoots.clear();
  }

  private addTopItem(direction: 'left' | 'right') {
    const iconId = resolveCalendarIconId();
    this.topElement = this.addTopBar({
      id: TOP_BAR_ID,
      icon: iconId,
      title: this.i18nData.openCalendar,
      position: direction,
      callback: () => {
        this.toggleCalendar();
      },
    });

    this.topIconCleanup?.();
    this.topIconCleanup = undefined;
    if (iconId === CALENDAR_ICON_ID) {
      // The icon theme is still loading. Keep the fallback visible and switch
      // to the host symbol as soon as it appears, without a fixed delay.
      this.topIconCleanup = watchForHostCalendarIcon(() => {
        const use = this.topElement?.querySelector('use');
        use?.setAttribute('href', `#${resolveCalendarIconId()}`);
        use?.setAttribute('xlink:href', `#${resolveCalendarIconId()}`);
      });
    }
  }

  private addDockItem() {
    const dockRoots = this.dockRoots;
    const registration = this.addDock({
      id: DOCK_ID,
      config: {
        position: 'RightTop',
        size: { width: 380, height: 0 },
        icon: resolveCalendarIconId(),
        title: this.i18nData.tabName,
      },
      data: {},
      type: 'dock_tab',
      init: (dock) => {
        const element = dock.element as HTMLElement;
        element.classList.add('sy-calendar-dock');
        const root = createRoot(element);
        root.render(
          <CalendarApp host={this.host} settings={this.settings} onSettingsChange={this.handleSettingsChange} />
        );
        dockRoots.set(element, root);
      },
      destroy() {
        const element = this.element as HTMLElement;
        const root = dockRoots.get(element);
        root?.unmount();
        dockRoots.delete(element);
      },
    });
    this.dockId = registration.id;
  }

  private toggleCalendar() {
    if (this.popupElement) {
      this.closeCalendar();
      return;
    }
    this.openCalendar();
  }

  private openCalendar() {
    if (!this.topElement) {
      return;
    }

    const anchor = this.getAnchorRect();
    const popup = document.createElement('div');
    popup.className = 'sy-calendar-popup';
    popup.dataset.name = 'Calendar';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', this.i18nData.tabName);
    popup.tabIndex = -1;
    popup.style.visibility = 'hidden';
    document.body.append(popup);

    this.popupElement = popup;
    this.popupRoot = createRoot(popup);
    this.popupRoot.render(
      <CalendarApp host={this.host} settings={this.settings} onSettingsChange={this.handleSettingsChange} />
    );

    // Wait for React to render before measuring the panel height.
    requestAnimationFrame(() => {
      if (this.popupElement === popup) {
        this.positionPopup(popup, anchor);
        popup.focus({ preventScroll: true });
      }
    });

    const onOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (popup.contains(target) || this.topElement?.contains(target)) {
        return;
      }
      if (target instanceof Element && target.closest('.sy-calendar-portal')) {
        return;
      }
      this.closeCalendar();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeCalendar();
      }
    };
    const onWindowResize = () => {
      this.closeCalendar();
    };

    document.addEventListener('pointerdown', onOutsidePointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    this.popupResizeObserver = new ResizeObserver(() => {
      if (this.popupElement) {
        this.positionPopup(this.popupElement, this.getAnchorRect());
      }
    });
    this.popupResizeObserver.observe(popup);

    this.cleanupPopupListeners = () => {
      document.removeEventListener('pointerdown', onOutsidePointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onWindowResize);
    };
  }

  private positionPopup(popup: HTMLElement, anchor: AnchorRect) {
    const width = popup.offsetWidth || FALLBACK_WIDTH;
    const height = popup.offsetHeight || 430;
    const preferredLeft = this.settings.position === 'top-right' ? anchor.right - width : anchor.left;
    const left = Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(anchor.bottom + 4, window.innerHeight - height - 8));
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.visibility = 'visible';
  }

  private getAnchorRect(): AnchorRect {
    let rect: DOMRect | undefined = this.topElement?.getBoundingClientRect();
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

  private closeCalendar() {
    this.cleanupPopupListeners?.();
    this.cleanupPopupListeners = undefined;
    this.popupResizeObserver?.disconnect();
    this.popupResizeObserver = undefined;

    const root = this.popupRoot;
    this.popupRoot = undefined;
    root?.unmount();

    this.popupElement?.remove();
    this.popupElement = undefined;
  }
}
