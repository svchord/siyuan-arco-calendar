# arco-calendar

简体中文 \| [English](README_en_US.md)

思源笔记日历面板插件：在顶栏或边栏打开日历，快速新建或跳转到某一天的日记，并用年度热力图回顾日记活跃度。

<img width="1280" alt="preview" src="public/preview.png">

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

## 安装

在思源集市搜索「日历面板」安装，或从 [Releases](https://github.com/svchord/siyuan-arco-calendar/releases) 下载 `package.zip`，解压到 `<工作空间>/data/plugins/` 后在思源中启用。

要求思源 3.8.5 及以上。

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

## 开发

要求 Node.js >= 24.15、pnpm 12。

```bash
pnpm install
pnpm dev     # 监听构建，产物自动链接到思源插件目录并热刷新
pnpm check   # 格式 + lint + 类型 + 测试
pnpm build   # 生产构建，生成 package.zip
```

Windows 上链接插件目录需要管理员权限，缺少权限时构建会请求一次 UAC；拒绝则结束会话并报错。
也可以用 `SIYUAN_PLUGIN_DIR` 指向 `<工作空间>/data/plugins`，跳过自动查找工作空间。

样式、交互等改动请在真实思源窗口里验证；`src/components/ui` 下的组件来自 shadcn/ui `base-vega` 分发版本，插件特有行为放在业务组件中，不直接修改这些文件。

## 发布

发布流程使用 [release-please](https://github.com/googleapis/release-please) 管理版本，仓库里不手写版本号：

```
普通 PR 合入 main
  └─ release-please 开/更新 Release PR「chore(main): release x.y.z」
       └─ 合并该 PR
            └─ 自动打 tag、建 GitHub Release、生成 CHANGELOG.md
                 └─ 构建并上传 package.zip
```

PR 标题需遵循 Conventional Commits（`feat:` / `fix:` / `chore:`…），CI 会检查；合并方式固定为 **Squash and merge**。
`package.json` 与 `public/plugin.json` 的 `version` 由 Release PR 更新，不要手动改。

本地提交信息同样受约束：`pnpm install` 会通过 `prepare` 安装 husky 钩子，
`commit-msg` 用 commitlint 校验单条消息，`pre-push` 校验本次推送新增的提交，
规则见 `commitlint.config.js`。绕过钩子（`git commit --no-verify`）产生的提交会在 push 时被拦下；
确实需要绕过时用 `git push --no-verify`，并自行确认该提交不会进入 CHANGELOG。

## 版本日志

[Changelog](./CHANGELOG.md)

## 参考与感谢

- [BryceAndJuly](https://github.com/BryceAndJuly) 在社区中的[首次实现](https://ld246.com/article/1662969146166)
- [HowcanoeWang/calendar](https://github.com/HowcanoeWang/calendar) 对上一项目的反编译以及功能拓展
- [九炎](https://github.com/leolee9086) 大佬提供的 WebSocket 封装模板

## License

[License](./LICENSE)
