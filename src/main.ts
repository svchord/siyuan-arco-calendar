import { createApp } from 'vue'
import App from './App.vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'

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
        this.el.innerHTML = `<svg
            t="1662957805816"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2374"
            width="200"
            height="200"
        >
            <path
                d="M797.257 402.286h-570.514v113.371h570.514v-113.371zM910.629 76.8h-58.514v-76.8h-113.371v76.8h-453.486v-76.8h-113.371v76.8h-58.514c-62.171 0-113.371 51.2-113.371 113.371v724.114c0 62.171 51.2 109.714 113.371 109.714h797.257c62.171 0 113.371-47.543 113.371-109.714v-724.114c0-62.171-51.2-113.371-113.371-113.371zM910.629 914.286h-797.257v-625.371h797.257v625.371zM625.371 629.029h-398.629v113.371h398.629v-113.371z"
            ></path>
        </svg>`

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

    onunload() {
        this.el?.remove()
    }
}
