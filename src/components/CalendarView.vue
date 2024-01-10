<template>
  <div>
    <a-date-picker
      @change="createDailyNote"
      @picker-value-change="changePanel"
      hide-trigger
      style="width: 268px; margin: auto; box-shadow: none"
    >
      <template #cell="{ date }">
        <div class="arco-picker-date" @click="addExist(date)">
          <div class="arco-picker-date-value" :class="{ exist: getCell(date) }">
            {{ date.getDate() }}
          </div>
        </div>
      </template>
    </a-date-picker>
  </div>
</template>
<script lang="ts" setup>
import { watch, ref, toRefs } from 'vue';
import { useLocale } from '@/hooks/useLocale';
import * as api from '@/utils/api';
import { openDoc, setCustomDNAttr } from '@/utils/daily-note';
import { i18n } from '@/hooks/useI18n';
import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';

const props = defineProps<{ notebook: SelectOptionData | undefined }>();
const { notebook } = toRefs(props);

// 含变量的日记存放路径
const savePath = ref<string>('');
// 日记模板存放路径
const templatePath = ref<string>('');
watch(notebook, newValue => setCalendar(newValue), { deep: true });
async function setCalendar(book: SelectOptionData | undefined) {
  if (!book) {
    await api.pushErrMsg(formatMsg('notNoteBook'));
    return;
  }
  //@fostime comments: 如有需要, 可以参考 https://github.com/frostime/siyuan-dailynote-today/blob/main/src/func/dailynote/past-dn.ts
  // 获取含变量的日记存放路径
  const { conf } = await api.getNotebookConf(book.value as string);
  const { dailyNoteSavePath, dailyNoteTemplatePath } = conf;
  savePath.value = dailyNoteSavePath.replace(/\{\{(.*?)\}\}/g, (match: string) =>
    match.replace(/\bnow\b(?=(?:(?:[^"]*"){2})*[^"]*$)/g, `(toDate "2006-01-02" "[[dateSlot]]")`)
  );
  templatePath.value = dailyNoteTemplatePath.replaceAll('/', '\\');
  // 获取已存在日记的日期
  await getExistDate(new Date());
}

async function getHPath(date: string) {
  const path = savePath.value.replaceAll('[[dateSlot]]', date);
  return api.renderSprig(path);
}

async function getDailyNotesID(hPath: string) {
  if (!notebook.value) {
    return;
  }
  const searchSql = `select * from blocks where type='d' and box = '${notebook.value.value}' and hpath = '${hPath}'`;
  const data = await api.sql(searchSql);
  return data.length ? data[0].id : null;
}

// 创建日记
async function createDailyNote(date: string) {
  if (!date) {
    return;
  }
  if (!notebook.value) {
    await api.pushErrMsg(formatMsg('notNoteBook'));
    return;
  }
  const hPath = await getHPath(date);
  if (!hPath) {
    return;
  }
  const dailyNoteID = await getDailyNotesID(hPath);
  const dateObj = new Date(date);

  // 当前日期已有日记，打开日记
  if (dailyNoteID) {
    // window.open(`siyuan://blocks/${dailyNoteID}`);
    openDoc(dailyNoteID); //打开新建的日记
    setCustomDNAttr(dailyNoteID, dateObj); //为新建的日记添加自定义属性
    return;
  }
  // 当前日期无日记，创建日记
  const docID = await api.createDocWithMd(notebook.value.value as string, hPath, '');
  // window.open(`siyuan://blocks/${docID}`);
  openDoc(docID); //打开新建的日记

  // 根据模板渲染日记
  if (templatePath.value.length) {
    const system = await api.request('/api/system/getConf');
    let templateDir = system.conf.system.dataDir + '\\templates' + templatePath.value;
    const res = await api.render(docID, templateDir);
    await api.prependBlock('dom', res.content, docID);
  }

  addExist(dateObj);
  setCustomDNAttr(docID, dateObj); //为新建的日记添加自定义属性
}

// 当前笔记本为空报错
function formatMsg(key: string) {
  const msg = i18n.value.msg;
  return `${msg.begin} ${msg[key]}`;
}
//已存在日记的日期
const existDate = ref<number[]>([]);
function changePanel(date: string) {
  getExistDate(new Date(date));
}
async function getExistDate(date: Date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const oneDayTime = 24 * 60 * 60 * 1000;
  const firstDate = firstDayOfMonth.getTime() - firstDayOfMonth.getDay() * oneDayTime;
  for (let i = 0; i < 42; i++) {
    const timeStamp = firstDate + i * oneDayTime;
    if (existDate.value.includes(timeStamp)) {
      continue;
    }
    const dateStr = formatDate(new Date(timeStamp));
    const hPath = await getHPath(dateStr);
    const dailyNoteID = await getDailyNotesID(hPath);
    if (!dailyNoteID) {
      continue;
    }
    existDate.value.push(timeStamp);
  }
}

function formatDate(date: Date) {
  const { localeType } = useLocale();
  return date
    .toLocaleDateString(localeType.value.replace(/_/g, '-'), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\//g, '-');
}

// 设置 cell 类
function getCell(date: Date) {
  return existDate.value.includes(date.getTime());
}

function addExist(date: Date) {
  existDate.value.push(date.getTime());
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
