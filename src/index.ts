import App from './App.vue';
import { Plugin, Menu, Setting, getFrontend } from 'siyuan';
import { app, i18n, isMobile, eventBus, position, startDayOfWeek } from './hooks/useSiYuan';
import PositionSySelect from './lib/PositionSySelect.vue';
import StartDaySySelect from './lib/StartDaySySelect.vue';
import './index.less';

const STORAGE_NAME = 'arco-calendar-entry';

export default class ArcoCalendarPlugin extends Plugin {
  private topEle!: HTMLElement;
  private menuEle!: HTMLElement;

  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    eventBus.value = this.eventBus;
    isMobile.value = ['mobile', 'browser-mobile'].includes(getFrontend());
    this.init();
  }

  onunload() {
    this.topEle?.remove();
    this.menuEle?.remove();
  }

  private async init() {
    const data = await this.loadData(STORAGE_NAME);
    if (!data) {
      await this.saveData(STORAGE_NAME, { 
        position: 'top-left',
        startDayOfWeek: 'sun'
      });
      await this.loadData(STORAGE_NAME);
      position.value = 'top-left';
      startDayOfWeek.value = 'sun';
    } else {
      position.value = data.position;
      startDayOfWeek.value = data.startDayOfWeek;
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
        if (position.value !== this.data[STORAGE_NAME].position || startDayOfWeek.value !== this.data[STORAGE_NAME].startDayOfWeek) {
          await this.saveData(STORAGE_NAME, { 
            position: position.value,
            startDayOfWeek: startDayOfWeek.value
          });
          window.location.reload();
        }
      },
    });
    const selectEle = document.createElement('div');
    createApp(PositionSySelect).mount(selectEle);
    this.setting.addItem({
      title: i18n.value.position.title,
      actionElement: selectEle,
    });

    const startDayOfWeekEle = document.createElement('div');
    createApp(StartDaySySelect).mount(startDayOfWeekEle);
    this.setting.addItem({
        title: i18n.value.startDayOfWeek.title,
        actionElement: startDayOfWeekEle,
    });
  }

  private addTopItem(direction: 'left' | 'right') {
    this.topEle = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: direction,
      callback: () => {
        let rect = this.topEle.getBoundingClientRect();
        // 如果被隐藏，则使用更多按钮
        if (rect.width === 0) {
          rect = document.querySelector('#barMore')!.getBoundingClientRect();
        }
        const menu = new Menu('Calendar');
        menu.addItem({ element: this.menuEle });
        if (isMobile.value) {
          menu.fullscreen();
        } else {
          menu.open({
            x: rect[direction],
            y: rect.bottom,
            isLeft: direction !== 'left',
          });
        }
      },
    });
    this.menuEle = document.createElement('div');
    createApp(App).mount(this.menuEle);
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
