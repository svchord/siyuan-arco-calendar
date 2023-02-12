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

<script>
import { request } from './utils';
import { Socket } from './socket';
export default {
    props: ['notebook'],
    data() {
        return {
            pickerValue: null,
            // 当前面板的最后一天
            lastDate: null,
            // 当前面板已存在日记的日期
            existDailyNotes: [],
            // 含变量的日记存放路径
            dailyNoteSavePath: null,
            // 日记模板存放路径
            dailyNoteTemplatePath: null,
        };
    },
    watch: {
        notebook: {
            async handler(newValue) {
                if (newValue) {
                    await this.getDailyNotePath(newValue);
                    await this.getExistDailyNote(newValue);
                } else {
                    this.notebookError();
                }
            },
            deep: true,
        },
    },
    methods: {
        // 获取当前面板最后一天，并设置cell样式
        getCell(date) {
            const highlightStyle = {
                borderColor: 'rgb(var(--arcoblue-6))',
            };
            this.lastDate = date;
            return this.existDailyNotes.includes(date.getTime()) ? highlightStyle : {};
        },
        // 当前笔记本为空报错
        notebookError() {
            request('/api/notification/pushErrMsg', {
                msg: '[日历插件] 获取当前笔记本失败，请手动设置',
            });
        },
        // 月/日数字格式化
        padTo2Digit(num) {
            return num.toString().padStart(2, '0');
        },
        // 递归解析日记存放路径
        parsePath(path) {
            // 年
            if (path.match(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g)) {
                path = path.replaceAll(
                    /{{(?<str1>.*?)2006(?<str2>.*?)}}/g,
                    `{{$<str1>[[year]]$<str2>}}`
                );
                path = this.parsePath(path);
            }
            // 月
            if (path.match(/{{(?<str1>.*?)01(?<str2>.*?)}}/g)) {
                path = path.replaceAll(
                    /{{(?<str1>.*?)01(?<str2>.*?)}}/g,
                    `{{$<str1>[[month]]$<str2>}}`
                );
                path = this.parsePath(path);
            }
            // 日
            if (path.match(/{{(?<str1>.*?)02(?<str2>.*?)}}/g)) {
                path = path.replaceAll(
                    /{{(?<str1>.*?)02(?<str2>.*?)}}/g,
                    `{{$<str1>[[day]]$<str2>}}`
                );
                path = this.parsePath(path);
            }
            // 去除双括号{{}}包裹
            if (path.match(/{{(?<str>.*?)}}/g)) {
                path = path.replaceAll(/{{(?<str>.*?)}}/g, `$<str>`);
            }
            return path;
        },
        // 根据含变量的日记存放路径及特定日期返回人类可读路径
        getHPath(path, date) {
            return path
                .replaceAll('[[year]]', date.getFullYear())
                .replaceAll('[[month]]', this.padTo2Digit(date.getMonth() + 1))
                .replaceAll('[[day]]', this.padTo2Digit(date.getDate()));
        },
        // 获取日记设置路径
        async getDailyNotePath(book) {
            // 获取含变量的日记存放路径
            const bookId = book.value;
            const data = await request('/api/notebook/getNotebookConf', { notebook: bookId });
            this.dailyNoteSavePath = data.conf.dailyNoteSavePath.replace(
                /{{.*?"(?<str>.*?)".*?}}/g,
                '{{$<str>}}'
            );
            this.dailyNoteSavePath = this.parsePath(this.dailyNoteSavePath);
            this.dailyNoteTemplatePath = data.conf.dailyNoteTemplatePath.replaceAll('/', '\\');
        },
        // 获取已存在的日记
        async getExistDailyNote(book) {
            // 从当前面板的最后一天开始，循环请求判断是否存在日记文档
            const bookId = book.value;
            let lastTime = this.lastDate.getTime();
            let tempExistDailyNotes = [];
            for (let i = 0; i < 42; i++) {
                let timeStamp = lastTime - i * 86400000;
                let hPath = this.getHPath(this.dailyNoteSavePath, new Date(timeStamp));
                let data = await request('/api/query/sql', {
                    stmt: `select * from blocks where type='d' and box = '${bookId}' and hpath = '${hPath}'`,
                });
                if (data.length) {
                    tempExistDailyNotes.push(timeStamp);
                }
            }
            this.existDailyNotes = tempExistDailyNotes;
        },
        // 创建日记
        async createDailyNote(date) {
            if (this.notebook) {
                // 创建笔记
                const docID = await request('/api/filetree/createDocWithMd', {
                    notebook: this.notebook.value,
                    path: this.getHPath(this.dailyNoteSavePath, date),
                    markdown: '',
                });
                this.existDailyNotes.push(date.getTime());
                window.open(`siyuan://blocks/${docID}`);

                // 根据模板渲染笔记
                if (this.dailyNoteTemplatePath.length) {
                    const system = await request('/api/system/getConf');
                    let templateDir =
                        system.conf.system.dataDir + '\\templates' + this.dailyNoteTemplatePath;
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
            } else {
                this.notebookError();
            }
        },
    },
    mounted() {
        const ws = new Socket();
        ws.on('removeDoc', this.getExistDailyNote);
    },
};
</script>
<style>
.arco-picker-date-value {
    border: 1px solid transparent;
}
</style>
