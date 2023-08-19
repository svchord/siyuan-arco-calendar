<template>
  <a-config-provider :locale="locale">
    <a-tabs style="width: 280px; margin: auto">
      <template #extra>
        <a-select
          v-model="currentNotebook"
          :style="{ width: '160px', margin: 'auto' }"
          placeholder="选择笔记本..."
          allow-search
        >
          <a-option v-for="book of notebooks" :value="book" :label="book.label" :key="book.value as string" />
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
import { computed, ref, watch } from 'vue';
import CalendarView from '@/components/CalendarView.vue';
//utils
import { getAppID } from '@/utils/id';
import { lsNotebooks, request } from '@/utils/api';
// hooks
import { useLocale } from '@/hooks/useLocale';
// types
import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
import type { Notebook } from '@/types/notebook';

const { locale, tabName, getLocaleType } = useLocale();
getLocaleType();

// 获取笔记本列表
const notebooks = ref<SelectOptionData[]>([]);
const notebooksID = computed(() => notebooks.value.map(book => book.value));
async function getNotebooks() {
  const data = await lsNotebooks();

  notebooks.value = data.notebooks
    .filter((book: Notebook) => !book.closed)
    .map((book: Notebook) => {
      return { value: book.id, label: book.name };
    });
}

const currentNotebook = ref<SelectOptionData | undefined>(undefined);
async function getCurrentBook() {
  const curBook = currentNotebook.value;
  const books = notebooksID.value;
  if (curBook) {
    return;
  }
  const storage = await request('/api/storage/getLocalStorage');
  if (books.includes(storage['local-dailynoteid'])) {
    currentNotebook.value = notebooks.value.find(book => book.value === storage['local-dailynoteid']);
  }
}
async function init() {
  await getNotebooks();
  await getCurrentBook();
}
init();

watch(currentNotebook, newValue => changeStorage(newValue), { deep: true });
async function changeStorage(book: SelectOptionData | undefined) {
  if (!book) {
    return;
  }
  const storage = await request('/api/storage/getLocalStorage');
  if (book?.value !== storage['local-dailynoteid']) {
    await request('/api/storage/setLocalStorageVal', {
      app: getAppID(),
      key: 'local-dailynoteid',
      val: book?.value,
    });
  }
}
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