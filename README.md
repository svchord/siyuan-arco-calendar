# arco-calendar

简体中文 \| [English](README_en_US.md)

依赖 arco design 组件库开发的思源笔记日历插件

<img width="1280" alt="preview" src="https://github.com/svchord/siyuan-arco-calendar/assets/61345763/6bdf09a9-b5a1-48f7-b499-340d44397787">

## 参考与感谢

- [BryceAndJuly](https://github.com/BryceAndJuly) 在社区中的[首次实现](https://ld246.com/article/1662969146166)
- [HowcanoeWang/calendar](https://github.com/HowcanoeWang/calendar) 对上一项目的反编译以及功能拓展
- [九炎](https://github.com/leolee9086) 大佬提供的 WebSocket 封装模板

## 修改颜色

将以下代码插入 `theme.css` 内,并自行修改颜色

```css
// 暗黑模式的颜色即下两行开头添加"[data-theme-mode='dark']"
.arco-tabs,
.arco-trigger-popup {
  // 主色 (r,g,b)
  --arco-primary: 53, 117, 240;
  --primary-6: var(--arco-primary);
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

  // 边框颜色
  --color-neutral-3: var(--b3-border-color);

  // 文字颜色
  --color-text-1: var(--b3-theme-on-background);
}
```

## 版本日志

[Changelog](./CHANGELOG.md)

## License

[License](./LICENSE)
