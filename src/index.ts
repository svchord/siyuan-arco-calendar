import App from './App.vue';
import { Plugin, Menu, Setting, getFrontend } from 'siyuan';
import { app, i18n, isMobile, eventBus } from './hooks/useSiYuan';
import './index.less';

export default class ArcoCalendarPlugin extends Plugin {
  public topEle!: HTMLElement;
  public menuEle!: HTMLElement;

  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    eventBus.value = this.eventBus;
    isMobile.value = ['mobile', 'browser-mobile'].includes(getFrontend());
    this.addDockItem();
    this.addTopItem();
    this.setting = new Setting({ height: '400px', width: '400px' });
  }

  onunload() {
    this.topEle?.remove();
    this.menuEle?.remove();
  }

  private addTopItem() {
    this.topEle = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: 'left',
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
            x: rect.left,
            y: rect.bottom,
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
