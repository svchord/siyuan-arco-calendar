/*
 * @Author: Seven Chord hjlcarl@163.com
 * @Date: 2023-02-12 12:49:47
 * @LastEditors: Seven Chord hjlcarl@163.com
 * @LastEditTime: 2023-05-21 21:20:02
 * @FilePath: \arco-calendar\components.d.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// generated by unplugin-vue-components
// We suggest you to commit this file into source control
// Read more: https://github.com/vuejs/core/pull/3399
import '@vue/runtime-core';

export {};

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ADatePicker: typeof import('@arco-design/web-vue')['DatePicker'];
    AOption: typeof import('@arco-design/web-vue')['Option'];
    ASelect: typeof import('@arco-design/web-vue')['Select'];
    ATabPane: typeof import('@arco-design/web-vue')['TabPane'];
    ATabs: typeof import('@arco-design/web-vue')['Tabs'];
    CalendarView: typeof import('./src/components/CalendarView.vue')['default'];
  }
}
