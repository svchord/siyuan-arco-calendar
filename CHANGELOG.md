# 版本日志 | Changelog 


## [2.2.1](https://github.com/svchord/siyuan-arco-calendar/compare/siyuan-arco-calendar-v2.2.0...siyuan-arco-calendar-v2.2.1) (2026-10-31)


### Bug Fixes

* **release:** restore package asset upload ([ce4cf99](https://github.com/svchord/siyuan-arco-calendar/commit/ce4cf992af891499b4dd02e467396dadeccf90e2))

## [2.2.0](https://github.com/svchord/siyuan-arco-calendar/compare/siyuan-arco-calendar-v2.1.0...siyuan-arco-calendar-v2.2.0) (2026-10-31)


### Features

* add yearly heatmap view and refine calendar controls ([77aee46](https://github.com/svchord/siyuan-arco-calendar/commit/77aee46fc8e3d150df191016762e39eec32f6261))

## [2.1.0](https://github.com/svchord/siyuan-arco-calendar/compare/siyuan-arco-calendar-v2.0.0...siyuan-arco-calendar-v2.1.0) (2026-10-31)


### Features

* rebuild calendar plugin with React, Base UI and native daily-note API ([4962243](https://github.com/svchord/siyuan-arco-calendar/commit/4962243d62a605dacfd43afdc51bedde68d21051))
* 使用websocket通信替代轮询 ([d0aba5a](https://github.com/svchord/siyuan-arco-calendar/commit/d0aba5a7753388dee37ba492bc7f7f1b64f87b9c))
* 初步完善子组件功能 ([7501c2b](https://github.com/svchord/siyuan-arco-calendar/commit/7501c2b23cab818a7f38412d339944b5e77c367b))
* 初步完善父组件状态数据 ([aa8d673](https://github.com/svchord/siyuan-arco-calendar/commit/aa8d67336f7306d5fa5e191a0772cd5c3c768d0c))
* 增加两种配置 ([9ac23d4](https://github.com/svchord/siyuan-arco-calendar/commit/9ac23d4a07e025fbb5b292b73540f9619167cbbf))
* 增加国际化功能 ([99bf14f](https://github.com/svchord/siyuan-arco-calendar/commit/99bf14f49ecf1a5157610ff3a0ebaf0fff7e86e2)), closes [#6](https://github.com/svchord/siyuan-arco-calendar/issues/6)
* 增加配置按钮入口位置的功能 ([859a654](https://github.com/svchord/siyuan-arco-calendar/commit/859a65487c0a483aa472cde0f2575cd2ff1a2609))
* 实现日记模板渲染 ([b79e2e6](https://github.com/svchord/siyuan-arco-calendar/commit/b79e2e68e2c31a61e4c6d315744ab421f948be93))
* 记忆面板 ([2b947c9](https://github.com/svchord/siyuan-arco-calendar/commit/2b947c96f269703e5282b747135dacd24bdda9dd))
* 适配插件系统 ([1f5bf31](https://github.com/svchord/siyuan-arco-calendar/commit/1f5bf3105a5ac8bf064f152dec578ffbbc9237b4))
* 重写底部今天按钮 ([c1a8538](https://github.com/svchord/siyuan-arco-calendar/commit/c1a8538082917ab7bc27360ba5e2a3cf183e64ac))
* 面板位置改为dock栏 ([84389b5](https://github.com/svchord/siyuan-arco-calendar/commit/84389b5812ad106e26b7db5cf8d8ccd0d3d3c430))


### Bug Fixes

* [#14](https://github.com/svchord/siyuan-arco-calendar/issues/14) 修复不兼容docker部署的思源的问题 ([11c6c8c](https://github.com/svchord/siyuan-arco-calendar/commit/11c6c8c133c7c3f17afbf709a5eae370b1e2d869))
* #[#14](https://github.com/svchord/siyuan-arco-calendar/issues/14) 修复不兼容docker部署的思源的问题 ([86db221](https://github.com/svchord/siyuan-arco-calendar/commit/86db2218633bb18f0286a5f9ad538b6690b6edd9))
* keep notebook dropdown above calendar panel ([13ac07c](https://github.com/svchord/siyuan-arco-calendar/commit/13ac07cf86161ee169adf666b888dbdcfbcfbe33))
* restore calendar panel rendering on current SiYuan ([0bf380d](https://github.com/svchord/siyuan-arco-calendar/commit/0bf380dfa6b1ddc0a529b488f7a82f461208c9ac))
* Style inject ([291b404](https://github.com/svchord/siyuan-arco-calendar/commit/291b4049c3453a40049b1f649b90582c1b1703f1))
* Style inject ([a0f70d1](https://github.com/svchord/siyuan-arco-calendar/commit/a0f70d1204491ef54683383e1d6e364e8cbbbc95))
* 优化图标 ([fc8556d](https://github.com/svchord/siyuan-arco-calendar/commit/fc8556d3c6580d78102b16646ba326a549881eec))
* 优化日历 cell 样式 ([e897ad2](https://github.com/svchord/siyuan-arco-calendar/commit/e897ad2152fc80a472fff9d40ac8d17218fa866a))
* 优化获取已存在日记的方法 ([be6c959](https://github.com/svchord/siyuan-arco-calendar/commit/be6c959e7ef3d0ba8825ac94be1304a869c38f68))
* 优化颜色变量以及删除文档时的响应逻辑 ([0fd08f9](https://github.com/svchord/siyuan-arco-calendar/commit/0fd08f9efde5262d2bb94dd41429c4ef5fee2bdc))
* 修复mac无法创建日记的问题 ([886c872](https://github.com/svchord/siyuan-arco-calendar/commit/886c872aa1d167d86be349d449a1e10fe5c95992))
* 修复最后几个已存在日记日期无法正常显示的问题 ([ad0bf6f](https://github.com/svchord/siyuan-arco-calendar/commit/ad0bf6f92fc390f683601f377132818378e542c5))
* 修复删除单篇日记的显示错误 ([ca3f516](https://github.com/svchord/siyuan-arco-calendar/commit/ca3f516be660dc2db3be31086d8032d56618e8a8))
* 修复删除文档后不正确更新标记的问题 ([e375eff](https://github.com/svchord/siyuan-arco-calendar/commit/e375effff3a633df4cd47b1189944e5c5a2d5152))
* 修复国际化文本 ([06ce7a0](https://github.com/svchord/siyuan-arco-calendar/commit/06ce7a05ac0f8927007fe6a8697308cb7570bfa0)), closes [#30](https://github.com/svchord/siyuan-arco-calendar/issues/30)
* 修复已存在日记的日期错误清空的问题 ([8c2cbf4](https://github.com/svchord/siyuan-arco-calendar/commit/8c2cbf4ae71506c1b8ff3612480fcaf134be1a63))
* 修复搜索限额的问题 ([2682b67](https://github.com/svchord/siyuan-arco-calendar/commit/2682b67941257551b1f4524fe39177a21a62af8f))
* 修复数据库更新不及时的问题 ([ecfbb24](https://github.com/svchord/siyuan-arco-calendar/commit/ecfbb2410235bea620a20ee167d6fedd60939fe8))
* 修复模板文件渲染顺序的问题 ([9953169](https://github.com/svchord/siyuan-arco-calendar/commit/9953169178e1b88cc89b4f17fa8533cf458ef88e))
* 修复模板路径报错的问题 ([83974f0](https://github.com/svchord/siyuan-arco-calendar/commit/83974f072bbfb64cbe4be899870b46271858269f))
* 修复点击创建后无法更新已存在日记的问题 ([53eaac3](https://github.com/svchord/siyuan-arco-calendar/commit/53eaac3424a4ce2e56e1d66c9ccd0fd27d48ad6e))
* 修复点击高亮日期失效的问题 ([e57b1a7](https://github.com/svchord/siyuan-arco-calendar/commit/e57b1a7a045fe20ebb6d901544fd1d65dd67aeb5)), closes [#29](https://github.com/svchord/siyuan-arco-calendar/issues/29)
* 修复版本号不自动更新的问题 ([dfab8ea](https://github.com/svchord/siyuan-arco-calendar/commit/dfab8ea94c6b069fa8053ee4678145a8427f15da))
* 修复笔记本未及时更新的问题 ([aa081e5](https://github.com/svchord/siyuan-arco-calendar/commit/aa081e53f39d482bd277ccedf58d3c57fa557ec7))
* 修复集市不能正常显示预览图的问题 ([30634cb](https://github.com/svchord/siyuan-arco-calendar/commit/30634cb2f2460a64c05b251415fe5036897d5ed9))
* 兼容使用插件系统国际化 ([0077cc2](https://github.com/svchord/siyuan-arco-calendar/commit/0077cc203293ada780cad550d2aa58eca8205b4e))
* 兼容思源css变量 ([868049a](https://github.com/svchord/siyuan-arco-calendar/commit/868049a28823d28b751ce07e54af1f5256a986aa))
* 兼容思源v2.8.10新的api ([f0d1ebb](https://github.com/svchord/siyuan-arco-calendar/commit/f0d1ebba5757bfb48ed34b99f126d95824d98592))
* 完善按钮选择器和卸载钩子 ([dc37be8](https://github.com/svchord/siyuan-arco-calendar/commit/dc37be8bd1f83bd546b9694a7ad2f09bdac064e4))
* 快捷键创建日记和删除文档时更新当前月份面板 ([a9a9beb](https://github.com/svchord/siyuan-arco-calendar/commit/a9a9beb7bc76c0c9abb9aa7b26d1c72b90a68fa6))
* 暂时修复样式污染问题 ([44c3d78](https://github.com/svchord/siyuan-arco-calendar/commit/44c3d782b87c8f05f0ef12fa230689814ff9f84d)), closes [#2](https://github.com/svchord/siyuan-arco-calendar/issues/2)
* 更换plugin.json的位置 ([4869cd5](https://github.com/svchord/siyuan-arco-calendar/commit/4869cd58e284a297b09458756b8768c062d1ab8b))
* 重构创建日记功能 ([c71c97f](https://github.com/svchord/siyuan-arco-calendar/commit/c71c97f31ba194f4cdb06f5514400907f3e06755))
* 重构获取已存在日记的功能逻辑 ([af229d7](https://github.com/svchord/siyuan-arco-calendar/commit/af229d780bb23e971825b30a85289782f52124ce))


### Performance Improvements

* 优化请求逻辑和时期，提升展示性能 ([3c61b07](https://github.com/svchord/siyuan-arco-calendar/commit/3c61b0775501791de4d436eba52fb90d01ff2c05))
* 优化面板选中更新时创建日记逻辑 ([1cf28ed](https://github.com/svchord/siyuan-arco-calendar/commit/1cf28ed3bb94f92c668d2275c245897eb44056eb))

## [2.0.0](https://github.com/svchord/siyuan-arco-calendar/compare/v1.5.0...v2.0.0) (2026-10-30)

### 重构 | Code Refactoring

* 全面移除 Vue 与 Arco Design，使用 React 19 + shadcn/ui + Tailwind CSS 4 重写全部界面
* 采用 shadcn/ui **Vega** 预设风格（中性色、Inter 字体、Vega 组件圆角与间距），不再沿用旧 Arco 视觉
* 重新设计面板布局：Card + Separator + 图标标题栏 + 笔记本选择器 + 底部日期状态与“今天”主按钮
* 重组插件架构：宿主上下文、类型化 API 层、hooks、纯函数工具与 shadcn 组件目录
* 使用 `createRoot` / `root.unmount()` 管理顶栏弹层、Dock 与设置项，补全生命周期清理
* 更新全部依赖至最新版本，迁移至 Vite 8、TypeScript 7、ESLint/oxlint 新工具链
* 完善跨平台开发流程：`make-link` / `make-install` 全部使用 Node.js，不再依赖 PowerShell
* 性能优化：Inter 字体仅保留 Latin/Latin-Ext 子集，locale 配置只请求一次并缓存
* 修复日期 key 不一致导致的重复创建问题，并补充回归测试；新增插件专属顶栏图标与居中月份导航
* 修复宿主全局 `svg { fill: currentColor }` 覆盖 lucide 图标的问题，面板内日历图标正常显示
* 整理数据获取时序：缓存系统配置与语言、增加笔记本请求乱序保护、共享主题监听、减少重复请求
* 整理项目结构：拆分纯日记工具文件、移除未使用的 Tabs 组件、补充数据流文档
* 移除 commitizen / standard-version 等旧流程依赖，改用 release-please 与 GitHub Release workflow
* 新增日历 / 年度热力图切换；热力图统计全部笔记内容块：日记按日记日期，其他笔记按内容块创建日期，按上下半年分两段展示
* 刷新操作增加成功/失败提示，并正确传播笔记本与日记刷新结果
* 顶部月份/年份改为下拉选择，月份切换按钮移除；刷新入口移到年份选择器右侧
* 创建日记改用内核 `createDailyNote` API（支持任意 `date`），由内核处理父目录、模板、图标和属性，彻底移除手写嵌套创建逻辑
* 设置入口移到日历面板右上角，支持每周起始日（周一/周日）和 ISO 周数显示，并重新整理设置项布局
* 周数改用 shadcn 默认样式并修正垂直居中；底部增加带文字的刷新按钮
* 已有日记改为柔和圆底标记，空缺日期保持空白；未完成任务显示琥珀色角标并可在设置中关闭
* 顶部和底部分隔线统一为同一个 `PanelDivider` 组件
* 修复日记父目录重复创建问题：不再手动创建父路径，改由内核每日笔记 API 幂等处理
* `components/ui` 恢复为 shadcn `base-vega` 分发版本，插件特有行为移至业务组件与原语组合
* 同步现代思源插件清单：BCP 47 语言文件、`displayName.default`、`minAppVersion` 3.8.5
* 修复日记模板属性写入未等待、SQL 字符串转义、跨月日历标记等问题

### [1.5.0](https://github.com/svchord/siyuan-arco-calendar/compare/v1.4.5...v1.5.0) (2024-04-12)


### 新增功能 | Features

* 重写底部今天按钮 ([c1a8538](https://github.com/svchord/siyuan-arco-calendar/commit/c1a8538082917ab7bc27360ba5e2a3cf183e64ac))

### [1.4.5](https://github.com/svchord/siyuan-arco-calendar/compare/v1.4.4...v1.4.5) (2024-04-02)


### 修复缺陷 | Bug Fixes

* 修复版本号不自动更新的问题 ([dfab8ea](https://github.com/svchord/siyuan-arco-calendar/commit/dfab8ea94c6b069fa8053ee4678145a8427f15da))

### [1.4.4](https://github.com/svchord/siyuan-arco-calendar/compare/v1.4.3...v1.4.4) (2024-04-02)


### 修复缺陷 | Bug Fixes

* 修复点击高亮日期失效的问题 ([e57b1a7](https://github.com/svchord/siyuan-arco-calendar/commit/e57b1a7a045fe20ebb6d901544fd1d65dd67aeb5)), closes [#29](https://github.com/svchord/siyuan-arco-calendar/issues/29)
* 修复国际化文本 ([06ce7a0](https://github.com/svchord/siyuan-arco-calendar/commit/06ce7a05ac0f8927007fe6a8697308cb7570bfa0)), closes [#30](https://github.com/svchord/siyuan-arco-calendar/issues/30)

### [1.4.3](https://github.com/svchord/siyuan-arco-calendar/compare/v1.4.2...v1.4.3) (2024-01-23)


### 修复缺陷 | Bug Fixes

* 修复集市不能正常显示预览图的问题 ([30634cb](https://github.com/svchord/siyuan-arco-calendar/commit/30634cb2f2460a64c05b251415fe5036897d5ed9))

### [1.4.2](https://github.com/svchord/siyuan-arco-calendar/compare/v1.4.1...v1.4.2) (2024-01-23)


### 修复缺陷 | Bug Fixes

* 更换plugin.json的位置 ([4869cd5](https://github.com/svchord/siyuan-arco-calendar/commit/4869cd58e284a297b09458756b8768c062d1ab8b))

### [1.4.1](https://github.com/svchord/siyuan-arco-calendar/compare/v1.4.0...v1.4.1) (2024-01-23)


### 构建相关 | Build System

* 更新配置文件 ([0df5efd](https://github.com/svchord/siyuan-arco-calendar/commit/0df5efdb4eb34fdb3b879726b02bde6b5f48ed6b))
* 更新依赖 ([f63145b](https://github.com/svchord/siyuan-arco-calendar/commit/f63145bf4ab24e5cb6961fba347066a2d8fde115))

## [1.4.0](https://github.com/svchord/siyuan-arco-calendar/compare/v1.3.0...v1.4.0) (2024-01-21)


### 代码重构 | Code Refactoring

* 更换api目录 ([e14586e](https://github.com/svchord/siyuan-arco-calendar/commit/e14586e0f6e9a6151739e6c4c6b3e80b98f1ed4b))
* 使用面向对象重构代码 ([bb98e08](https://github.com/svchord/siyuan-arco-calendar/commit/bb98e085d31f7e85abb44ddb81094958821cf24d))
* 使用dayjs重构 ([27df65f](https://github.com/svchord/siyuan-arco-calendar/commit/27df65f78839cd895f43ecf5b0581560ef231e8c))


### 构建相关 | Build System

* 更新依赖 ([798da82](https://github.com/svchord/siyuan-arco-calendar/commit/798da8224612cc424293675c5b22dc09fe29e0a5))
* 优化构建配置 ([ee2dac4](https://github.com/svchord/siyuan-arco-calendar/commit/ee2dac4f36df610352a93ff7389a858459837eb6))
* 增加自动引入插件 ([a76d949](https://github.com/svchord/siyuan-arco-calendar/commit/a76d949bd291948502a3c9469b1f02e594d6bec8))


### 修复缺陷 | Bug Fixes

* 修复数据库更新不及时的问题 ([ecfbb24](https://github.com/svchord/siyuan-arco-calendar/commit/ecfbb2410235bea620a20ee167d6fedd60939fe8))
* 修复已存在日记的日期错误清空的问题 ([8c2cbf4](https://github.com/svchord/siyuan-arco-calendar/commit/8c2cbf4ae71506c1b8ff3612480fcaf134be1a63))


### 新增功能 | Features

* 增加两种配置 ([9ac23d4](https://github.com/svchord/siyuan-arco-calendar/commit/9ac23d4a07e025fbb5b292b73540f9619167cbbf))
* 增加配置按钮入口位置的功能 ([859a654](https://github.com/svchord/siyuan-arco-calendar/commit/859a65487c0a483aa472cde0f2575cd2ff1a2609))

## [1.3.0](https://github.com/svchord/siyuan-arco-calendar/compare/v1.2.1...v1.3.0) (2024-01-11)


### 构建相关 | Build System

* 更新依赖 ([6a26e69](https://github.com/svchord/siyuan-arco-calendar/commit/6a26e69ae43e299e2c468682fa3c661e71a5e3e9))


### 代码重构 | Code Refactoring

* 修改国际化位置 ([5c91d47](https://github.com/svchord/siyuan-arco-calendar/commit/5c91d47b9ce67e8af1dd3958a2df05fa767972e3))


### 新增功能 | Features

* 面板位置改为dock栏 ([84389b5](https://github.com/svchord/siyuan-arco-calendar/commit/84389b5812ad106e26b7db5cf8d8ccd0d3d3c430))


### 修复缺陷 | Bug Fixes

* 快捷键创建日记和删除文档时更新当前月份面板 ([a9a9beb](https://github.com/svchord/siyuan-arco-calendar/commit/a9a9beb7bc76c0c9abb9aa7b26d1c72b90a68fa6))
* 修复笔记本未及时更新的问题 ([aa081e5](https://github.com/svchord/siyuan-arco-calendar/commit/aa081e53f39d482bd277ccedf58d3c57fa557ec7))
* 修复模板文件渲染顺序的问题 ([9953169](https://github.com/svchord/siyuan-arco-calendar/commit/9953169178e1b88cc89b4f17fa8533cf458ef88e))


### 文档更新 | Documentation

* 修改插件名和描述 ([10f990d](https://github.com/svchord/siyuan-arco-calendar/commit/10f990d0f9ebc6ee3a1b68905d45406bf4649f90))

### [1.2.1](https://github.com/svchord/siyuan-arco-calendar/compare/v1.2.0...v1.2.1) (2024-01-10)


### 修复缺陷 | Bug Fixes

* 修复模板路径报错的问题 ([83974f0](https://github.com/svchord/siyuan-arco-calendar/commit/83974f072bbfb64cbe4be899870b46271858269f))
* 修复删除文档后不正确更新标记的问题 ([e375eff](https://github.com/svchord/siyuan-arco-calendar/commit/e375effff3a633df4cd47b1189944e5c5a2d5152))

## [1.2.0](https://github.com/svchord/siyuan-arco-calendar/compare/v1.1.3...v1.2.0) (2024-01-10)


### 代码格式 | Styles

* 修改引入格式 ([55052cd](https://github.com/svchord/siyuan-arco-calendar/commit/55052cd76141c270823ac5725074924f595163c9))


### 代码重构 | Code Refactoring

* 使用思源内置常量 ([bbe8c74](https://github.com/svchord/siyuan-arco-calendar/commit/bbe8c74692742a03baa8bc787fc8d423898d749b))
* 修改国际化引入方式 ([c2edadf](https://github.com/svchord/siyuan-arco-calendar/commit/c2edadf1640a6641da8977c4c3e545a311660260))
* 修改样式位置 ([d0ca93d](https://github.com/svchord/siyuan-arco-calendar/commit/d0ca93da133dfbd2f09acfc4f77687555b435a9f))


### 新增功能 | Features

* 记忆面板 ([2b947c9](https://github.com/svchord/siyuan-arco-calendar/commit/2b947c96f269703e5282b747135dacd24bdda9dd))


### 修复缺陷 | Bug Fixes

* 修复mac无法创建日记的问题 ([886c872](https://github.com/svchord/siyuan-arco-calendar/commit/886c872aa1d167d86be349d449a1e10fe5c95992)), closes [#20](https://github.com/svchord/siyuan-arco-calendar/issues/20) [#27](https://github.com/svchord/siyuan-arco-calendar/issues/27)

### [1.1.3](https://github.com/svchord/siyuan-arco-calendar/compare/v1.1.2...v1.1.3) (2023-12-24)


### 构建相关 | Build System

* 修改构建配置 ([f30565e](https://github.com/svchord/siyuan-arco-calendar/commit/f30565eb6b2ec73436c573b42406b0d3be99475e))

### [1.1.2](https://github.com/svchord/siyuan-arco-calendar/compare/v1.1.1...v1.1.2) (2023-12-23)


### 构建相关 | Build System

* 更新依赖 ([ee7f32d](https://github.com/svchord/siyuan-arco-calendar/commit/ee7f32de0f6094d2b8219a22d4018c6088dd0451))

### [1.1.1](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.12...v1.1.1) (2023-12-23)

### [1.0.12](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.11...v1.0.12) (2023-12-16)

### [1.0.11](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.10...v1.0.11) (2023-10-23)


### 修复缺陷 | Bug Fixes

* #[#14](https://github.com/svchord/siyuan-arco-calendar/issues/14) 修复不兼容docker部署的思源的问题 ([86db221](https://github.com/svchord/siyuan-arco-calendar/commit/86db2218633bb18f0286a5f9ad538b6690b6edd9))

### [1.0.10](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.9...v1.0.10) (2023-08-23)


### 性能提升 | Performance Improvements

* 优化请求逻辑和时期，提升展示性能 ([3c61b07](https://github.com/svchord/siyuan-arco-calendar/commit/3c61b0775501791de4d436eba52fb90d01ff2c05))

### [1.0.9](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.8...v1.0.9) (2023-08-20)


### 构建相关 | Build System

* 更新依赖 ([f86ba67](https://github.com/svchord/siyuan-arco-calendar/commit/f86ba67230e69f57c62409000fe37204232fc9f4))


### 修复缺陷 | Bug Fixes

* 修复最后几个已存在日记日期无法正常显示的问题 ([ad0bf6f](https://github.com/svchord/siyuan-arco-calendar/commit/ad0bf6f92fc390f683601f377132818378e542c5))

### [1.0.8](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.7...v1.0.8) (2023-08-20)


### 修复缺陷 | Bug Fixes

* 修复点击创建后无法更新已存在日记的问题 ([53eaac3](https://github.com/svchord/siyuan-arco-calendar/commit/53eaac3424a4ce2e56e1d66c9ccd0fd27d48ad6e))

### [1.0.7](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.6...v1.0.7) (2023-08-20)


### 构建相关 | Build System

* 更新依赖 ([19d9d35](https://github.com/svchord/siyuan-arco-calendar/commit/19d9d354fedbb1760affc782eb3e8eb982914233))


### 修复缺陷 | Bug Fixes

* 兼容使用插件系统国际化 ([0077cc2](https://github.com/svchord/siyuan-arco-calendar/commit/0077cc203293ada780cad550d2aa58eca8205b4e))
* 重构创建日记功能 ([c71c97f](https://github.com/svchord/siyuan-arco-calendar/commit/c71c97f31ba194f4cdb06f5514400907f3e06755))
* 重构获取已存在日记的功能逻辑 ([af229d7](https://github.com/svchord/siyuan-arco-calendar/commit/af229d780bb23e971825b30a85289782f52124ce))


### 性能提升 | Performance Improvements

* 优化面板选中更新时创建日记逻辑 ([1cf28ed](https://github.com/svchord/siyuan-arco-calendar/commit/1cf28ed3bb94f92c668d2275c245897eb44056eb))

### [1.0.6](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.5...v1.0.6) (2023-06-18)


### 代码格式 | Styles

* 更换代码风格并格式化 ([62fec3d](https://github.com/svchord/siyuan-arco-calendar/commit/62fec3d4e64905e326864190d46e2d35fc962a6a))


### 构建相关 | Build System

* 更新依赖 ([49de412](https://github.com/svchord/siyuan-arco-calendar/commit/49de4129940f0b4b0347cbc376ff69a8384ac14a))
* 更新依赖 ([05be89b](https://github.com/svchord/siyuan-arco-calendar/commit/05be89bf5f9e729155b0a99f860b0d9989d8bc05))


### 文档更新 | Documentation

* 适配插件说明 ([347b590](https://github.com/svchord/siyuan-arco-calendar/commit/347b590045e880a72ed2ee7569b838166155ffe2))


### 修复缺陷 | Bug Fixes

* 修复搜索限额的问题 ([2682b67](https://github.com/svchord/siyuan-arco-calendar/commit/2682b67941257551b1f4524fe39177a21a62af8f))

### [1.0.5](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.4...v1.0.5) (2023-05-31)


### 构建相关 | Build System

* 更新依赖 ([add6281](https://github.com/svchord/siyuan-arco-calendar/commit/add6281bc0f5aa1c39feeb4ab4cc908a26687788))


### 修复缺陷 | Bug Fixes

* 兼容思源v2.8.10新的api ([f0d1ebb](https://github.com/svchord/siyuan-arco-calendar/commit/f0d1ebba5757bfb48ed34b99f126d95824d98592))


### 文档更新 | Documentation

* 修改plugin.json，新增思源v2.8.10插件集市所需配置项 ([3aac1bd](https://github.com/svchord/siyuan-arco-calendar/commit/3aac1bdf71f7f47764ace52756efbc32954499cf))

### [1.0.4](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.3...v1.0.4) (2023-05-27)


### 文档更新 | Documentation

* 更新plugin.json ([2ebddad](https://github.com/svchord/siyuan-arco-calendar/commit/2ebddadceada0e7ec02ee4b4ddf91e7f6977a316))

### [1.0.3](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.2...v1.0.3) (2023-05-27)

### [1.0.2](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.1...v1.0.2) (2023-05-27)


### 文档更新 | Documentation

* 更新plugin.json ([d259c40](https://github.com/svchord/siyuan-arco-calendar/commit/d259c40888085968ec680ccf6acd6e547457f616))

### [1.0.1](https://github.com/svchord/siyuan-arco-calendar/compare/v1.0.0...v1.0.1) (2023-05-27)

### [0.0.7](https://github.com/svchord/siyuan-arco-calendar/compare/v0.0.6...v0.0.7) (2023-03-27)


### 新增功能 | Features

* 增加国际化功能 ([99bf14f](https://github.com/svchord/siyuan-arco-calendar/commit/99bf14f49ecf1a5157610ff3a0ebaf0fff7e86e2)), closes [#6](https://github.com/svchord/siyuan-arco-calendar/issues/6)

### [0.0.6](https://github.com/svchord/siyuan-arco-calendar/compare/v0.0.5...v0.0.6) (2023-03-21)


### 修复缺陷 | Bug Fixes

* 优化图标 ([fc8556d](https://github.com/svchord/siyuan-arco-calendar/commit/fc8556d3c6580d78102b16646ba326a549881eec))
* 暂时修复样式污染问题 ([44c3d78](https://github.com/svchord/siyuan-arco-calendar/commit/44c3d782b87c8f05f0ef12fa230689814ff9f84d)), closes [#2](https://github.com/svchord/siyuan-arco-calendar/issues/2)
* Style inject ([a0f70d1](https://github.com/svchord/siyuan-arco-calendar/commit/a0f70d1204491ef54683383e1d6e364e8cbbbc95))

### [0.0.5](https://github.com/svchord/siyuan-arco-calendar/compare/v0.0.3...v0.0.5) (2023-03-16)


### 代码重构 | Code Refactoring

* 使用 TypeScript 重构项目 ([6a10010](https://github.com/svchord/siyuan-arco-calendar/commit/6a10010231848236adb7472367a3823cc41e6d50))


### 新增功能 | Features

* 适配插件系统 ([1f5bf31](https://github.com/svchord/siyuan-arco-calendar/commit/1f5bf3105a5ac8bf064f152dec578ffbbc9237b4))


### 修复缺陷 | Bug Fixes

* 兼容思源css变量 ([868049a](https://github.com/svchord/siyuan-arco-calendar/commit/868049a28823d28b751ce07e54af1f5256a986aa))
* 完善按钮选择器和卸载钩子 ([dc37be8](https://github.com/svchord/siyuan-arco-calendar/commit/dc37be8bd1f83bd546b9694a7ad2f09bdac064e4))

### [0.0.4](https://github.com/svchord/siyuan-arco-calendar/compare/v0.0.3...v0.0.4) (2023-03-14)


### 代码重构 | Code Refactoring

* 使用 TypeScript 重构项目 ([6a10010](https://github.com/svchord/siyuan-arco-calendar/commit/6a10010231848236adb7472367a3823cc41e6d50))


### 新增功能 | Features

* 适配插件系统 ([1f5bf31](https://github.com/svchord/siyuan-arco-calendar/commit/1f5bf3105a5ac8bf064f152dec578ffbbc9237b4))


### 修复缺陷 | Bug Fixes

* 兼容思源css变量 ([868049a](https://github.com/svchord/siyuan-arco-calendar/commit/868049a28823d28b751ce07e54af1f5256a986aa))

### 0.0.3 (2023-03-04)


### 新增功能 | Features

* 初步完善父组件状态数据 ([aa8d673](https://github.com/svchord/siyuan-arco-calendar/commit/aa8d67336f7306d5fa5e191a0772cd5c3c768d0c))
* 初步完善子组件功能 ([7501c2b](https://github.com/svchord/siyuan-arco-calendar/commit/7501c2b23cab818a7f38412d339944b5e77c367b))
* 实现日记模板渲染 ([b79e2e6](https://github.com/svchord/siyuan-arco-calendar/commit/b79e2e68e2c31a61e4c6d315744ab421f948be93))
* 使用websocket通信替代轮询 ([d0aba5a](https://github.com/svchord/siyuan-arco-calendar/commit/d0aba5a7753388dee37ba492bc7f7f1b64f87b9c))


### 文档更新 | Documentation

* 更新 Readme ([ba55115](https://github.com/svchord/siyuan-arco-calendar/commit/ba55115f69ff30cbbe0710bf32f8257f274f9958))


### 代码重构 | Code Refactoring

* 使用 vue3 的set up 写法重构 ([3a1d5ed](https://github.com/svchord/siyuan-arco-calendar/commit/3a1d5ed871708eece68d0f68b0ab95e6148a3d4b))


### 修复缺陷 | Bug Fixes

* 修复删除单篇日记的显示错误 ([ca3f516](https://github.com/svchord/siyuan-arco-calendar/commit/ca3f516be660dc2db3be31086d8032d56618e8a8))
* 优化获取已存在日记的方法 ([be6c959](https://github.com/svchord/siyuan-arco-calendar/commit/be6c959e7ef3d0ba8825ac94be1304a869c38f68))
* 优化日历 cell 样式 ([e897ad2](https://github.com/svchord/siyuan-arco-calendar/commit/e897ad2152fc80a472fff9d40ac8d17218fa866a))
* 优化颜色变量以及删除文档时的响应逻辑 ([0fd08f9](https://github.com/svchord/siyuan-arco-calendar/commit/0fd08f9efde5262d2bb94dd41429c4ef5fee2bdc))

### 0.0.2 (2023-02-26)


### 新增功能 | Features

* 初步完善父组件状态数据 ([aa8d673](https://github.com/svchord/siyuan-arco-calendar/commit/aa8d67336f7306d5fa5e191a0772cd5c3c768d0c))
* 初步完善子组件功能 ([7501c2b](https://github.com/svchord/siyuan-arco-calendar/commit/7501c2b23cab818a7f38412d339944b5e77c367b))
* 实现日记模板渲染 ([b79e2e6](https://github.com/svchord/siyuan-arco-calendar/commit/b79e2e68e2c31a61e4c6d315744ab421f948be93))
* 使用websocket通信替代轮询 ([d0aba5a](https://github.com/svchord/siyuan-arco-calendar/commit/d0aba5a7753388dee37ba492bc7f7f1b64f87b9c))


### 文档更新 | Documentation

* 更新 Readme ([ba55115](https://github.com/svchord/siyuan-arco-calendar/commit/ba55115f69ff30cbbe0710bf32f8257f274f9958))


### 代码重构 | Code Refactoring

* 使用 vue3 的set up 写法重构 ([3a1d5ed](https://github.com/svchord/siyuan-arco-calendar/commit/3a1d5ed871708eece68d0f68b0ab95e6148a3d4b))


### 修复缺陷 | Bug Fixes

* 修复删除单篇日记的显示错误 ([ca3f516](https://github.com/svchord/siyuan-arco-calendar/commit/ca3f516be660dc2db3be31086d8032d56618e8a8))

### 0.0.1 (2023-02-13)


### 新增功能 | Features

* 初步完善父组件状态数据 ([aa8d673](https://github.com/svchord/siyuan-arco-calendar/commit/aa8d67336f7306d5fa5e191a0772cd5c3c768d0c))
* 初步完善子组件功能 ([7501c2b](https://github.com/svchord/siyuan-arco-calendar/commit/7501c2b23cab818a7f38412d339944b5e77c367b))
* 实现日记模板渲染 ([b79e2e6](https://github.com/svchord/siyuan-arco-calendar/commit/b79e2e68e2c31a61e4c6d315744ab421f948be93))
* 使用websocket通信替代轮询 ([d0aba5a](https://github.com/svchord/siyuan-arco-calendar/commit/d0aba5a7753388dee37ba492bc7f7f1b64f87b9c))


### 文档更新 | Documentation

* 更新 Readme ([ba55115](https://github.com/svchord/siyuan-arco-calendar/commit/ba55115f69ff30cbbe0710bf32f8257f274f9958))
