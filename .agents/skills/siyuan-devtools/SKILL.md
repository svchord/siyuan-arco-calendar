---
name: siyuan-devtools
description: 测量思源主题/插件的真实渲染（样式、令牌、对比度、交互态），并截图。当需要确认主题改动在思源里实际长什么样、某个选择器算出来的颜色/尺寸是多少、或要批量跑一组测量时使用。
---

# siyuan-devtools

在真实思源前端页面里读事实、驱动交互。浏览器会话由本工具管理，一次 `open` 之后所有命令复用同一个页面。

## 会话

```bash
siyuan-devtools open --frontend desktop     # 首次：起浏览器并打开页面
siyuan-devtools status                      # 查看会话（不创建）
siyuan-devtools close                       # 关闭
```

`open` 只调一次。**不要再 open 第二次**——它会杀掉旧 Chrome 起一个新的。

## 改完源码后

```
1. 改源码
2. 等 pnpm dev 输出 [vite-plugin-siyuan] build #N ready
3. siyuan-devtools reload
4. 重新建立交互场景（do hover / do menu ...）
5. 测量
```

`reload` 会整页刷新，之前的 hover、打开的菜单、滚动位置全部清空。

## 读数

```bash
siyuan-devtools read env
siyuan-devtools read tokens --brand-8 --rc-text-primary
siyuan-devtools read element .b3-menu__item --props color,background-color
siyuan-devtools read element .b3-menu__item --box --limit 3
siyuan-devtools read contrast --rc-text-primary --rc-bg-page
```

`read env` 返回页面状态，用它判断主题是否挂载（看 `themeStyle` 是否为 null）。

## 动作

```bash
siyuan-devtools do hover .b3-menu__item
siyuan-devtools do click .b3-menu
siyuan-devtools do click .b3-menu__item --button right
siyuan-devtools do fill .b3-text-field "hello"
siyuan-devtools do press Enter
siyuan-devtools do menu theme
siyuan-devtools do dock outline
siyuan-devtools do attr data-theme-mode=dark
siyuan-devtools do reset
```

加 `--diff color,background-color` 会在动作前后各读一次，省一轮往返；支持 `click` / `hover` / `dblclick` / `fill` / `drag` / `select`。动作后会等待过渡落定。

交互态跨命令保留：`do hover` 之后直接 `read element` 就能读到 hover 后的样式。

## 批量

计划文件一次跑完，比逐条命令省往返：

```json
{
  "frontend": "desktop",
  "steps": [
    { "do": "menu:theme" },
    { "read": "element", "selector": ".b3-menu__item", "props": ["color", "background-color"] },
    { "do": "hover:.b3-menu__item", "diff": { "selector": ".b3-menu__item", "props": ["color"] } },
    { "read": "contrast", "foreground": "--rc-text-primary", "background": "--rc-bg-page" }
  ]
}
```

```bash
siyuan-devtools audit plan.json
```

## 截图

```bash
siyuan-devtools shot --frontend both --theme dark --out shots
siyuan-devtools shot --density compact --out shots        # 明暗保持页面当前值
siyuan-devtools shot --theme dark --density compact       # 两个维度可组合
```

`--frontend mobile` 默认使用 390x844 视口；桌面端默认 1600x1000。

## 约定

- 加 `--json` 拿结构化输出（默认是人读文本）。
- 端口默认 6806，可用 `SIYUAN_PORT` 或 `--url` 覆盖。
- 退出码 0 = 成功，2 = 失败（错误信息在 stderr）。
- 不确定参数时用 `siyuan-devtools --help`。
