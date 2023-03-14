import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import App from './App.vue'
import TopBarButton from './components/TopBarButton.vue'
import '@arco-design/web-vue/dist/arco.css'

import { Plugin, Menu, clientApi } from 'siyuan'

// const app = createApp(App)
// app.use(ArcoVue)
// app.mount('#app')

export default class CalendarPlugin extends Plugin {
    public el: HTMLElement

    constructor() {
        super()
        this.el = document.createElement('div')
    }

    onload() {
        const button = createApp(TopBarButton)
        button.mount(this.el)
        this.el.addEventListener('click', (event) => {
            const ca = document.createElement('div')
            const app = createApp(App)
            app.use(ArcoVue)
            app.mount(ca)
            new Menu('Calendar').addItem({ element: ca }).showAtMouseEvent(event)
            event.stopPropagation()
        })
        clientApi.addToolbarLeft(this.el)
    }

    onunload() {}
}
