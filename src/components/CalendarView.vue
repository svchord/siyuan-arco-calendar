<template>
  <div>
    <a-date-picker @picker-value-change="test" hide-trigger style="width: 268px; margin: auto; box-shadow: none">
      <template #cell="{ date }">
        <div class="arco-picker-date" @click="createDailyNote(date)">
          <div class="arco-picker-date-value" :class="{ exist: getCell(date) }">
            {{ date.getDate() }}
          </div>
        </div>
      </template>
    </a-date-picker>
  </div>
</template>
<script lang="ts" setup>
import { request } from '../utils/request';
// import { Socket } from '../utils/socket'
import { watch, computed, ref, toRefs } from 'vue';

const props = defineProps<{ notebook: ArcoOption | undefined }>();
const { notebook } = toRefs(props);

function test(e: Event) {
  console.log(e);
}

// 当前面板已存在日记
const existDailyNotes = ref<DailyNote[]>([]);
// 含变量的日记存放路径
const dailyNoteSavePath = ref<string>('');
// 日记模板存放路径
const dailyNoteTemplatePath = ref<string>('');
// // 当前面板已存在日记的ID
// const existDailyNotesID = computed(() =>
//     existDailyNotes.value.map((dailyNote) => {
//         return dailyNote.id
//     })
// )
// 当前面板已存在日记的路径
const existDailyNotesHpath = computed(() =>
  existDailyNotes.value.map((dailyNote) => {
    return dailyNote.hpath;
  })
);

// 当前笔记本为空报错
function notebookError() {
  existDailyNotes.value = [];
  request('/api/notification/pushErrMsg', {
    msg: '[日历插件] 获取当前笔记本失败，请手动设置'
  });
}

// 月/日数字格式化
function padTo2Digit(num: number) {
  return num.toString().padStart(2, '0');
}

// 递归解析日记存放路径
function parsePath(path: string) {
  // 年
  if (path?.match(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g)) {
    path = path.replaceAll(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g, `{{$<str1>[[year]]$<str2>}}`);
    if (path.match(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g)) {
      path = parsePath(path);
    }
  }
  // 月
  if (path?.match(/{{(?<str1>.*?)01(?<str2>.*?)}}/g)) {
    path = path.replaceAll(/{{(?<str1>.*?)01(?<str2>.*?)}}/g, `{{$<str1>[[month]]$<str2>}}`);
    if (path.match(/{{(?<str1>.*?)01(?<str2>.*?)}}/g)) {
      path = parsePath(path);
    }
  }
  // 日
  if (path?.match(/{{(?<str1>.*?)02(?<str2>.*?)}}/g)) {
    path = path.replaceAll(/{{(?<str1>.*?)02(?<str2>.*?)}}/g, `{{$<str1>[[day]]$<str2>}}`);
    if (path.match(/{{(?<str1>.*?)02(?<str2>.*?)}}/g)) {
      path = parsePath(path);
    }
  }
  // 去除双括号{{}}包裹
  if (path?.match(/{{(?<str>.*?)}}/g)) {
    path = path.replaceAll(/{{(?<str>.*?)}}/g, `$<str>`);
  }
  return path;
}

function deconstructDate(date: Date): DeconstructDate {
  return [date.getFullYear().toString(), padTo2Digit(date.getMonth() + 1), padTo2Digit(date.getDate())];
}

// 根据含变量的日记存放路径及特定日期返回人类可读路径
function getHpath(path: String, date: DeconstructDate) {
  const [year, month, day] = date;
  return path?.replaceAll('[[year]]', year)?.replaceAll('[[month]]', month)?.replaceAll('[[day]]', day);
}

async function getExistDailyNotes(book: ArcoOption) {
  let hpath = getHpath(dailyNoteSavePath.value, ['%', '%', '%']);
  const dailyNotes = await request('/api/query/sql', {
    stmt: `select * from blocks where type='d' and box = '${book.value}' and hpath like '${hpath}'`
  });
  let tempExistDailyNotes = [];
  if (dailyNotes.length) {
    for (const dailyNote of dailyNotes) {
      tempExistDailyNotes.push({ id: dailyNote.id, hpath: dailyNote.hpath });
    }
  }
  existDailyNotes.value = tempExistDailyNotes;
}

watch(notebook, (newValue) => setCalendar(newValue), { deep: true });
async function setCalendar(book: ArcoOption | undefined) {
  if (!book) {
    notebookError();
    return;
  }
  // 获取含变量的日记存放路径
  const bookID = book.value;
  const data = await request('/api/notebook/getNotebookConf', { notebook: bookID });
  dailyNoteSavePath.value = data.conf.dailyNoteSavePath.replace(/{{.*?"(?<str>.*?)".*?}}/g, '{{$<str>}}');
  dailyNoteSavePath.value = parsePath(dailyNoteSavePath.value);
  dailyNoteTemplatePath.value = data.conf.dailyNoteTemplatePath.replaceAll('/', '\\');

  // 获取已存在的日记
  getExistDailyNotes(book);
}

// 重置日记数据
// const ws = new Socket()
// ws.on('removeDoc', resetExistDailyNote)

// function resetExistDailyNote(data: { ids: string[] }) {
//     const book = notebook.value
//     if (!book) {
//         notebookError()
//         return
//     }
//     // 删除日记
//     const removeDocID = data.ids[0]
//     if (existDailyNotesID.value.includes(removeDocID)) {
//         existDailyNotes.value = existDailyNotes.value.filter((dailyNote) => {
//             return dailyNote.id !== removeDocID
//         })
//         return
//     }
//     // 删除日记祖先文档
//     setTimeout(() => {
//         getExistDailyNotes(book)
//     }, 3000)
// }

// 创建日记
async function createDailyNote(date: Date) {
  if (!notebook.value) {
    notebookError();
    return;
  }
  let bookID = notebook.value.value;
  let hpath = getHpath(dailyNoteSavePath.value, deconstructDate(date));

  // 当前日期已有日记，打开日记
  if (existDailyNotesHpath.value.includes(hpath)) {
    let docID = existDailyNotes.value.find((dailyNote) => {
      return dailyNote.hpath === hpath;
    })?.id;
    window.open(`siyuan://blocks/${docID}`);
    return;
  }
  // 当前日期无日记，创建日记
  const docID = await request('/api/filetree/createDocWithMd', {
    notebook: bookID,
    path: hpath,
    markdown: ''
  });
  existDailyNotes.value.push({ id: docID, hpath: hpath });
  window.open(`siyuan://blocks/${docID}`);

  // 根据模板渲染日记
  if (dailyNoteTemplatePath.value.length) {
    const system = await request('/api/system/getConf');
    let templateDir = system.conf.system.dataDir + '\\templates' + dailyNoteTemplatePath.value;
    const render = await request('/api/template/render', {
      id: docID,
      path: templateDir
    });
    request('/api/block/prependBlock', {
      data: render.content,
      dataType: 'dom',
      parentID: docID
    });
  }
}

// 设置 cell 类
function getCell(date: Date) {
  let hpath = getHpath(dailyNoteSavePath.value, deconstructDate(date));
  return existDailyNotesHpath.value.includes(hpath);
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
