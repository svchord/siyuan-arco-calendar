import { createApp } from 'vue';
import App from './App.vue';
import { ConfigProvider, Select, DatePicker, Tabs } from '@arco-design/web-vue';
import { Plugin, Menu, getFrontend } from 'siyuan';

import './index.less';
// import '@arco-design/web-vue/dist/arco.css';

const app = createApp(App);
app.use(ConfigProvider).use(Select).use(DatePicker).use(Tabs);
app.mount('#app');

export default class PluginSample extends Plugin {
  private isMobile!: boolean;
  public element!: HTMLElement;

  onload() {
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === 'mobile' || frontEnd === 'browser-mobile';
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
      }
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
        y: rect.bottom
      });
    }
  }
}
