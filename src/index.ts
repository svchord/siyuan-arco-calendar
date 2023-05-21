import { createApp } from 'vue';
import App from './App.vue';
import { ConfigProvider, Select, DatePicker, Tabs } from '@arco-design/web-vue';
import { Plugin, Menu, isMobile } from 'siyuan';

// import '@arco-design/web-vue/dist/arco.css';

const app = createApp(App);
app.use(ConfigProvider).use(Select).use(DatePicker).use(Tabs);
app.mount('#app');

export default class PluginSample extends Plugin {
  public element!: HTMLElement;

  onload() {
    this.element = this.addTopBar({
      icon: 'iconCalendar',
      title: this.i18n.openCalendar,
      position: 'left',
      callback: () => {
        this.addMenu(this.element.getBoundingClientRect());
      }
    });
  }

  onunload() {
    this.element?.remove();
  }

  private async addMenu(rect: DOMRect) {
    const menu = new Menu('Calendar');
    const ca = document.createElement('div');
    const app = createApp(App);
    app.use(ConfigProvider).use(Select).use(DatePicker).use(Tabs);
    app.mount(ca);

    menu.menu.element.appendChild(ca);
    if (isMobile()) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.left,
        y: rect.bottom
      });
    }
  }
}
