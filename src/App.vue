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

<script setup>
import Calendar from './Calendar.vue';
import { request, getAppID } from './utils';
import { Socket } from './socket';
import { computed, ref, watch } from 'vue';

const notebooks = ref([]);
const currentNotebook = ref(null);

const notebooksID = computed(() => {
    return notebooks.value.map((book) => {
        return book.value;
    });
});

watch(currentNotebook, (newValue) => changeStorage(newValue), { deep: true });

async function changeStorage(book) {
    if (!book) {
        return;
    }
    const storage = await request('/api/storage/getLocalStorage');
    if (currentNotebook.value.value !== storage['local-dailynoteid']) {
        request('/api/storage/setLocalStorageVal', {
            app: getAppID(),
            key: 'local-dailynoteid',
            val: currentNotebook.value.value,
        });
    }
}

// 设置明暗切换
async function setDarkTheme() {
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
}
setDarkTheme();

// 获取笔记本列表
async function getNotebooks() {
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
    notebooks.value = tempNotebooks;
}

async function getCurrentBook() {
    if (!currentNotebook.value) {
        const storage = await request('/api/storage/getLocalStorage');
        if (notebooksID.value.includes(storage['local-dailynoteid'])) {
            currentNotebook.value = notebooks.value.find((book) => {
                return book.value === storage['local-dailynoteid'];
            });
        }
    } else if (!notebooksID.value.includes(currentNotebook.value.value)) {
        currentNotebook.value = null;
    }
}

async function getAll() {
    await getNotebooks();
    await getCurrentBook();
}

getAll();
const ws = new Socket();
ws.on('mount', getAll);
ws.on('unmount', getAll);
ws.on('createnotebook', getNotebooks);
ws.on('createdailynote', getAll);
ws.on('renamenotebook', getAll);
ws.on('transactions', getCurrentBook);
</script>
<style>
body {
    color: var(--color-text-1);
    background-color: var(--color-bg-1);
}
</style>
