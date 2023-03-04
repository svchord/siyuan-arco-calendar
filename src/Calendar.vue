<template>
    <div>
        <a-date-picker
            v-model:pickerValue="pickerValue"
            hide-trigger
            style="width: 268px; margin: auto; box-shadow: none"
        >
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
<script setup>
import { request } from './utils';
import { Socket } from './socket';
import { watch, computed, ref, toRefs } from 'vue';

const props = defineProps(['notebook']);
const { notebook } = toRefs(props);

const pickerValue = ref(null);
// 当前面板已存在日记
const existDailyNotes = ref([]);
// 含变量的日记存放路径
const dailyNoteSavePath = ref(null);
// 日记模板存放路径
const dailyNoteTemplatePath = ref(null);
// 当前面板已存在日记的ID
const existDailyNotesID = computed(() =>
    existDailyNotes.value.map((dailyNote) => {
        return dailyNote.id;
    })
);
// 当前面板已存在日记的路径
const existDailyNotesHpath = computed(() =>
    existDailyNotes.value.map((dailyNote) => {
        return dailyNote.hpath;
    })
);

// 当前笔记本为空报错
function notebookIsNull() {
    if (notebook.value) {
        return false;
    }
    existDailyNotes.value = [];
    request('/api/notification/pushErrMsg', {
        msg: '[日历插件] 获取当前笔记本失败，请手动设置',
    });
    return true;
}

// 月/日数字格式化
function padTo2Digit(num) {
    return num.toString().padStart(2, '0');
}

// 递归解析日记存放路径
function parsePath(path) {
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

function deconstructDate(date) {
    return [date.getFullYear(), padTo2Digit(date.getMonth() + 1), padTo2Digit(date.getDate())];
}

// 根据含变量的日记存放路径及特定日期返回人类可读路径
function getHpath(path, date = [year, month, day]) {
    const [year, month, day] = date;
    return path
        ?.replaceAll('[[year]]', year)
        ?.replaceAll('[[month]]', month)
        ?.replaceAll('[[day]]', day);
}

async function getExistDailyNotes(book) {
    let hpath = getHpath(dailyNoteSavePath.value, ['%', '%', '%']);
    const dailyNotes = await request('/api/query/sql', {
        stmt: `select * from blocks where type='d' and box = '${book.value}' and hpath like '${hpath}'`,
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
async function setCalendar(book) {
    if (notebookIsNull()) {
        return;
    }
    // 获取含变量的日记存放路径
    const bookID = book.value;
    const data = await request('/api/notebook/getNotebookConf', { notebook: bookID });
    dailyNoteSavePath.value = data.conf.dailyNoteSavePath.replace(
        /{{.*?"(?<str>.*?)".*?}}/g,
        '{{$<str>}}'
    );
    dailyNoteSavePath.value = parsePath(dailyNoteSavePath.value);
    dailyNoteTemplatePath.value = data.conf.dailyNoteTemplatePath.replaceAll('/', '\\');

    // 获取已存在的日记
    getExistDailyNotes(book);
}

// 重置日记数据
const ws = new Socket();
ws.on('removeDoc', resetExistDailyNote);

function resetExistDailyNote(data) {
    if (notebookIsNull()) {
        return;
    }
    // 删除日记
    const removeDocID = data.ids[0];
    if (existDailyNotesID.value.includes(removeDocID)) {
        existDailyNotes.value = existDailyNotes.value.filter((dailyNote) => {
            return dailyNote.id !== removeDocID;
        });
        return;
    }
    // 删除日记祖先文档
    setTimeout(() => {
        getExistDailyNotes(notebook.value);
    }, 3000);
}

// 创建日记
async function createDailyNote(date) {
    if (notebookIsNull()) {
        return;
    }
    let bookID = notebook.value.value;
    let hpath = getHpath(dailyNoteSavePath.value, deconstructDate(date));

    // 当前日期已有日记，打开日记
    if (existDailyNotesHpath.value.includes(hpath)) {
        let docID = existDailyNotes.value.find((dailyNote) => {
            return dailyNote.hpath === hpath;
        }).id;
        window.open(`siyuan://blocks/${docID}`);
        return;
    }
    // 当前日期无日记，创建日记
    const docID = await request('/api/filetree/createDocWithMd', {
        notebook: bookID,
        path: hpath,
        markdown: '',
    });
    existDailyNotes.value.push({ id: docID, hpath: hpath });
    window.open(`siyuan://blocks/${docID}`);

    // 根据模板渲染日记
    if (dailyNoteTemplatePath.value.length) {
        const system = await request('/api/system/getConf');
        let templateDir = system.conf.system.dataDir + '\\templates' + dailyNoteTemplatePath.value;
        const render = await request('/api/template/render', {
            id: docID,
            path: templateDir,
        });
        request('/api/block/prependBlock', {
            data: render.content,
            dataType: 'dom',
            parentID: docID,
        });
    }
}

// 设置 cell 类
function getCell(date) {
    let hpath = getHpath(dailyNoteSavePath.value, deconstructDate(date));
    return existDailyNotesHpath.value.includes(hpath);
}
</script>
<style lang="less">
body[arco-theme='dark'] {
    // 页面底色
    --color-bg-1: #21252b !important;
    // 下拉选择框输入时底色
    --color-bg-2: #21252b !important;
    // 下拉选择框底色 && 下拉菜单选项悬浮底色
    --color-fill-2: #323842 !important;
    --color-fill-3: #323842 !important;

    // 日历底色
    --color-bg-popup: #282c34 !important;
    // 非当月日期，有日记底色（r,g,b）
    --gray-1: 33, 37, 43 !important;
    // 当月日期，有日记底色（r,g,b,a）
    --arcoblue-1: 60, 126, 255, 0.2 !important;
}

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
                border-color: rgb(var(--arcoblue-6));
            }
            .exist {
                color: rgb(var(--arcoblue-6)) !important;
                background-color: rgb(var(--arcoblue-1));
                &:hover {
                    background-color: rgb(var(--arcoblue-1)) !important;
                }
            }
        }
        // 非当月日期
        &:not(.arco-picker-cell-in-view) {
            .arco-picker-date-value:hover {
                border-color: rgb(var(--gray-4));
            }
            .exist {
                background-color: rgb(var(--gray-1));
                &:hover {
                    background-color: rgb(var(--gray-1)) !important;
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
