<template>
    <a-tabs style="width: 280px; margin: auto">
        <template #extra>
            <a-select
                v-model="currentNotebook"
                :style="{ width: '160px', margin: 'auto' }"
                placeholder="选择笔记本..."
                allow-search
            >
                <a-option
                    v-for="book of notebooks"
                    :value="book"
                    :label="book.label"
                    :key="book.value"
                />
            </a-select>
        </template>
        <a-tab-pane key="1">
            <template #title> 日历 </template>
            <CalendarView :notebook="currentNotebook" />
        </a-tab-pane>
        <!-- <a-tab-pane key="2">
        </a-tab-pane> -->
    </a-tabs>
</template>

<script lang="ts" setup>
import type { Notebook, ArcoOption } from './interface/notebook'

import CalendarView from './components/CalendarView.vue'
import { getAppID } from './utils/id'
import { request } from './utils/request'
// import { Socket } from './utils/socket'
import { computed, ref, watch } from 'vue'

const notebooks = ref<ArcoOption[]>([])
const currentNotebook = ref<ArcoOption | undefined>(undefined)

const notebooksID = computed(() => {
    return notebooks.value.map((book) => {
        return book.value
    })
})

watch(currentNotebook, (newValue) => changeStorage(newValue), { deep: true })

async function changeStorage(book: ArcoOption | undefined) {
    if (!book) {
        return
    }
    const storage = await request('/api/storage/getLocalStorage')
    if (currentNotebook.value?.value !== storage['local-dailynoteid']) {
        request('/api/storage/setLocalStorageVal', {
            app: getAppID(),
            key: 'local-dailynoteid',
            val: currentNotebook.value?.value
        })
    }
}

// 设置明暗切换
async function setDarkTheme() {
    const data = await request('/api/system/getConf')
    const themeMode = data.conf.appearance.mode

    switch (themeMode) {
        case 1:
            document.body.setAttribute('arco-theme', 'dark')
            break
        case 0:
        default:
            document.body.removeAttribute('arco-theme')
            break
    }
}
setDarkTheme()

// 获取笔记本列表
async function getNotebooks() {
    const data = await request('/api/notebook/lsNotebooks')

    let tempNotebooks: ArcoOption[] = []
    data.notebooks.forEach((book: Notebook) => {
        if (!book.closed) {
            tempNotebooks.push({
                value: book.id,
                label: book.name,
                other: 'other'
            })
        }
    })
    notebooks.value = tempNotebooks
}

async function getCurrentBook() {
    if (!currentNotebook.value) {
        const storage = await request('/api/storage/getLocalStorage')
        if (notebooksID.value.includes(storage['local-dailynoteid'])) {
            currentNotebook.value = notebooks.value.find((book) => {
                return book.value === storage['local-dailynoteid']
            })
        }
    } else if (!notebooksID.value.includes(currentNotebook.value.value)) {
        currentNotebook.value = undefined
    }
}

async function getAll() {
    await getNotebooks()
    await getCurrentBook()
}

getAll()
// const ws = new Socket()
// ws.on('mount', getAll)
// ws.on('unmount', getAll)
// ws.on('createnotebook', getNotebooks)
// ws.on('createdailynote', getAll)
// ws.on('renamenotebook', getAll)
// ws.on('transactions', getCurrentBook)
</script>
<style lang="less">
.arco-tabs,
.arco-trigger-popup {
    // 主色 (r,g,b)
    --arco-primary: 53, 117, 240;
    --primary-6: var(--arco-primary);
    // 浅主色
    --color-primary-light-2: var(--b3-theme-primary-lightest);

    // 页面底色
    --color-bg-1: var(--b3-menu-background);
    // 下拉选择框输入时底色
    --color-bg-2: var(--b3-menu-background);
    // 下拉选择框底色 && 下拉菜单选项悬浮底色
    --color-fill-2: var(--b3-list-hover);
    --color-fill-3: var(--b3-list-hover);

    // 日历底色
    --color-bg-popup: var(--b3-menu-background);

    // 边框颜色
    --color-neutral-3: var(--b3-border-color);

    // 文字颜色
    --color-text-1: var(--b3-theme-on-background);

    color: var(--color-text-1);
    svg {
        fill: none;
    }
    a:hover {
        text-decoration: none;
    }
    // :deep(svg) {
    //     fill: none;
    // }
    // :deep(a:hover) {
    //     text-decoration: none;
    // }
}
</style>
