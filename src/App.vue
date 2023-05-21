<template>
  <a-config-provider :locale="locale">
    <a-tabs style="width: 280px; margin: auto">
      <template #extra>
        <a-select v-model="currentNotebook" :style="{ width: '160px', margin: 'auto' }" placeholder="选择笔记本..."
          allow-search>
          <a-option v-for="book of notebooks" :value="book" :label="book.label" :key="book.value" />
        </a-select>
      </template>
      <a-tab-pane key="1">
        <template #title> {{ tabName }} </template>
        <CalendarView :notebook="currentNotebook" />
      </a-tab-pane>
      <!-- <a-tab-pane key="2">
        </a-tab-pane> -->
    </a-tabs>
  </a-config-provider>
</template>

<script lang="ts" setup>
import type { Notebook, ArcoOption } from './interface/notebook';
import { computed, ref, watch } from 'vue';
import CalendarView from './components/CalendarView.vue';
//utils
import { getAppID } from './utils/id';
import { request } from './utils/request';
// import { Socket } from './utils/socket'
// hooks
import { useTheme } from './hooks/useTheme';
import { useLocale } from './hooks/useLocale';

useTheme();

const { locale, tabName, getLocaleType } = useLocale();
getLocaleType();

const notebooks = ref<ArcoOption[]>([]);
const currentNotebook = ref<ArcoOption | undefined>(undefined);
const notebooksID = computed(() => {
  return notebooks.value.map((book) => {
    return book.value;
  });
});

watch(currentNotebook, (newValue) => changeStorage(newValue), { deep: true });
async function changeStorage(book: ArcoOption | undefined) {
  if (!book) {
    return;
  }
  const storage = await request('/api/storage/getLocalStorage');
  if (currentNotebook.value?.value !== storage['local-dailynoteid']) {
    request('/api/storage/setLocalStorageVal', {
      app: getAppID(),
      key: 'local-dailynoteid',
      val: currentNotebook.value?.value
    });
  }
}

// 获取笔记本列表
async function getNotebooks() {
  const data = await request('/api/notebook/lsNotebooks');

  let tempNotebooks: ArcoOption[] = [];
  data.notebooks.forEach((book: Notebook) => {
    if (!book.closed) {
      tempNotebooks.push({
        value: book.id,
        label: book.name,
        other: 'other'
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
    currentNotebook.value = undefined;
  }
}

async function getAll() {
  await getNotebooks();
  await getCurrentBook();
}

getAll();
// const ws = new Socket()
// ws.on('mount', getAll)
// ws.on('unmount', getAll)
// ws.on('createnotebook', getNotebooks)
// ws.on('createdailynote', getAll)
// ws.on('renamenotebook', getAll)
// ws.on('transactions', getCurrentBook)
</script>
<style lang="less">
// base
@import '@arco-design/web-vue/es/style/icon.less';
@import '@arco-design/web-vue/es/style/animation/index.less';
@import '@arco-design/web-vue/es/style/theme/index.less';
@import '@arco-design/web-vue/es/style/theme/css-variables.less';

// Select
@import '@arco-design/web-vue/es/input/style/index.css';
@import '@arco-design/web-vue/es/_components/input-label/style/index.css';
@import '@arco-design/web-vue/es/tag/style/index.css';
@import '@arco-design/web-vue/es/input-tag/style/index.css';
@import '@arco-design/web-vue/es/_components/select-view/style/index.css';
@import '@arco-design/web-vue/es/trigger/style/index.css';
@import '@arco-design/web-vue/es/empty/style/index.css';
@import '@arco-design/web-vue/es/checkbox/style/index.css';
@import '@arco-design/web-vue/es/scrollbar/style/index.css';
@import '@arco-design/web-vue/es/select/style/index.css';

// Date-Picker
@import '@arco-design/web-vue/es/_components/picker/style/index.css';
@import '@arco-design/web-vue/es/time-picker/style/index.css';
@import '@arco-design/web-vue/es/button/style/index.css';
@import '@arco-design/web-vue/es/link/style/index.css';
@import '@arco-design/web-vue/es/date-picker/style/index.css';

// tabs
@import '@arco-design/web-vue/es/tabs/style/index.css';
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
