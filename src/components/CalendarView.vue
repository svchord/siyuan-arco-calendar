<template>
  <div>
    <a-date-picker
      @change="createDailyNote"
      @picker-value-change="changePanel"
      hide-trigger
      style="width: 268px; margin: auto; box-shadow: none"
    >
      <template #cell="{ date }">
        <div class="arco-picker-date">
          <div class="arco-picker-date-value" :class="{ exist: getCell(date) }">
            {{ date.getDate() }}
          </div>
        </div>
      </template>
    </a-date-picker>
  </div>
</template>
<script lang="ts" setup>
import { watch, ref, toRefs, onMounted } from 'vue';
import { useLocale } from '@/hooks/useLocale';
import {
  request,
  pushErrMsg,
  render,
  prependBlock,
  createDocWithMd,
  getNotebookConf,
  renderSprig,
  sql,
} from '@/utils/api';
// types
import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
import { i18n } from '@/hooks/useI18n';

const props = defineProps<{ notebook: SelectOptionData | undefined }>();
const { notebook } = toRefs(props);

// 含变量的日记存放路径
const dailyNoteSavePath = ref<string>('');
// 日记模板存放路径
const dailyNoteTemplatePath = ref<string>('');
watch(notebook, newValue => setCalendar(newValue), { deep: true });
async function setCalendar(book: SelectOptionData | undefined) {
  if (!book) {
    pushErrMsg(formateMsg('notNoteBook'));
    return;
  }
  // 获取含变量的日记存放路径
  const bookID = book.value;
  const { conf } = await getNotebookConf(bookID);
  dailyNoteSavePath.value = conf.dailyNoteSavePath.replace(/\{\{(.*?)\}\}/g, (match: string) =>
    match.replace(/\bnow\b(?=(?:(?:[^"]*"){2})*[^"]*$)/g, `(toDate "2006-01-02" "[[dateSlot]]")`)
  );
  dailyNoteTemplatePath.value = conf.dailyNoteTemplatePath.replaceAll('/', '\\');
}

async function getHPath(date: Date | string) {
  let dateStr = '';
  if (date instanceof Date) {
    const { localeType } = useLocale();
    dateStr = date
      .toLocaleDateString(localeType.value.replace(/_/g, '-'), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '-');
  }
  if (typeof date === 'string') {
    dateStr = date;
  }
  if (!dateStr) {
    return '';
  }
  const path = dailyNoteSavePath.value.replaceAll('[[dateSlot]]', dateStr);
  return renderSprig(path);
}

async function getDailyNotesID(hPath: string) {
  if (!notebook.value) {
    return;
  }
  const searchSql = `select * from blocks where type='d' and box = '${notebook.value.value}' and hpath = '${hPath}'`;
  const data = await sql(searchSql);
  return data.length ? data[0].id : null;
}

// 创建日记
async function createDailyNote(date: string) {
  if (!date) {
    return;
  }
  if (!notebook.value) {
    pushErrMsg(formateMsg('notNoteBook'));
    return;
  }
  const hPath = await getHPath(date);
  if (!hPath) {
    return;
  }
  const dailyNoteID = await getDailyNotesID(hPath);

  // 当前日期已有日记，打开日记
  if (dailyNoteID) {
    window.open(`siyuan://blocks/${dailyNoteID}`);
    return;
  }
  // 当前日期无日记，创建日记
  const docID = await createDocWithMd(notebook.value.value, hPath, '');
  existDate.value.push(new Date(date).getTime());
  window.open(`siyuan://blocks/${docID}`);

  // 根据模板渲染日记
  if (dailyNoteTemplatePath.value.length) {
    const system = await request('/api/system/getConf');
    let templateDir = system.conf.system.dataDir + '\\templates' + dailyNoteTemplatePath.value;
    const res = await render(docID, templateDir);
    await prependBlock('dom', res.content, docID);
  }
}

// 当前笔记本为空报错
function formateMsg(key: string) {
  const msg = i18n.value.msg;
  return `${msg.begin} ${msg[key]}`;
}

const lastDate = ref<Date | undefined>();
const existDate = ref<number[]>([]);
async function getExistDate(lastDate: Date | undefined) {
  if (!lastDate) {
    return;
  }
  let last = lastDate.getTime();
  const oneDayTime = 24 * 60 * 60 * 1000;
  for (let i = 0; i < 42; i++) {
    let timeStamp = last - i * oneDayTime;
    if (existDate.value.includes(timeStamp)) {
      continue;
    }
    const hPath = await getHPath(new Date(timeStamp));
    const dailyNoteID = await getDailyNotesID(hPath);
    if (!dailyNoteID) {
      continue;
    }
    existDate.value.push(timeStamp);
  }
}

onMounted(() => getExistDate(lastDate.value));
function changePanel() {
  console.log(1);
  setTimeout(() => getExistDate(lastDate.value), 0);
}

// 设置 cell 类
function getCell(date: Date) {
  lastDate.value = date;
  return existDate.value.includes(date.getTime());
}
</script>
<style lang="less">
.arco-picker-cell {
  .arco-picker-date-value {
    border: 1.4px solid transparent;
    border-radius: var(--border-radius-medium);
  }

  // 非选中日期
  &:not(.arco-picker-cell-selected) {
    .arco-picker-date-value:hover {
      background-color: transparent !important;
    }

    // 当月日期
    &.arco-picker-cell-in-view {
      .arco-picker-date-value:hover {
        border-color: rgb(var(--primary-6));
      }

      .exist {
        color: rgb(var(--primary-6)) !important;
        background-color: var(--color-primary-light-2);

        &:hover {
          background-color: var(--color-primary-light-2) !important;
        }
      }
    }

    // 非当月日期
    &:not(.arco-picker-cell-in-view) {
      .arco-picker-date-value:hover {
        border-color: var(--color-neutral-3);
      }

      .exist {
        background-color: var(--color-fill-2);

        &:hover {
          background-color: var(--color-fill-2) !important;
        }
      }
    }
  }
}

.arco-select-dropdown {
  padding: 6px !important;
}

.arco-select-option {
  border-radius: var(--border-radius-medium);
}
</style>
