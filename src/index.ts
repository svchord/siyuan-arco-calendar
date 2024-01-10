import { createApp } from 'vue';
import App from './App.vue';
import { ConfigProvider, Select, DatePicker, Tabs } from '@arco-design/web-vue';
import { Plugin, Menu, getFrontend } from 'siyuan';

import './index.less';
import { i18n } from '@/hooks/useLocale';
import { app, isMobile } from './hooks/useSiYuan';
export default class ArcoCalendarPlugin extends Plugin {
  private isMobile!: boolean;
  public element!: HTMLElement;

  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === 'mobile' || frontEnd === 'browser-mobile';
    isMobile.value = this.isMobile;

    this.element = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: 'left',
      callback: () => {
        let rect = this.element.getBoundingClientRect();
        // 如果被隐藏，则使用更多按钮
        if (rect.width === 0) {
          rect = document.querySelector('#barMore')!.getBoundingClientRect();
        }
        this.addMenu(rect);
      },
    });
  }

  onunload() {
    this.element?.remove();
  }

  private addMenu(rect: DOMRect) {
    const ca = document.createElement('div');
    const app = createApp(App);
    app.use(ConfigProvider).use(Select).use(DatePicker).use(Tabs);
    app.mount(ca);

    const menu = new Menu('Calendar');
    menu.addItem({ element: ca });
    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.left,
        y: rect.bottom,
      });
    }
  }
}
