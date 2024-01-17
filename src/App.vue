<template>
  <a-config-provider :locale="locale">
    <a-tabs style="width: 280px; margin: 3px auto">
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
        <template #title> {{ i18n.tabName }} </template>
        <CalendarView :notebook="currentNotebook" />
      </a-tab-pane>
      <!-- <a-tab-pane key="2">
        </a-tab-pane> -->
    </a-tabs>
  </a-config-provider>
</template>

<script lang="ts" setup>
import CalendarView from '@/components/CalendarView.vue';
//utils
import { Constants } from 'siyuan';
import { lsNotebooks, request } from '@/utils/api';
import { useLocale } from '@/hooks/useLocale';
import { eventBus, i18n } from '@/hooks/useSiYuan';
import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';

const { locale } = useLocale();

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
  const storage = await request('/api/storage/getLocalStorage');
  if (notebooksID.value.includes(storage['local-dailynoteid'])) {
    currentNotebook.value = notebooks.value.find(book => book.value === storage['local-dailynoteid']);
  } else {
    currentNotebook.value = undefined;
  }
}
async function init() {
  await getNotebooks();
  await getCurrentBook();
}
init();

eventBus.value?.on('ws-main', ({ detail }) => {
  const { cmd } = detail;
  if (['createnotebook', 'mount', 'unmount'].includes(cmd)) {
    init();
  }
});

watch(currentNotebook, newValue => changeStorage(newValue), { deep: true });
async function changeStorage(book: SelectOptionData | undefined) {
  if (!book) {
    return;
  }
  const storage = await request('/api/storage/getLocalStorage');
  if (book?.value !== storage['local-dailynoteid']) {
    await request('/api/storage/setLocalStorageVal', {
      app: Constants.SIYUAN_APPID,
      key: 'local-dailynoteid',
      val: book?.value,
    });
  }
}
</script>
