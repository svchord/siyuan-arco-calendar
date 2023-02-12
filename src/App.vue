<template>
    <a-tabs style="width: 280px; margin: auto">
        <template #extra>
            <a-select
                v-model="currentNotebook"
                :style="{ width: '160px', margin: 'auto' }"
                placeholder="选择笔记本..."
                allow-search
            >
                <a-option v-for="book of notebooks" :value="book" :label="book.label" />
            </a-select>
        </template>
        <a-tab-pane key="1">
            <template #title> 日历 </template>
            <Calendar :notebook="currentNotebook" />
        </a-tab-pane>
        <!-- <a-tab-pane key="2">
        </a-tab-pane> -->
    </a-tabs>
</template>

<script>
import Calendar from './Calendar.vue';
import { request } from './utils';
import { Socket } from './socket';

export default {
    components: {
        Calendar,
    },
    data() {
        return {
            // 笔记本列表
            notebooks: [],
            // 选中笔记本
            currentNotebook: null,
        };
    },
    computed: {
        notebooksID() {
            return this.notebooks.map((book) => {
                return book.value;
            });
        },
    },
    methods: {
        // 设置明暗切换
        async setDarkTheme() {
            const data = await request('/api/system/getConf');
            const themeMode = data.conf.appearance.mode;

            switch (themeMode) {
                case 1:
                    document.body.setAttribute('arco-theme', 'dark');
                    break;
                case 0:
                default:
                    document.body.removeAttribute('arco-theme');
                    break;
            }
        },
        // 获取笔记本列表
        async getNotebooks() {
            const data = await request('/api/notebook/lsNotebooks');

            let tempNotebooks = [];
            data.notebooks.forEach((book) => {
                if (!book.closed) {
                    tempNotebooks.push({
                        value: book.id,
                        label: book.name,
                        other: 'other',
                    });
                }
            });

            this.notebooks = tempNotebooks;
        },
        async getCurrentBook() {
            if (!this.currentNotebook) {
                const storage = await request('/api/storage/getLocalStorage');
                if (this.notebooksID.includes(storage['local-dailynoteid'])) {
                    this.currentNotebook = this.notebooks.filter((book) => {
                        return book.value === storage['local-dailynoteid'];
                    })[0];
                }
            } else if (!this.notebooksID.includes(this.currentNotebook.value)) {
                this.currentNotebook = null;
            }
        },
        async getAll() {
            await this.getNotebooks();
            await this.getCurrentBook();
        },
    },
    mounted() {
        this.setDarkTheme();
        this.getAll();
        const ws = new Socket();
        ws.on('mount', this.getAll);
        ws.on('unmount', this.getAll);
        ws.on('createnotebook', this.getNotebooks);
        ws.on('createdailynote', this.getAll);
        ws.on('renamenotebook', this.getAll);
        ws.on('transactions', this.getCurrentBook);
    },
};
</script>
<style>
body {
    color: var(--color-text-1);
    background-color: var(--color-bg-1);
}
</style>
