<template>
    <div>
        <a-date-picker
            default-value="2023-02-03"
            v-model:pickerValue="pickerValue"
            hide-trigger
            style="width: 268px; margin: auto"
        >
            <template #cell="{ date }">
                <div class="arco-picker-date">
                    <div class="arco-picker-date-value" :style="getCellStyle(date)">
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
            highlightDates: ['2023-02-01', '2023-02-02', '2023-02-07'],
        };
    },
    methods: {
        async getExistDailynote() {
            const data = await request('/api/notebook/lsNotebooks');
            
        },

        getCellStyle(date) {
            const highlightStyle = {
                border: '1px solid rgb(var(--arcoblue-6))',
            };
            return this.highlightDates.includes(date.toJSON().substr(0, 10)) ? highlightStyle : {};
        },
    },
    mounted() {
        
    },
};
</script>
