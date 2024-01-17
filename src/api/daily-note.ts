/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-12-14 12:06:48
 * @FilePath     : /src/utils/daily-note.ts
 * @LastEditTime : 2023-12-14 12:44:40
 * @Source       : 
 */
import { openTab, openMobileFileById } from 'siyuan';
import * as serverApi from './api';
import { app, isMobile } from '@/hooks/useSiYuan';

/**
 * Format Date to yyyyMMdd
 * https://github.com/frostime/siyuan-dailynote-today/blob/main/src/func/dailynote/basic.ts
 * @param date date, default now
 * @param sep separator, default ''
 * @returns 
 */
export function formatDate(date?: Date, sep=''): string {
    date = date === undefined ? new Date() : date;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}${sep}${month < 10 ? '0' + month : month}${sep}${day < 10 ? '0' + day : day}`;
}

/**
 * 对 DailyNote 的自定义属性进行设置, custom-dailynote-yyyyMMdd: yyyyMMdd
 * https://github.com/frostime/siyuan-dailynote-today/blob/v1.3.0/src/func/dailynote/dn-attr.ts
 * @Ref https://github.com/siyuan-note/siyuan/issues/9807
 * @param doc_id 日记的 id
 */
export function setCustomDNAttr(doc_id: string, date?: Date) {
    const td = formatDate(date);
    const attr = `custom-dailynote-${td}`;
    // 构建 attr: td
    const attrs: { [key: string]: string } = {};
    attrs[attr] = td;
    serverApi.setBlockAttrs(doc_id, attrs);
}


export function openDoc(doc_id: DocumentId) {
    //打开文档
    if (isMobile.value === true) {
        openMobileFileById(app.value, doc_id, ['cb-get-all']);
    } else {
        openTab({
            app: app.value,
            doc: {
                id: doc_id,
                zoomIn: false
            }
        });
    }
}

