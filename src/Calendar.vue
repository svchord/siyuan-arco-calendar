<template>
    <div>
        <a-date-picker
            v-model:pickerValue="pickerValue"
            hide-trigger
            style="width: 268px; margin: auto"
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
export default {
    props: ['notebook'],
    data() {
        return {
            pickerValue: null,
            date: null,
            dailyNoteSavePath: null,
            existDailyNotes: [],
        };
    },
    watch: {
        notebook: {
            handler(newValue) {
                if (newValue) {
                    this.getExistDailyNote(newValue);
                } else {
                    this.notebookError();
                }
            },
            deep: true,
        },
        existDailyNotes() {
            this.$forceUpdate();
        },
    },
    methods: {
        notebookError() {
            let body = { msg: '[日历插件] 获取当前笔记本失败，请手动设置' };
            request('/api/notification/pushErrMsg', body);
        },
        padTo2Digit(num) {
            return num.toString().padStart(2, '0');
        },
        parsePath(path) {
            if (path.match(/{{(?<str1>.*?)2006(?<str2>.*?)}}/g)) {
                path = path.replaceAll(
                    /{{(?<str1>.*?)2006(?<str2>.*?)}}/g,
                    `{{$<str1>[[year]]$<str2>}}`
                );
                path = this.parsePath(path);
            }
            if (path.match(/{{(?<str1>.*?)01(?<str2>.*?)}}/g)) {
                path = path.replaceAll(
                    /{{(?<str1>.*?)01(?<str2>.*?)}}/g,
                    `{{$<str1>[[month]]$<str2>}}`
                );
                path = this.parsePath(path);
            }
            if (path.match(/{{(?<str1>.*?)02(?<str2>.*?)}}/g)) {
                path = path.replaceAll(
                    /{{(?<str1>.*?)02(?<str2>.*?)}}/g,
                    `{{$<str1>[[day]]$<str2>}}`
                );
                path = this.parsePath(path);
            }
            if (path.match(/{{(?<str>.*?)}}/g)) {
                path = path.replaceAll(/{{(?<str>.*?)}}/g, `$<str>`);
            }
            return path;
        },
        getHPath(path, date) {
            return path
                .replaceAll('[[year]]', date.getFullYear())
                .replaceAll('[[month]]', this.padTo2Digit(date.getMonth() + 1))
                .replaceAll('[[day]]', this.padTo2Digit(date.getDate()));
        },
        async getExistDailyNote(book) {
            const bookId = book.value;
            const body = { notebook: bookId };
            const data = await request('/api/notebook/getNotebookConf', body);
            this.dailyNoteSavePath = data.conf.dailyNoteSavePath.replace(
                /{{.*?"(?<str>.*?)".*?}}/g,
                '{{$<str>}}'
            );
            this.dailyNoteSavePath = this.parsePath(this.dailyNoteSavePath);
            let lastday = this.date.getTime();
            let tempExistDailyNotes = [];
            for (let i = 0; i < 42; i++) {
                let timeStamp = lastday - i * 86400000;
                let hPath = this.getHPath(this.dailyNoteSavePath, new Date(timeStamp));
                let body = {
                    stmt: `select * from blocks where type='d' and box = '${bookId}' and hpath = '${hPath}'`,
                };
                let data = await request('/api/query/sql', body);
                if (data.length) {
                    tempExistDailyNotes.push(timeStamp);
                }
            }
            this.existDailyNotes = tempExistDailyNotes;
            console.log(this.existDailyNotes);
        },
        async createDailyNote(date) {
            if (this.notebook) {
                let body = {
                    notebook: this.notebook.value,
                    path: this.getHPath(this.dailyNoteSavePath, date),
                    markdown: '',
                };
                await request('/api/filetree/createDocWithMd', body);
                this.existDailyNotes.push(date.getTime());
            } else {
                this.notebookError();
            }
        },
        getCell(date) {
            const highlightStyle = {
                borderColor: 'rgb(var(--arcoblue-6))',
            };
            this.date = date;
            return this.existDailyNotes.includes(date.getTime()) ? highlightStyle : {};
        },
    },
};
</script>
<style>
.arco-picker-date-value {
    border: 1px solid transparent;
}
</style>
