import type { App as VueApp } from 'vue';
import App from './App.vue';
import { Plugin, Setting, getFrontend } from 'siyuan';
import { app, i18n, isMobile, eventBus, position } from './hooks/useSiYuan';
import SySelect from './lib/SySelect.vue';
import './index.less';

const STORAGE_NAME = 'arco-calendar-entry';

export default class ArcoCalendarPlugin extends Plugin {
  private topEle!: HTMLElement;
  private calendarPopup?: HTMLElement;
  private calendarApp?: VueApp;
  private removePopupListeners?: () => void;

  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    eventBus.value = this.eventBus;
    isMobile.value = ['mobile', 'browser-mobile'].includes(getFrontend());
    this.init();
  }

  onunload() {
    this.topEle?.remove();
    this.closeCalendar();
  }

  private async init() {
    const data = await this.loadData(STORAGE_NAME);
    if (!data) {
      await this.saveData(STORAGE_NAME, { position: 'top-left' });
      await this.loadData(STORAGE_NAME);
      position.value = 'top-left';
    } else {
      position.value = data.position;
    }
    if (position.value === 'top-left') {
      this.addTopItem('left');
    } else if (position.value === 'top-right') {
      this.addTopItem('right');
    } else if (position.value === 'dock') {
      this.addDockItem();
    }
    this.initSetting();
  }

  private initSetting() {
    this.setting = new Setting({
      height: 'auto',
      width: '500px',
      confirmCallback: async () => {
        if (position.value !== this.data[STORAGE_NAME]) {
          await this.saveData(STORAGE_NAME, { position: position.value });
          window.location.reload();
        }
      },
    });
    const selectEle = document.createElement('div');
    createApp(SySelect).mount(selectEle);
    this.setting.addItem({
      title: i18n.value.position.title,
      actionElement: selectEle,
    });
  }

  private closeCalendar() {
    this.removePopupListeners?.();
    this.removePopupListeners = undefined;
    this.calendarApp?.unmount();
    this.calendarApp = undefined;
    this.calendarPopup?.remove();
    this.calendarPopup = undefined;
  }

  private addTopItem(direction: 'left' | 'right') {
    this.topEle = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: direction,
      callback: () => {
        if (this.calendarPopup) {
          this.closeCalendar();
          return;
        }
        let rect = this.topEle.getBoundingClientRect();
        const moreButton = document.querySelector('#barMore');
        if (rect.width === 0 && moreButton) rect = moreButton.getBoundingClientRect();
        // Mount directly: passing the Vue root through Menu can produce an empty
        // panel in newer SiYuan versions. This restores the working backup behavior.
        const width = Math.min(304, window.innerWidth - 16);
        const popup = document.createElement('div');
        popup.className = 'b3-menu arco-calendar-popup';
        popup.dataset.name = 'Calendar';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', this.i18n.tabName);
        Object.assign(popup.style, {
          position: 'fixed',
          zIndex: '99999',
          display: 'block',
          visibility: 'visible',
          opacity: '1',
          pointerEvents: 'auto',
          width: `${width}px`,
          minHeight: '0',
          overflow: 'auto',
          left: `${Math.max(8, Math.min(direction === 'left' ? rect.left : rect.right - width, window.innerWidth - width - 8))}px`,
          top: `${Math.max(8, Math.min(rect.bottom, window.innerHeight - 520))}px`,
        });
        const item = document.createElement('div');
        item.className = 'b3-menu__item';
        Object.assign(item.style, { display: 'block', width: '100%', margin: '0', padding: '0' });
        const root = document.createElement('div');
        Object.assign(root.style, { width: '100%', minHeight: '420px', boxSizing: 'border-box' });
        item.append(root);
        popup.append(item);
        document.body.append(popup);
        this.calendarPopup = popup;
        this.calendarApp = createApp(App);
        this.calendarApp.mount(root);
        const onOutsideClick = (event: MouseEvent) => {
          const target = event.target;
          if (!(target instanceof Node)) return;
          // Arco teleports the dropdown outside the calendar popup.
          const inDropdown =
            target instanceof Element && target.closest('.arco-trigger-popup:has(.arco-calendar-notebook-dropdown)');
          if (!popup.contains(target) && !this.topEle.contains(target) && !inDropdown) this.closeCalendar();
        };
        const onKeydown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') this.closeCalendar();
        };
        document.addEventListener('mousedown', onOutsideClick, true);
        document.addEventListener('keydown', onKeydown);
        this.removePopupListeners = () => {
          document.removeEventListener('mousedown', onOutsideClick, true);
          document.removeEventListener('keydown', onKeydown);
        };
      },
    });
  }

  private addDockItem() {
    const _plugin = this;
    this.addDock({
      config: {
        position: 'RightTop',
        size: { width: 300, height: 0 },
        icon: 'iconCalendar',
        title: _plugin.i18n.tabName,
      },
      data: {},
      type: 'dock_tab',
      init: dock => {
        createApp(App).mount(dock.element);
      },
    });
  }
}
