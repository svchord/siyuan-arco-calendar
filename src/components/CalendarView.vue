<template>
  <a-date-picker
    v-model="thisDay"
    @picker-value-change="changeMonth"
    hide-trigger
    :dayStartOfWeek="startDayOfWeekNumber"
    style="width: 268px; margin: auto; box-shadow: none"
  >
    <template #cell="{ date }">
      <div class="arco-picker-date">
        <div class="arco-picker-date-value" @click="openDailyNote(date)" :class="{ exist: getCell(date) }">
          {{ date.getDate() }}
        </div>
      </div>
    </template>
    <template #extra>
      <a-row style="text-align: center">
        <a-button size="mini" @click="clickToday"> {{ locale.datePicker.today }} </a-button>
      </a-row>
    </template>
  </a-date-picker>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs';
import * as api from '@/api/api';
import { openDoc } from '@/api/daily-note';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { eventBus } from '@/hooks/useSiYuan';
import { CusNotebook } from '@/utils/notebook';
import { refreshSql } from '@/api/utils';

const { locale } = useLocale();

const props = defineProps<{ notebook: CusNotebook | undefined, startDayOfWeek: string }>();
const { notebook, startDayOfWeek } = toRefs(props);

const startDayOfWeekNumber = computed(() => {
 return startDayOfWeek.value === 'mon' ? 1 : 0;
})

//已存在日记的日期
const existDailyNotesMap = ref(new Map());

async function getExistDate(date: Date) {
  if (!notebook.value) {
    return;
  }
  const existDailyNotes = await notebook.value.getExistDailyNote(date);
  if (!existDailyNotes) {
    return;
  }
  for (const { id, dateStr } of existDailyNotes) {
    existDailyNotesMap.value.set(dateStr, id);
  }
}

watch(notebook, notebook => {
  existDailyNotesMap.value.clear();
  if (notebook) {
    getExistDate(new Date());
  }
});

const thisDay = ref();

function clickToday() {
  const today = new Date();
  openDailyNote(today);
  thisDay.value = dayjs(today).format('YYYY-MM-DD');
}

async function openDailyNote(date: Date) {
  if (!notebook.value) {
    await api.pushErrMsg(formatMsg('notNoteBook'));
    return;
  }
  const dateStr = dayjs(date).format('YYYY-MM-DD');
  if (existDailyNotesMap.value.has(dateStr)) {
    openDoc(existDailyNotesMap.value.get(dateStr));
    return;
  }
  const dailyNote = await notebook.value.createDailyNote(date);
  const { id } = dailyNote;
  openDoc(id); //打开新建的日记
  existDailyNotesMap.value.set(dateStr, id);
}

const thisPanelDate = ref(new Date());
function changeMonth(dateStr: string) {
  thisPanelDate.value = new Date(dateStr);
  getExistDate(thisPanelDate.value);
}

eventBus.value?.on('ws-main', async ({ detail }) => {
  if (!notebook.value) {
    return;
  }
  const { cmd } = detail;
  if (['removeDoc', 'createdailynote'].includes(cmd)) {
    await refreshSql();
    await getExistDate(thisPanelDate.value);
  }
});

// 设置 cell 类
function getCell(date: Date) {
  return existDailyNotesMap.value.has(dayjs(date).format('YYYY-MM-DD'));
}
</script>
