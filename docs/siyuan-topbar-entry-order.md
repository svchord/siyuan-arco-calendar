# SiYuan 顶栏插件入口位置/顺序问题（宿主代码分析）

## 结论

这不是插件设置没有保存，也不是 `addTopBar({ position })` 完全没有生效，而是：

> `Plugin.addTopBar()` 更新 `data-location` 后，宿主马上用
> `entryVisibility.orders.topBar` 重新排列所有顶栏入口。

插件设置切换时只改了 `data-location`，没有改 `orders.topBar`，所以下一次
`applyTopBarEntryVisibility()` 会把入口放回旧位置。

重装 SiYuan 不会解决这个问题，因为问题在宿主当前的顶栏排序实现里。

## 宿主真实调用链

以下行为来自当前 SiYuan 前端 bundle。

### 1. `Plugin.addTopBar()`

简化后的逻辑：

```ts
// Plugin.addTopBar(options)
element.setAttribute('data-location', options.position ?? 'right');

if (
  !document.contains(element) ||
  (options.element && element.parentElement !== toolbar) ||
  oldLocation !== element.getAttribute('data-location')
) {
  document.querySelector(element.getAttribute('data-location') === 'right' ? '#barPlugins' : '#drag')?.before(element);
}

if (!isMobile()) {
  applyTopBarEntryVisibility(); // bundle 中对应 pS()
  // 以及 bL()、bv(true) 等其他刷新
}
```

这一步确实会把元素临时插入到目标侧：

- `right` → `#barPlugins` 前；
- `left` → `#drag` 前。

但这不是最终布局。

### 2. `applyTopBarEntryVisibility()`（bundle 中为 `pS`）

当前 bundle 中的核心逻辑：

```ts
const toolbar = document.getElementById('toolbar');
const barMore = document.getElementById('barMore');
const drag = document.getElementById('drag');
if (!toolbar || !barMore || !drag) return;

const elements = Array.from(toolbar.querySelectorAll(':scope > [data-topbar-entry]'));
const byKey = new Map(elements.map((element) => [element.dataset.topbarEntry, element]));

getTopBarOrder().forEach((key) => {
  const element = key === 'drag' ? drag : byKey.get(key);
  if (element) {
    barMore.before(element);
  }
});
```

关键点：

- 它按 `getTopBarOrder()` 返回的顺序，把每个入口依次 `barMore.before(...)`；
- `drag` 是顺序数组中的左右分隔标记；
- `data-location="right"` 并不会绕过这个排序；
- 如果插件 entry 仍排在 `drag` 前面，最终 DOM 就会被放回左侧。

### 3. `getTopBarOrder()`

顶栏顺序由当前激活 profile 的：

```json
{
  "appearance": {
    "entryVisibility": {
      "profiles": [
        {
          "orders": {
            "topBar": ["...", "drag", "..."]
          }
        }
      ]
    }
  }
}
```

决定。

对于插件入口，key 形如：

```text
plugin:arco-calendar:arco-calendar-topbar
```

`topBar` 中：

```text
drag 之前 → 左侧
drag 之后 → 右侧
```

### 4. 顺序是谁写入的

当前顺序由宿主的 entry visibility / 拖拽逻辑通过内部函数写入（bundle 中
对应 `N()`），而不是由 `Plugin.addTopBar()` 写入。

所以存在一个断点：

```text
插件设置 changed
  → addTopBar({ position: "right" })
  → data-location = right
  → DOM 临时插到右侧
  → applyTopBarEntryVisibility()
  → 按旧的 orders.topBar 排回左侧
```

## 为什么以前的实现“看起来能用”

最早版本在设置确认后执行：

```ts
await this.saveData(...);
window.location.reload();
```

旧版宿主没有用当前这套 order 逻辑重新排序，所以 reload 后图标位置正确。

后来 React 重写把它改成了实时切换：

```ts
disposeEntry();
mountEntry();
```

宿主这时已经由 `orders.topBar` 主导布局，reload 也无法重建这个顺序，因此
问题暴露出来。

## 宿主端修复方案

目标：`addTopBar({ position })` 真正成为入口位置的唯一来源，并且只移动
当前插件的 entry。

### 推荐修改位置

在 `Plugin.addTopBar()` 里，更新 `data-location` 之后、调用
`applyTopBarEntryVisibility()` 之前，增加一次入口顺序校正：

```ts
// Plugin.addTopBar()
element.setAttribute('data-location', position ?? 'right');

if (!isMobile() && position) {
  moveTopBarEntryToSide(element.dataset.topbarEntry, position);
}

if (!isMobile()) {
  applyTopBarEntryVisibility();
}
```

### `moveTopBarEntryToSide`

实现复用宿主已有的 entry 顺序读取/保存能力，不要直接改 DOM：

```ts
function moveTopBarEntryToSide(entryKey: string, side: 'left' | 'right') {
  const profile = getActiveEntryProfile();
  const order = getTopBarOrder(); // 已包含 "drag"
  const dragIndex = order.indexOf('drag');
  const entryIndex = order.indexOf(entryKey);

  if (!profile || dragIndex === -1 || entryIndex === -1) return;

  const currentlyRight = entryIndex > dragIndex;
  const targetRight = side === 'right';
  if (currentlyRight === targetRight) return;

  const nextOrder = order.filter((key) => key !== entryKey);
  const nextDragIndex = nextOrder.indexOf('drag');
  if (nextDragIndex === -1) return;

  nextOrder.splice(targetRight ? nextDragIndex + 1 : nextDragIndex, 0, entryKey);

  setEntryOrderValue(TOP_BAR_ROOT_PATH, nextOrder);
}
```

要点：

1. **只移动当前插件 key**，其他插件顺序不变；
2. 已经在目标侧时直接返回，保持同侧原有位置；
3. 使用 `setEntryOrderValue` / `N()` 这类宿主自己的保存函数，让保存、广播和
   布局刷新走同一条路径；
4. 在 `applyTopBarEntryVisibility()` 之前执行，避免先排错再排回来。

### 可选：保留左右两侧各自的历史位置

如果希望“顶栏左 → 顶栏右 → 顶栏左”后回到左侧原位置，只靠一个
`orders.topBar` 不够，因为入口在同一数组中只有一个位置。

可以在 profile 中增加非渲染用记忆：

```json
{
  "topBarAnchors": {
    "plugin:arco-calendar:arco-calendar-topbar": {
      "left": { "before": "barForward" },
      "right": { "after": "toolbarTitle" }
    }
  }
}
```

离开某一侧时记录相邻 key；返回时优先恢复到该相邻位置，找不到相邻项再
插入到该侧末尾。这个属于增强项，不是修复“切换无效”的最低要求。

## 插件端当前临时方案

在宿主修复前，插件只能通过内部接口补做同一步：

1. `addTopBar()` 之后读取当前激活 profile 的 `orders.topBar`；
2. 只找到本插件自己的 entry key；
3. 按设置把它移到 `drag` 前/后；
4. 调用 `/api/setting/setEntryVisibility` 保存；
5. 让宿主自己的 `pS()` 重排。

这不是长期方案，原因是：

- 依赖未公开接口；
- 需要复制宿主的一部分排序逻辑；
- 宿主未来修改 entry visibility 结构时，插件需要同步适配。

## 验收用例

- [ ] `addTopBar({ id, position: "right" })` 后，`applyTopBarEntryVisibility()` 不会把入口排到左侧。
- [ ] 顶栏左 → 顶栏右 → 左，入口实际 DOM 跟随设置变化。
- [ ] 只移动当前插件 entry，其他插件顺序不变。
- [ ] 切换边栏再回来，入口回到有效位置。
- [ ] 重载页面后设置与实际位置一致。
- [ ] 没有公开 API 调用时，不再需要插件直接读写 `entryVisibility`。

## 相关实现点

- 插件注册：`Plugin.addTopBar()` / `Plugin.removeTopBar()`
- 顶栏重排：`applyTopBarEntryVisibility()`（bundle `pS()`）
- 顺序读取：`getTopBarOrder()` / `getEntryOrder(TOP_BAR_ROOT_PATH)`
- 顺序保存：`setEntryOrderValue()`（bundle `N()`）
- 配置结构：`appearance.entryVisibility.profiles[].orders.topBar`
- 内核接口：`/api/setting/setEntryVisibility`（仅作为插件临时方案使用）

## 最终判断

`addTopBar()` 的 `position` 参数目前只完成了 DOM 插入，没有完成
`orders.topBar` 的持久化同步，这是根因。

宿主端应在 `addTopBar()` 内补齐这一步，并复用内部 order 保存逻辑；插件端
不应长期依赖 `/api/setting/setEntryVisibility`。
