# arco-calendar

依赖 arco design 组件库开发的思源笔记日历插件，基于[社区插件系统](https://github.com/zuoez02/siyuan-plugin-system)

![预览图](preview.png)

## 手动安装插件

-   确保你已经安装了插件系统，[安装教程地址](https://github.com/zuoez02/siyuan-plugin-system/blob/main/README_zh.md)
-   复制 `calendar` 目录下的文件到 `工作空间/data/plugins` 目录下
-   重载思源，关闭插件系统的安全模式，并开启该插件

## 修改颜色

将以下代码插入 `theme.css` 内,并自行修改颜色

```css
// 暗黑模式的颜色即下两行开头添加"[data-theme-mode='dark']"
.arco-tabs,
.arco-trigger-popup {
    // 主色 (r,g,b)
    --primary-6: 53, 117, 240;
    // 浅主色
    --color-primary-light-2: var(--b3-theme-primary-lightest);

    // 页面底色
    --color-bg-1: var(--b3-menu-background);
    // 下拉选择框输入时底色
    --color-bg-2: var(--b3-menu-background);
    // 下拉选择框底色 && 下拉菜单选项悬浮底色
    --color-fill-2: var(--b3-list-hover);
    --color-fill-3: var(--b3-list-hover);

    // 日历底色
    --color-bg-popup: var(--b3-menu-background);
}
```

## 参考与感谢

-   [BryceAndJuly](https://github.com/BryceAndJuly) 在社区中的[首次实现](https://ld246.com/article/1662969146166)
-   [HowcanoeWang/calendar](https://github.com/HowcanoeWang/calendar) 对上一项目的反编译以及功能拓展
-   [九炎](https://github.com/leolee9086) 大佬提供的 WebSocket 封装模板
-   [zuoez02](https://github.com/zuoez02) 大佬创建的 [社区插件系统](https://github.com/zuoez02/siyuan-plugin-system)
