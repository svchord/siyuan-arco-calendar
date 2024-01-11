import { createApp } from 'vue';
import App from './App.vue';
import { ConfigProvider, Select, DatePicker, Tabs } from '@arco-design/web-vue';
import { Plugin, getFrontend } from 'siyuan';
import { app, i18n, isMobile, eventBus } from './hooks/useSiYuan';

import './index.less';
export default class ArcoCalendarPlugin extends Plugin {
  onload() {
    i18n.value = this.i18n;
    app.value = this.app;
    eventBus.value = this.eventBus;

    const frontEnd = getFrontend();
    isMobile.value = frontEnd === 'mobile' || frontEnd === 'browser-mobile';

    const vueApp = createApp(App);
    vueApp.use(ConfigProvider).use(Select).use(DatePicker).use(Tabs);
    const DOCK_TYPE = 'dock_tab';
    const _plugin = this;
    this.addDock({
      config: {
        position: 'RightTop',
        size: { width: 300, height: 0 },
        icon: 'iconCalendar',
        title: _plugin.i18n.tabName,
      },
      data: {},
      type: DOCK_TYPE,
      init: dock => {
        vueApp.mount(dock.element);
      },
    });
  }

  onunload() {}
}
