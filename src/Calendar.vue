<template>
    <div>
        <a-date-picker
            v-model:pickerValue="pickerValue"
            hide-trigger
            style="width: 268px; margin: auto; box-shadow: none"
        >
            <template #cell="{ date }">
                <div class="arco-picker-date" @click="createDailyNote(date)">
                    <div class="arco-picker-date-value" :style="getCell(date)">
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
// 当前面板的最后一天
const lastDate = ref(null);
// 当前面板已存在日记的日期
const existDailyNotes = ref([]);
// 含变量的日记存放路径
const dailyNoteSavePath = ref(null);
// 日记模板存放路径
const dailyNoteTemplatePath = ref(null);

const existDailyNotesDay = computed(() => {
    return existDailyNotes.value.map((dailyNote) => {
        return dailyNote.time;
    });
});

watch(
    notebook,
    async (newValue) => {
        if (newValue) {
            await getDailyNotePath(newValue);
            await getExistDailyNote(newValue);
        } else {
            existDailyNotesDay.value = [];
            notebookError();
        }
    },
    { deep: true }
);

const ws = new Socket();
ws.on('removeDoc', resetExistDailyNote);

// 获取当前面板最后一天，并设置cell样式
function getCell(date) {
    const highlightStyle = {
        borderColor: 'rgb(var(--arcoblue-6))',
    };
    lastDate.value = date;
    return existDailyNotesDay.value.includes(date.getTime()) ? highlightStyle : {};
}

// 当前笔记本为空报错
function notebookError() {
    request('/api/notification/pushErrMsg', {
        msg: '[日历插件] 获取当前笔记本失败，请手动设置',
    });
}

// 月/日数字格式化
function padTo2Digit(num) {
    return num.toString().padStart(2, '0');
}

// 递归解析日记存放路径
function parsePath(path) {
    // 年
    if (path.match(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g)) {
        path = path.replaceAll(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g, `{{$<str1>[[year]]$<str2>}}`);
        if (path.match(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g)) {
            path = parsePath(path);
        }
    }
    // 月
    if (path.match(/{{(?<str1>.*?)01(?<str2>.*?)}}/g)) {
        path = path.replaceAll(/{{(?<str1>.*?)01(?<str2>.*?)}}/g, `{{$<str1>[[month]]$<str2>}}`);
        if (path.match(/{{(?<str1>.*?)01(?<str2>.*?)}}/g)) {
            path = parsePath(path);
        }
    }
    // 日
    if (path.match(/{{(?<str1>.*?)02(?<str2>.*?)}}/g)) {
        path = path.replaceAll(/{{(?<str1>.*?)02(?<str2>.*?)}}/g, `{{$<str1>[[day]]$<str2>}}`);
        if (path.match(/{{(?<str1>.*?)02(?<str2>.*?)}}/g)) {
            path = parsePath(path);
        }
    }
    // 去除双括号{{}}包裹
    if (path.match(/{{(?<str>.*?)}}/g)) {
        path = path.replaceAll(/{{(?<str>.*?)}}/g, `$<str>`);
    }
    return path;
}

// 根据含变量的日记存放路径及特定日期返回人类可读路径
function getHPath(path, date) {
    return path
        .replaceAll('[[year]]', date.getFullYear())
        .replaceAll('[[month]]', padTo2Digit(date.getMonth() + 1))
        .replaceAll('[[day]]', padTo2Digit(date.getDate()));
}

// 获取日记设置路径
async function getDailyNotePath(book) {
    // 获取含变量的日记存放路径
    const bookId = book.value;
    const data = await request('/api/notebook/getNotebookConf', { notebook: bookId });
    dailyNoteSavePath.value = data.conf.dailyNoteSavePath.replace(
        /{{.*?"(?<str>.*?)".*?}}/g,
        '{{$<str>}}'
    );
    dailyNoteSavePath.value = parsePath(dailyNoteSavePath.value);
    dailyNoteTemplatePath.value = data.conf.dailyNoteTemplatePath.replaceAll('/', '\\');
}

// 获取已存在的日记
async function getExistDailyNote(book) {
    const bookId = book.value;
    let lastTime = lastDate.value.getTime();
    let tempExistDailyNotes = [];
    // 从当前面板的最后一天开始，循环请求判断是否存在日记文档
    for (let i = 0; i < 42; i++) {
        let timeStamp = lastTime - i * 86400000;
        let hPath = getHPath(dailyNoteSavePath.value, new Date(timeStamp));
        const data = await request('/api/query/sql', {
            stmt: `select * from blocks where type='d' and box = '${bookId}' and hpath = '${hPath}'`,
        });
        if (data.length) {
            tempExistDailyNotes.push({ id: data[0].id, time: timeStamp });
        }
    }
    existDailyNotes.value = tempExistDailyNotes;
}

// 创建日记
async function createDailyNote(date) {
    if (!notebook.value) {
        notebookError();
        return;
    }
    let bookId = notebook.value.value;
    let hPath = getHPath(dailyNoteSavePath.value, date);

    if (existDailyNotesDay.value.includes(date.getTime())) {
        // 打开日记
        let docID = existDailyNotes.value.find((dailyNote) => {
            return dailyNote.time === date.getTime();
        }).id;
        window.open(`siyuan://blocks/${docID}`);
    } else {
        // 创建日记
        const docID = await request('/api/filetree/createDocWithMd', {
            notebook: bookId,
            path: hPath,
            markdown: '',
        });
        existDailyNotes.value.push({ id: docID, time: date.getTime() });
        window.open(`siyuan://blocks/${docID}`);

        // 根据模板渲染笔记
        if (dailyNoteTemplatePath.value.length) {
            const system = await request('/api/system/getConf');
            let templateDir =
                system.conf.system.dataDir + '\\templates' + dailyNoteTemplatePath.value;
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
}

// 重置日记数据
async function resetExistDailyNote() {
    let temp = [];
    for (const dailyNote of existDailyNotes.value) {
        const data = await request('/api/filetree/getHPathByID', { id: dailyNote.id });
        if (data) {
            temp.push(dailyNote);
        }
    }
    existDailyNotes.value = temp;
}
</script>
<style>
.arco-picker-date-value {
    border: 1px solid transparent;
}
</style>
