import { createApp } from 'vue';
import App from './App.vue';
import { ConfigProvider, Select, DatePicker, Tabs } from '@arco-design/web-vue';
import { Plugin, Menu, getFrontend } from 'siyuan';

import './index.less';
import { i18n } from '@/hooks/useLocale';
import { app, isMobile } from './hooks/useSiYuan';
export default class ArcoCalendarPlugin extends Plugin {
  public topEle!: HTMLElement;
  public menuEle!: HTMLElement;

  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    const frontEnd = getFrontend();
    isMobile.value = frontEnd === 'mobile' || frontEnd === 'browser-mobile';

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
        this.addMenu(rect);
      },
    });

    const vueApp = createApp(App);
    vueApp.use(ConfigProvider).use(Select).use(DatePicker).use(Tabs);
    this.menuEle = document.createElement('div');
    vueApp.mount(this.menuEle);
  }

  onunload() {
    this.topEle?.remove();
  }

  private addMenu(rect: DOMRect) {
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
  }
}
