# Spine 3.6.39 看板娘接入流程

这份记录覆盖本次雷姆/拉姆看板娘修复全过程：资源格式确认、`.skel` 转 `.json`、官方 Spine 3.6 runtime 接入、视口裁剪放大，以及后续新增同格式角色时的复用步骤。

## 当前结论

- 项目内这批资源是 Spine `3.6.39`。
- 官方 `spine-ts 3.6` web runtime 能稳定读取 JSON，但不读取二进制 `.skel`。
- `wang606/SpineSkeletonDataConverter` 可以把 `.skel` 转为 Spine JSON，因此前台只接入官方 3.6 widget，不再维护手写二进制解析器。
- 模型周围空白来自骨架 setup bounds 过大，不能只放大 DOM 外框；现在用 `applySpineWidgetFocus` 覆盖 widget 相机视口，按角色主体裁切。

## 本次落地的文件

- 官方 Spine 3.6 runtime：`public/vendor/spine-3.6/spine-widget.js`
- 官方 runtime license：`public/vendor/spine-3.6/LICENSE`
- 雷姆资源：`public/mascot/rem/1.skel`、`1.atlas`、`1.png`、`1.json`
- 拉姆资源：`public/mascot/ram/ram.skel`、`ram.atlas`、`ram.png`、`ram.json`
- 拉姆组件：`src/components/RamMascot.tsx`
- 雷姆组件：`src/components/GifMascot.tsx`
- Spine widget 裁剪 helper：`src/lib/spine-widget-focus.ts`
- 转换器资源包：已从仓库移除（体积优化）。需要时从 https://github.com/wang606/SpineSkeletonDataConverter 重新编译

## 转换器来源和打包

使用的是 `https://github.com/wang606/SpineSkeletonDataConverter`。仓库源码被拉到临时目录后，用 Linux 本地编译得到：

```bash
/tmp/ssc/SpineSkeletonDataConverter
```

资源库 zip 已打包到：

```text
public/resources/tools/spine-skeleton-data-converter-v3.7-hypervoid.zip
```

包内包含 Linux 可执行文件、上游 Windows release 工具、辅助脚本、license 和 README。公共下载地址按 Next static public 规则是：

```text
/resources/tools/spine-skeleton-data-converter-v3.7-hypervoid.zip
```

如果要让它显示在 `/resources` 页面，还需要在后台资源库添加一条 DB 记录，URL 填上面的 public 路径即可。

## skel 转 json

本次实际执行过的转换命令：

```bash
/tmp/ssc/SpineSkeletonDataConverter public/mascot/rem/1.skel public/mascot/rem/1.json
/tmp/ssc/SpineSkeletonDataConverter public/mascot/ram/ram.skel public/mascot/ram/ram.json
```

新增同格式角色时，保持同一目录结构，例如：

```text
public/mascot/<character>/<character>.skel
public/mascot/<character>/<character>.atlas
public/mascot/<character>/<character>.png
public/mascot/<character>/<character>.json
```

然后执行：

```bash
/tmp/ssc/SpineSkeletonDataConverter public/mascot/<character>/<character>.skel public/mascot/<character>/<character>.json
```

注意 atlas 第一行的贴图文件名可能是裸文件名，前台组件里需要用 `normalizeAtlasPage()` 替换成 public URL，例如 `/mascot/ram/ram.png`。

## 运行时接入

前台组件通过 script 动态加载：

```ts
const RUNTIME_SRC = "/vendor/spine-3.6/spine-widget.js";
```

创建 widget 时传入转换后的 JSON、atlas 文本和贴图页：

```ts
new spine.SpineWidget(host, {
  jsonContent,
  atlasContent: normalizeAtlasPage(atlasText),
  atlasPages: [PNG_URL],
  animation: selectAnimation(jsonContent),
  loop: true,
  fitToCanvas: true,
  alpha: true,
  backgroundColor: "#00000000",
  premultipliedAlpha: false,
});
```

默认动画优先选 `24_idle`；如果新角色没有这个动画，`selectAnimation()` 会退回第一个动画。

## 去除周围空白和放大

官方 widget 的默认 `fitToCanvas` 使用整套 setup bounds。雷姆/拉姆资源的 bounds 明显大于角色主体，所以外层框越放大，透明空白也一起放大。

当前做法是在 widget `success` 回调里调用：

```ts
applySpineWidgetFocus(widget, REM_FOCUS);
applySpineWidgetFocus(widget, RAM_FOCUS);
```

这个 helper 覆盖 `widget.resize()`，根据给定 `centerX`、`centerY`、`width`、`height` 设置 `mvp.ortho2d`，并按 canvas 宽高比自动扩展视野，避免拉伸。

当前参数：

```ts
const REM_FOCUS = { centerX: 44, centerY: 198, width: 440, height: 550, padding: 1.02 };
const RAM_FOCUS = { centerX: -25, centerY: 165, width: 470, height: 590, padding: 1.02 };
```

调参规则：

- 角色太小：减小 `width` 和 `height`。
- 角色被裁掉：增大 `width`、`height` 或 `padding`。
- 角色整体偏左/偏右：调 `centerX`。
- 角色整体偏上/偏下：调 `centerY`。
- 外层占屏大小：调 `MASCOT_W` / `MASCOT_H`；这不改变骨架相机，只改变拖拽盒子和屏幕占位。

## 新增角色清单

1. 放入 `.skel`、`.atlas`、`.png` 到 `public/mascot/<character>/`。
2. 用转换器生成 `.json`。
3. 用官方 Spine 3.6 runtime 验证 JSON 能读取、动画存在、atlas page 能归一到 public URL。
4. 复制一个现有组件，替换 `JSON/ATLAS/PNG` 常量和 `normalizeAtlasPage()`。
5. 在 `MascotRouter`、后台看板娘设置、站点设置里注册新角色 key。
6. 先用默认 `fitToCanvas` 确认能显示，再加 `applySpineWidgetFocus` 裁剪空白。
7. 跑 `pnpm lint` 和 `pnpm build`。

## 验证脚本

用官方 runtime 解析转换后的 JSON，确认版本和动画：

```bash
node - <<'NODE'
const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('public/vendor/spine-3.6/spine-widget.js', 'utf8');
const context = { console, window: { addEventListener() {} }, document: { addEventListener() {}, getElementsByClassName() { return []; } } };
vm.createContext(context);
vm.runInContext(code, context);
const spine = context.spine;
const fakeTexture = { setFilters() {}, setWraps() {}, getImage() { return { width: 512, height: 512 }; }, dispose() {} };
for (const [name, atlasPath, jsonPath, png] of [
  ['rem', 'public/mascot/rem/1.atlas', 'public/mascot/rem/1.json', '/mascot/rem/1.png'],
  ['ram', 'public/mascot/ram/ram.atlas', 'public/mascot/ram/ram.json', '/mascot/ram/ram.png'],
]) {
  const atlasText = fs.readFileSync(atlasPath, 'utf8').replace(/^(\s*)(?:1|ram)\.png/m, '$1' + png);
  let page = null;
  const atlas = new spine.TextureAtlas(atlasText, (path) => { page = path; return fakeTexture; });
  const data = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(jsonPath, 'utf8')));
  console.log(JSON.stringify({ name, page, version: JSON.parse(fs.readFileSync(jsonPath, 'utf8')).skeleton.spine, animations: data.animations.length, has24Idle: data.findAnimation('24_idle') !== null }));
}
NODE
```

期望：

- `version` 是 `3.6.39`。
- `has24Idle` 是 `true`。
- page 分别是 `/mascot/rem/1.png` 和 `/mascot/ram/ram.png`。

## 故障定位

- 什么都不显示：先看 Network 里 JSON、atlas、png、runtime 是否 200。
- 报 JSON 缺失：确认 `.skel` 已转换，且路径在 public 下。
- 报 atlas texture 找不到：检查 atlas 第一行文件名和 `normalizeAtlasPage()`。
- 显示很小：不要先改外层 DOM，优先改 `*_FOCUS.width/height`。
- 角色错位：不要回到手写 parser，先确认是否使用官方 3.6 runtime + 转换 JSON。
- 切换角色无效：检查 `MascotRouter` 和后台 `/mascot/character` API 是否注册了角色 key。
