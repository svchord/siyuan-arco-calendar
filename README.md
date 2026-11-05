# arco-calendar

简体中文 \| [English](README_en_US.md)

思源笔记日历面板插件：在顶栏或边栏打开日历，快速新建或跳转到某一天的日记，并用年度热力图回顾日记活跃度。

<img width="1280" alt="preview" src="public/preview.png">

## 修改颜色

插件使用 shadcn/Base UI 的 CSS 变量，可以直接在主题或代码片段中覆盖：

```css
.sy-calendar-root,
.sy-calendar-portal,
.sy-calendar-setting,
.sy-calendar-popup {
  /* 主色和主色文字 */
  --primary: #3575f0;
  --primary-foreground: #ffffff;

  /* 页面和卡片 */
  --background: var(--b3-menu-background);
  --foreground: var(--b3-theme-on-background);
  --card: var(--b3-menu-background);
  --card-foreground: var(--b3-theme-on-background);

  /* 弱化背景和文字 */
  --muted: var(--b3-list-hover);
  --muted-foreground: var(--b3-theme-on-surface);

  /* 边框、输入框和焦点 */
  --border: var(--b3-border-color);
  --input: var(--b3-border-color);
  --ring: var(--b3-theme-on-surface);

  /* 圆角 */
  --radius: 0.625rem;
}

/* 暗色模式单独覆盖 */
.sy-calendar-root.dark,
.sy-calendar-portal.dark,
.sy-calendar-setting.dark,
.sy-calendar-popup.dark {
  --primary: #8ab4ff;
  --primary-foreground: #171717;
}
```

默认情况下 `--primary` 回退到 Vega 预设的中性色阶。开启设置中的「使用主题色」后，插件改为在 `<html>` 上发布 `--arco-calendar-accent` / `--arco-calendar-accent-foreground`，由它们接管 `--primary`，从而跟随思源主题强调色；想固定配色时覆盖上面两个变量即可。

主要使用的变量：

| 变量                                 | 作用                           |
| ------------------------------------ | ------------------------------ |
| `--primary` / `--primary-foreground` | 今天按钮、选中日期、焦点强调色 |
| `--background` / `--foreground`      | 面板底色和正文颜色             |
| `--card` / `--card-foreground`       | 面板卡片颜色                   |
| `--muted` / `--muted-foreground`     | 周数、提示文字和弱化背景       |
| `--border` / `--input`               | 分隔线、边框和输入控件         |
| `--ring`                             | 键盘焦点环                     |
| `--radius`                           | 面板和控件的圆角               |

## 功能

- 顶栏左侧、顶栏右侧或边栏 Dock 三种入口位置
- 月历上标记已经存在的日记，点击任意日期即可打开或创建日记
- 已有日记的日期使用主题色淡圆底标记，缺失日记的日期保持空白；日记内存在未完成任务时显示琥珀色角标
- 今天在日期下方显示一个小圆点，选中后切换为对比色，不会与选中底色混在一起
- 顶部月份/年份下拉选择，右上角提供刷新与设置入口
- 设置项：入口位置、每周起始日、显示周数、显示未完成任务标记、使用主题色
- 「使用主题色」开启后，选中日期、按钮、日记圆底和热力图改用思源主题强调色；关闭则使用 Vega 中性配色
- 「日历 / 热力图」切换；年度热力图按笔记内容块数量显示活跃度，日记内容块归入日记日期，其他笔记按内容块创建日期统计
- 热力图按周排列，支持周起始日设置与年份切换；悬停色块可查看当天内容块数量，点击可打开或创建当天日记，底部显示全年合计
- 笔记本选择器支持搜索，选择结果会同步到思源的 `local-dailynoteid`
- 跟随思源主题自动切换明暗配色，支持桌面端、移动端和浏览器端

## 技术栈

- **React 19** + TypeScript
- **shadcn/ui**（Vega 预设）与 Base UI 无障碍原语
- **Tailwind CSS 4**，只输出插件用到的样式，并将设计变量映射到思源主题变量
- **Vite 8** 库模式打包，React 随插件一起打包，不依赖宿主的全局 React

`src/components/ui` 下的组件来自 shadcn/ui `base-vega` 分发版本；插件特有行为放在业务组件中，不直接修改这些文件。

## 开发

要求 Node.js >= 24、pnpm 12。

```bash
pnpm install
pnpm type-check
pnpm test
pnpm build
```

`pnpm build` 会依次执行清单校验、类型检查、生产构建，并在根目录生成 `package.zip`。

开发调试：

```bash
pnpm dev   # 监听构建到 dev/，并链接到思源插件目录
```

`pnpm dev` 由 devkit 的 Vite 插件驱动：启动时把 `dev/` 链接到思源工作空间的插件目录，
不需要额外的链接或安装命令。

`pnpm dev` 产物一变就广播 `/api/ui/reloadUI` 整页刷新：思源重新走启动流程，
`index.js` 与 `index.css` 一并拿到磁盘真值。本体窗口也会一起刷新，会丢光标/滚动/
打开面板——这是明确接受的代价。

默认**不**起常驻测量页（`auditBrowser: false`），省内存。需要 agent 用
`syt measure --attach` 复用常驻页时，在 `siyuanPlugin({ auditBrowser: true })`
下跑 `pnpm dev`；开启后刷新期间由读租约挡住测量。`--attach` 连不上会直接报错，
不会静默新开浏览器。

Windows 上创建目录符号链接需要权限。插件目录必须是真符号链接（思源的 Go 运行时
不认 junction），所以缺少权限时 devkit 会请求一次 UAC；拒绝会直接结束会话并报错，
不会退化成复制。

也可以在终端中设置 `SIYUAN_PLUGIN_DIR` 指向 `<工作空间>/data/plugins`，跳过自动查找工作空间。

排查渲染样式（颜色、间距、形状）时，用 devkit 提供的测量与截图命令：

```bash
pnpm measure tokens --rc-text-primary --rc-bg-page   # 令牌计算值
pnpm measure styles .dock__item --props border-radius # 元素计算样式
pnpm measure count .dock__item                       # 选择器命中数
pnpm shot                                            # 无头截取桌面端/移动端截图
```

交互与布局要用真实事件驱动（`--do hover:...` / `--setup contextmenu:...`）。
菜单项等元素在打开前不在 DOM 里，必须先 `--setup`（例如
`pnpm measure styles .b3-menu__item --setup contextmenu:.b3-list-item`）；
`pnpm measure --help` 列出全部子命令。

## 发布

发布流程使用 [semantic-release](https://github.com/semantic-release/semantic-release)，全自动完成：

1. 合并到 `main`（直接 push 或合并 PR）后，按 Conventional Commits 计算版本
2. 自动更新 `package.json`、`public/plugin.json` 与 `CHANGELOG.md`
3. 自动打 `vX.Y.Z` tag，执行 `pnpm check` 与生产构建
4. 创建 GitHub Release 并上传 `package.zip`

无需手动改版本或创建 Release PR。提交信息需遵循 Conventional Commits（`feat:` / `fix:` / `chore:`…）。

## 版本日志

[Changelog](./CHANGELOG.md)

## 参考与感谢

- [BryceAndJuly](https://github.com/BryceAndJuly) 在社区中的[首次实现](https://ld246.com/article/1662969146166)
- [HowcanoeWang/calendar](https://github.com/HowcanoeWang/calendar) 对上一项目的反编译以及功能拓展
- [九炎](https://github.com/leolee9086) 大佬提供的 WebSocket 封装模板

## License

[License](./LICENSE)
