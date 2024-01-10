<template>
  <div>
    <a-date-picker
      @change="createDailyNote"
      @picker-value-change="changePanel"
      hide-trigger
      style="width: 268px; margin: auto; box-shadow: none"
    >
      <template #cell="{ date }">
        <div class="arco-picker-date" @click="addExistClass(date)">
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
import * as api from '@/utils/api';
import { useLocale, formatMsg } from '@/hooks/useLocale';
import { openDoc, setCustomDNAttr } from '@/utils/daily-note';
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
  if (dailyNoteTemplatePath) {
    const system = await api.request('/api/system/getConf');
    templatePath.value = system.conf.system.dataDir + '/templates' + dailyNoteTemplatePath;
  }
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
    openDoc(dailyNoteID); //打开新建的日记
    setCustomDNAttr(dailyNoteID, dateObj); //为新建的日记添加自定义属性
    return;
  }
  // 当前日期无日记，创建日记
  const docID = await api.createDocWithMd(notebook.value.value as string, hPath, '');
  openDoc(docID); //打开新建的日记

  // 根据模板渲染日记
  if (templatePath.value.length) {
    const res = await api.render(docID, templatePath.value);
    await api.prependBlock('dom', res.content, docID);
  }

  addExistClass(dateObj);
  setCustomDNAttr(docID, dateObj); //为新建的日记添加自定义属性
}

//已存在日记的日期
const existDate = ref(new Set());
function changePanel(date: string) {
  getExistDate(new Date(date));
}
async function getExistDate(date: Date) {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const oneDayTime = 24 * 60 * 60 * 1000;
  const firstDate = firstDayOfMonth.getTime() - firstDayOfMonth.getDay() * oneDayTime;
  for (let i = 0; i < 42; i++) {
    const timeStamp = firstDate + i * oneDayTime;
    const dateStr = formatDate(new Date(timeStamp));
    const hPath = await getHPath(dateStr);
    const dailyNoteID = await getDailyNotesID(hPath);
    if (dailyNoteID) {
      existDate.value.add(timeStamp);
    } else {
      existDate.value.delete(timeStamp);
    }
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
  return existDate.value.has(date.getTime());
}

function addExistClass(date: Date) {
  existDate.value.add(date.getTime());
}
</script>
