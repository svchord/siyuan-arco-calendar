import { createApp } from 'vue'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue'
import { Select, DatePicker, Tabs } from '@arco-design/web-vue';

import "@arco-design/web-vue/es/input/style/index.css";
import "@arco-design/web-vue/es/_components/input-label/style/index.css";
import "@arco-design/web-vue/es/tag/style/index.css";
import "@arco-design/web-vue/es/input-tag/style/index.css";
import "@arco-design/web-vue/es/_components/select-view/style/index.css";
import "@arco-design/web-vue/es/trigger/style/index.css";
import "@arco-design/web-vue/es/empty/style/index.css";
import "@arco-design/web-vue/es/checkbox/style/index.css";
import "@arco-design/web-vue/es/scrollbar/style/index.css";
import "@arco-design/web-vue/es/select/style/index.css";

// import "@arco-design/web-vue/es/style/index.css";
import "@arco-design/web-vue/es/input/style/index.css";
import "@arco-design/web-vue/es/trigger/style/index.css";
import "@arco-design/web-vue/es/_components/picker/style/index.css";
import "@arco-design/web-vue/es/time-picker/style/index.css";
import "@arco-design/web-vue/es/button/style/index.css";
import "@arco-design/web-vue/es/link/style/index.css";
import "@arco-design/web-vue/es/date-picker/style/index.css";

import "@arco-design/web-vue/es/tabs/style/index.css";



import { Plugin, Menu, clientApi } from 'siyuan'

// const app = createApp(App)
// app.use(ArcoVue)
// app.mount('#app')

export default class CalendarPlugin extends Plugin {
    public el!: HTMLElement

    constructor() {
        super()
    }

    onload() {
        this.el = document.createElement('div')
        this.el.classList.add('toolbar__item', 'b3-tooltips', 'b3-tooltips__se')
        this.el.setAttribute('aria-label', '打开日历')
        this.el.innerHTML = `<svg><use xlink:href="#iconCalendar"></use></svg>`
        this.el.addEventListener('click', (event) => {
            const ca = document.createElement('div')
            const app = createApp(App)
            app.use(Select)
            app.use(DatePicker)
            app.use(Tabs)
            app.mount(ca)
            new Menu('Calendar').addItem({ element: ca }).showAtMouseEvent(event)
            event.stopPropagation()
        })
        clientApi.addToolbarLeft(this.el)
    }

    onunload() {
        this.el?.remove()
    }
}
