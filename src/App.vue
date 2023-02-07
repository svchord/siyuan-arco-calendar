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
            <template #title> 测试 </template>
            {{ currentNotebook }}
        </a-tab-pane> -->
    </a-tabs>
</template>

<script>
import Calendar from './Calendar.vue';
import { request } from './utils';

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
            // 当前笔记本ID缓存
            localDailynoteId: null,
        };
    },
    computed: {
        // 笔记本列表ID缓存
        notebooksIdsCache() {
            return this.notebooks?.map((book) => {
                return book.value;
            });
        },
    },
    watch: {
        // 监听当前笔记本ID缓存是否改变
        localDailynoteId(newValue) {
            this.currentNotebook = this.notebooks?.filter((book) => {
                return book.value === newValue;
            })[0];
        },
    },
    methods: {
        convertNotebook(id, name) {
            return {
                value: id,
                label: name,
                other: 'other',
            };
        },
        // 设置明暗切换
        async setDarkTheme() {
            const data = await request('/api/system/getConf');
            const themeMode = data.conf.appearance.mode;

            switch (themeMode) {
                case 1:
                    document.body.setAttribute('arco-theme', 'dark');
                    document.body.style.backgroundColor = 'var(--color-bg-1)';
                    document.body.style.color = 'var(--color-text-1)';
                    break;
                case 0:
                default:
                    document.body.removeAttribute('arco-theme');
                    document.body.removeAttribute('style');
                    break;
            }
        },
        // 获取笔记本列表
        async getNotebooks() {
            const data = await request('/api/notebook/lsNotebooks');
            const storage = await request('/api/storage/getLocalStorage');

            data.notebooks
                .filter((book) => {
                    return !book.closed;
                })
                .forEach((book) => {
                    this.notebooks.push(this.convertNotebook(book.id, book.name));
                    if (book.id === storage['local-dailynoteid']) {
                        this.currentNotebook = this.convertNotebook(book.id, book.name);
                        this.localDailynoteId = book.id;
                    }
                });
        },
        // 轮询
        async polling() {
            const data = await request('/api/notebook/lsNotebooks');
            const storage = await request('/api/storage/getLocalStorage');

            const notebooks = data.notebooks.filter((book) => {
                return !book.closed;
            });

            // 笔记本组更改
            // 笔记本数量更改
            if (notebooks.length !== this.notebooks.length) {
                this.notebooks = notebooks.map((book) => {
                    return this.convertNotebook(book.id, book.name);
                });
            } else {
                // 笔记本数量相同，但成员更改
                let tempNotebookIds = notebooks.map((book) => {
                    return book.id;
                });
                if (tempNotebookIds.sort().toString() !== this.notebooksIdsCache.sort().toString()) {
                    this.notebooks = notebooks.map((book) => {
                        return this.convertNotebook(book.id, book.name);
                    });
                }
            }

            // 本地笔记本更改
            if (this.localDailynoteId !== storage['local-dailynoteid']) {
                this.localDailynoteId = storage['local-dailynoteid'];
            }
            // 本地笔记本已关闭或已删除
            if (!this.notebooksIdsCache.includes(this.localDailynoteId)) {
                this.currentNotebook = null;
            }
        },
    },
    mounted() {
        this.getNotebooks();
        this.setDarkTheme();
        setInterval(this.polling, 2000);
    },
};
</script>
<style></style>
