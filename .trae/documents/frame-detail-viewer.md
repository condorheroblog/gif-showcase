# 帧选择区放大查看功能

## Summary

在 `EditorPanel.tsx` 的帧选择区（`L212-284`）右上角新增一个「放大」图标按钮（`Maximize2` / `Minimize2` 风格的内联 SVG，遵循项目零依赖原则）。点击后：
- **PC（≥`sm`）**：打开一个响应式 Modal 弹框。
- **移动端（`<sm`）**：以全屏 Modal（铺满视口、关闭浏览器滚动）替代系统 Fullscreen API，行为完全一致。

弹框内是「放大版网格 + 点击单帧放大镜」二级视图：
- **总览网格**：~160px / 帧，多列自适应，复用现有 `useFrameThumbnails` 数据。
- **单帧放大镜**：点击任一帧进入 1:1 大图预览，背景使用棋盘格（`checkerboard` 透明度），支持鼠标滚轮/双指缩放、拖拽平移、键盘 `←/→` 翻帧、`Esc` 退到网格。

## Current State Analysis

- `src/components/EditorPanel.tsx:212-284` 是「帧选择」面板。已用 `useFrameThumbnails` 异步生成每帧 PNG blob URL，存入 `thumbnails` 映射。
- 缩略图网格用 `gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))"`，`maxHeight: 280`，在小尺寸下确实难以辨别细节。
- 现有 `PreviewPanel.tsx`（参考）使用同一 hook，证明 hook 可复用。
- 国际化 key 已在 `src/i18n/locales/{en-US,zh-CN}.json` 的 `editor.*` 命名空间下，需新增 3 个 key。
- 项目无 UI 库（无 Radix / Headless UI / Heroicons 等）。所有图标用内联 SVG 即可，与现有 `✓/✕` 风格一致。
- 无 Modal 组件，需自建轻量 Modal（`fixed inset-0` + 背景遮罩 + `Esc` 关闭 + 焦点陷阱可后续再加，先做最小可用版）。

## Proposed Changes

### 1. `src/components/EditorPanel.tsx` — 状态与交互

新增 state（文件顶部 import 块附近，紧跟现有 `useState` 声明）：

```ts
const [isGalleryOpen, setIsGalleryOpen] = useState(false);
const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
const [zoomScale, setZoomScale] = useState(1);
const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
```

新增计算：

```ts
// 弹框内网格的目标尺寸：源图较大时取 160，过小时 96
const galleryCell = Math.max(96, Math.min(160, Math.round(Math.max(sourceWidth, sourceHeight) * 0.6)));
```

### 2. `src/components/EditorPanel.tsx` — 触发按钮

在 `L213` 标题行（`flex items-center justify-between mb-2`）的右侧，把现有的「全选 / 反选」按钮组替换为：

```tsx
<div className="flex items-center gap-1.5">
  <button /* 全选 */ />
  <button /* 反选 */ />
  <button
    type="button"
    onClick={() => setIsGalleryOpen(true)}
    aria-label={t("editor.openGallery")}
    title={t("editor.openGallery")}
    className="rounded-md border border-zinc-200 dark:border-zinc-700 p-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" />
    </svg>
  </button>
</div>
```

### 3. `src/components/EditorPanel.tsx` — Modal 弹框组件

在 `EditorPanel` return 的最外层 `<section>` 内部、`</section>` 之前新增条件渲染：

```tsx
{isGalleryOpen && (
  <FrameGalleryModal
    frames={frames}
    thumbnails={thumbnails}
    sourceWidth={sourceWidth}
    sourceHeight={sourceHeight}
    cellSize={galleryCell}
    zoomedIndex={zoomedIndex}
    onPickFrame={setZoomedIndex}
    onClose={() => { setIsGalleryOpen(false); setZoomedIndex(null); setZoomScale(1); setZoomPan({ x: 0, y: 0 }); }}
  />
)}
```

新建组件 `FrameGalleryModal`（同一文件内，与 `EditorPanel` 同级，紧随其后）：

- Props：`frames`、`thumbnails`、`sourceWidth`、`sourceHeight`、`cellSize`、`zoomedIndex`、`onPickFrame`、`onClose`。
- 行为：
  - `useEffect` 监听 `keydown`：`Esc` 退出单帧放大镜或关闭弹框；`←/→` 在单帧放大镜中翻帧（边界时停止）。
  - `useEffect` 打开时锁定 `document.body.overflow = "hidden"`，卸载时恢复。
  - 背景：`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm`，点击遮罩关闭。
  - 容器：`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none`，内部内容 `pointer-events-auto`。
  - 桌面端：内容最大宽 `max-w-6xl`，最大高 `90vh`。
  - 移动端：内容 `inset-0` 铺满（`rounded-none`），模拟全屏。
  - 顶部固定条：标题 + 关闭按钮（`✕`，`Esc` 提示）。
- 内部条件渲染：
  - `zoomedIndex === null` → 渲染 `grid`，列模板 `repeat(auto-fill, minmax(${cellSize}px, 1fr))`，与原网格同结构但用 `<button>` 而非 `<label>`（无勾选功能），点击触发 `onPickFrame(index)`。
  - 否则渲染单帧放大镜：棋盘格背景 + `<img>`（`image-rendering: pixelated`，CSS `transform: translate() scale()`），滚轮缩放（`onWheel`，`ctrlKey` 阻止页面缩放时改用 deltaY 直接缩放），`pointerdown/move/up` 拖拽，松开后保留偏移；左下角小工具条：`-` `100%` `+` `Reset`。
  - 单帧模式右下角有 `← prev / next →` 按钮。

### 4. 国际化

`src/i18n/locales/en-US.json` 在 `editor` 下新增：

```json
"openGallery": "View frames in detail",
"galleryTitle": "Frame details",
"close": "Close",
"zoomReset": "Reset",
"prevFrameShort": "Prev",
"nextFrameShort": "Next"
```

`src/i18n/locales/zh-CN.json` 对应：

```json
"openGallery": "查看帧详情",
"galleryTitle": "帧详情",
"close": "关闭",
"zoomReset": "重置",
"prevFrameShort": "上一帧",
"nextFrameShort": "下一帧"
```

### 5. 可选：键盘焦点与 a11y（最小化）

- 关闭按钮设 `autoFocus`。
- 单帧放大镜容器 `tabIndex={-1}`，`useEffect` 中 `element.focus()`。
- 弹框使用 `role="dialog"` 与 `aria-modal="true"`，标题用 `aria-labelledby` 关联。

## Assumptions & Decisions

- 不引入新依赖；图标全部使用内联 SVG。
- 移动端「全屏」语义用铺满视口的 Modal 实现，与全选/反选交互一致；不调用 `requestFullscreen`。
- 复用现有 `useFrameThumbnails`，不重新生成高清图——`useFrameThumbnails` 直接基于 `frameToPngBlob(frames[i].pixels, width, height)`，像素即原始数据，1:1 放大是天然支持的；如需缩放/平移体验更佳，可在 hook 调用处传入可选 `scale` 参数生成更平滑的预览（默认 1x 与现状一致，超大原图可按 2x 采样）。**本次先不优化，保留现状以减少改动面**。
- 不实现焦点陷阱（focus trap）；Esc 关闭已满足基本 a11y，可作为后续优化。
- 不持久化弹框开关；关闭即销毁。
- 不动 `selectedIndices` / `toggleIndex` 逻辑——弹框内仅查看，不可切换勾选；保留原缩略图的勾选交互。

## Verification Steps

1. `pnpm dev`（或 `npm run dev`）启动 dev server。
2. 加载任一 GIF，确认帧选择区右上角出现「放大」图标按钮。
3. 点击按钮：
   - 桌面端：弹出居中弹框，显示更大尺寸的网格（≥96px/帧）。
   - 移动端（DevTools 设备模拟）：弹框铺满视口。
4. 弹框内点击任一帧 → 进入 1:1 放大视图，棋盘格背景；滚轮缩放；拖拽平移；`←/→` 翻帧；`Esc` 退到网格。
5. 关闭弹框：点击遮罩、点击 `✕`、或 `Esc`（二级时先退到网格，再次 `Esc` 关闭），确认 `document.body` 滚动恢复。
6. 切换中英文，验证 5 个新增 key 全部正确显示。
7. 关闭/打开弹框多次，确认未触发 React `act()` 警告或内存泄漏（DevTools Performance 检查 `URL.createObjectURL` 数量稳定）。
8. `pnpm typecheck && pnpm lint` 通过。

## Files Touched

- `src/components/EditorPanel.tsx`（修改 + 同文件新增 `FrameGalleryModal` 组件）
- `src/i18n/locales/en-US.json`（+5 keys）
- `src/i18n/locales/zh-CN.json`（+5 keys）

未创建新文件，未引入新依赖。
