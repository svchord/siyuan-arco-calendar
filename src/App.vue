<template>
  <a-config-provider :locale="locale">
    <a-tabs style="width: 280px; margin: 3px auto">
      <template #extra>
        <a-select
          v-model="selectNotebookId"
          :options="cusNotebooks"
          :field-names="{ value: 'id', label: 'name' }"
          :style="{ width: '160px', margin: 'auto' }"
          placeholder="选择笔记本..."
          allow-search
        >
        </a-select>
      </template>
      <a-tab-pane key="1">
        <template #title> {{ i18n.tabName }} </template>
        <CalendarView :notebook="selectNotebook" />
      </a-tab-pane>
      <!-- <a-tab-pane key="2">
        </a-tab-pane> -->
    </a-tabs>
  </a-config-provider>
</template>

<script lang="ts" setup>
import CalendarView from '@/components/CalendarView.vue';
import { Constants } from 'siyuan';
import { lsNotebooks, request, pushErrMsg } from '@/api/api';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { eventBus, i18n } from '@/hooks/useSiYuan';
import { CusNotebook } from '@/utils/notebook';
import { refreshSql } from './api/utils';

const { locale } = useLocale();

// 获取笔记本列表
const cusNotebooks = ref<CusNotebook[]>([]);
const selectNotebookId = ref<NotebookId | undefined>(undefined);
const selectNotebook = computed(() => cusNotebooks.value.find(book => book.id === selectNotebookId.value));

async function init() {
  const { notebooks } = await lsNotebooks();
  const books = notebooks.filter((book: Notebook) => !book.closed);
  for (const book of books) {
    const cusNotebook = await CusNotebook.build(book);
    cusNotebooks.value.push(cusNotebook);
  }
  const storage = await request('/api/storage/getLocalStorage');
  if (cusNotebooks.value.map(book => book.id).includes(storage['local-dailynoteid'])) {
    selectNotebookId.value = storage['local-dailynoteid'];
  } else {
    selectNotebookId.value = undefined;
  }
}
init();

eventBus.value?.on('ws-main', async ({ detail }) => {
  const { cmd } = detail;
  if (['createnotebook', 'mount', 'unmount'].includes(cmd)) {
    await refreshSql();
    cusNotebooks.value = [];
    await init();
  }
});

watch(selectNotebookId, async bookId => {
  if (!bookId) {
    await pushErrMsg(formatMsg('notNoteBook'));
    return;
  }
  const storage = await request('/api/storage/getLocalStorage');
  if (bookId !== storage['local-dailynoteid']) {
    await request('/api/storage/setLocalStorageVal', {
      app: Constants.SIYUAN_APPID,
      key: 'local-dailynoteid',
      val: bookId,
    });
  }
});
</script>
