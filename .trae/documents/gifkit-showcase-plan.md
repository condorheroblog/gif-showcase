# GIF Showcase 演示网站 — 实施计划

## Summary
基于 `sindresorhus/gifkit`（v0.1.0）构建一个 React + TypeScript 前端演示网站，使用 Vite 作为构建工具，纯 Tailwind CSS v4 作为样式方案（通过 Vite 插件方式集成，不走 PostCSS）。用户可上传本地 GIF，站点会把 GIF 解码为 RGBA 帧序列，并通过「预览」与「编辑」两个互斥面板展示能力：预览面板提供时间线拖动、单帧导出、播放/暂停；编辑面板支持调整尺寸、压缩质量、删除帧并重新编码为新的 GIF 下载。

## Current State Analysis
- 工作目录 `/Users/david/i/gif-showcase` 当前为空目录，无任何项目文件，需要从零初始化。
- `gifkit` 是一个 ESM-only 的纯 JS 库（`"type": "module"`），提供 `decodeAnimatedGIF` / `encodeAnimatedGIF` 两个核心 API，返回的 `frames[].pixels` 是 `Uint8ClampedArray` 的 RGBA 数据，`frames[].delay` 是秒。`encodeAnimatedGIF` 的可调参数：`width`、`height`、`fps`、`playCount`、`quality`（0–1）。
- 库本身在浏览器中可直接运行（无 Node 专属 API），所以 Vite 项目里直接 `import` 即可。
- 注意：`encodeAnimatedGIF` 只支持「统一 fps」或「统一 width/height」模式，因此「删除帧」通过过滤 `frames` 数组实现；「调整尺寸」通过在 canvas 中按比例缩放每帧 RGBA 后再编码实现；「压缩」通过调节 `quality` 实现。
- 「单帧保存」需把 RGBA 字节绘制到 OffscreenCanvas / HTMLCanvasElement，再用 `toBlob` 下载。

## Proposed Changes

### 1. 项目初始化
- `pnpm create vite@latest . --template react-ts` 初始化项目（注意要确认 vite ≥ 5）。
- 在 `package.json` 中加入依赖：
  - 运行时：`@sindresorhus/gifkit`
  - 样式：`tailwindcss@^4`（v4）
  - Vite 插件：`@tailwindcss/vite@^4`（v4 官方 Vite 插件，避免 PostCSS 配置）
- `vite.config.ts` 中 `import tailwindcss from '@tailwindcss/vite'` 并加入 `plugins: [react(), tailwindcss()]`。
- 入口 CSS（`src/index.css`）使用 v4 的写法：`@import "tailwindcss";`，并通过 `@custom-variant dark (&:where(.dark, .dark *));` 启用基于 class 的暗黑模式。

### 2. 暗色模式
- 在 `index.html` 的 `<html>` 上加 `class="dark"` 控制策略：默认跟随系统（`prefers-color-scheme`）+ 顶部导航条放一个切换按钮，写入 `localStorage`，刷新后保留。
- 切换逻辑封装在 `src/hooks/useTheme.ts`，对外暴露 `{theme, toggleTheme}`。

### 3. 全局布局
- `src/App.tsx` 三段式：顶部 Header（Logo / 标题 / 主题切换按钮 / GitHub 链接）/ 主内容 / 底部说明。
- 响应式：移动端 Header 内容纵向紧凑，主体面板宽度 `max-w-5xl mx-auto px-4`；时间线在窄屏下保持横向滚动；面板切换按钮采用图标+文字形式（移动端仅显示图标）。

### 4. 核心模块

#### 4.1 `src/lib/gif.ts` —— GIF 处理工具层
封装以下函数，屏蔽底层细节：
- `loadGifBytes(file: File): Promise<Uint8Array>` — 通过 `FileReader` 读 ArrayBuffer 再 `new Uint8Array(...)`。
- `decodeGif(bytes): DecodedAnimatedGIF` — 直接调 `decodeAnimatedGIF`。
- `frameToPngBlob(pixels: Uint8ClampedArray, width, height): Promise<Blob>` — 把 RGBA 字节写入 OffscreenCanvas，调用 `convertToBlob({type: 'image/png'})`，回退到 `HTMLCanvasElement.toBlob`。
- `resizeRgbaFrames(frames, newWidth, newHeight)` — 用 OffscreenCanvas 把每帧 RGBA 缩放后导出为新的 `Uint8ClampedArray`。
- `exportGif(frames, {width, height, quality, playCount}): Blob` — 调用 `encodeAnimatedGIF`，得到 `Uint8Array` 后用 `new Blob([bytes], {type: 'image/gif'})` 包装。
- `triggerDownload(blob, filename)` — 用 `URL.createObjectURL` + `<a download>` 触发下载。
- `formatBytes(n)` / `formatDelay(s)` 等展示辅助函数。

#### 4.2 `src/lib/frameCache.ts` —— 帧缩略图生成
- 解码后为每帧生成 PNG `BlobURL`（用 `frameToPngBlob`），存入 `Map<number, string>`，组件卸载时 `URL.revokeObjectURL` 释放。
- 缩略图在时间线中渲染，避免拖动时再解码卡顿。

#### 4.3 `src/components/UploadZone.tsx` —— 上传区
- `<input type="file" accept="image/gif">` + 拖拽支持（`onDragOver` / `onDrop`）。
- 文件大小限制（默认 20 MB，可配）；超限弹错误提示。
- 解析出错（不是合法 GIF）时通过 try/catch 捕获并提示。

#### 4.4 `src/components/InfoPanel.tsx` —— 信息面板
- 显示元数据：原始文件名、宽 × 高、帧数、总时长（ms 累加）、平均 fps、文件大小、playCount（`'forever'` 时显示为「无限循环」）。
- 右上角放「预览 / 编辑」分段切换按钮（受控），单选互斥。
- 移动端：元数据用两列 grid；按钮占满宽度。

#### 4.5 `src/components/PreviewPanel.tsx` —— 预览面板
布局（自上而下）：
1. 主预览画布：`<canvas>` 渲染当前帧。
2. 播放控制条：上一帧 / 播放-暂停 / 下一帧 + 当前帧序号 + 当前累计毫秒数 / 总时长。
3. 时间线：横向 `overflow-x-auto`，内含 N 个缩略图（按帧序号），上方覆盖一个可拖动的 `<input type="range">`。range 的 `min=0, max=frames.length-1, step=1`；输入时同步主画布。
4. 「下载当前帧」按钮：调用 `frameToPngBlob` + `triggerDownload`。
5. 关键状态：当前帧下标 `currentIndex`、是否播放中 `isPlaying`、`useEffect` 内 `setTimeout` 按 `frames[i].delay * 1000` 调度下一帧（`delay` 存的是秒，转毫秒）。
6. 性能：使用 `requestAnimationFrame` + 缓存主 canvas 的 `ImageData` 减少重绘（可选优化）。

#### 4.6 `src/components/EditorPanel.tsx` —— 编辑面板
布局：
1. 缩略图网格：每帧卡片带「勾选保留」复选框，顶部有「全选 / 反选 / 仅保留选中」三个快捷按钮。
2. 尺寸调整：宽度输入框（number input，受控），高度按原宽高比自动联动（可手动解锁宽高比开关）。
3. 压缩比例：滑块 0–1，默认 0.8，步长 0.05。
4. 循环次数：number input 或 select（forever / 1 / N）。
5. 实时预览：右侧用小 canvas 循环播放当前选中 + 缩放后的帧序列（节流：调整后 debounce 200ms 重新生成预览）。
6. 「保存为新 GIF」按钮：调用 `exportGif` 并触发下载，文件名默认 `<原名>-edited.gif`。

#### 4.7 `src/hooks/useGif.ts` —— 顶层状态 Hook
- 维护 `currentFile`、`decoded`、`viewMode: 'preview' | 'edit'`、`selectedFrameIndices` 等。
- 暴露 `loadFromFile(file)`、`setViewMode(mode)`、`reset()`。
- 用 `useReducer` 组织状态，避免在多个组件里 prop drilling。

### 5. 页面交互流程
1. 首次进入：显示居中的上传卡片（带品牌色渐变背景）。
2. 选择文件 → `loadGifBytes` → `decodeAnimatedGIF` → 加载成功进入工作台：上方 Header + 左侧/上方 InfoPanel（带切换按钮）+ 下方 PreviewPanel/EditorPanel。
3. 切换面板时通过 `viewMode` 单选，互斥显示。
4. 编辑面板里「保存为新 GIF」后不重置当前解码数据，保留让用户继续编辑；如需清空，提供「重新上传」按钮回到初始状态。

### 6. 视觉规范
- 调色板：主色 `indigo-500`，强调色 `pink-500`；暗色模式用 `zinc-900` 背景 + `zinc-100` 文字。
- 圆角统一 `rounded-2xl`，卡片阴影 `shadow-lg`。
- 字体使用系统字体栈，无需额外引入。
- 所有按钮加 `transition` 和 `active:scale-[0.98]`，给点按反馈。
- 暗色模式切换过渡：给 `<html>` 加 `transition-colors duration-200`。

### 7. 兼容性与工程细节
- TS 严格模式（`strict: true`），给 `gifkit` 加 `/// <reference types="@sindresorhus/gifkit" />` 或在 `tsconfig.json` 的 `types` 引入。
- `vite.config.ts` 不需要 PostCSS 配置（v4 + `@tailwindcss/vite` 自带处理）。
- 移动端兼容：用 `touch-action: pan-y` 让时间线拖拽不冲突页面滚动。
- 错误边界：`<ErrorBoundary>` 包裹主内容，捕获解码 / 编码异常并提示。
- README 不必创建（按规则禁止主动建文档文件），但若用户后续需要可补。

## Assumptions & Decisions
- **构建工具**：Vite + React + TS（用户已选）。
- **样式方案**：纯 Tailwind CSS v4，通过 `@tailwindcss/vite` 插件集成，不用 PostCSS（用户已指定）。
- **UI 库**：不引入第三方组件库（用户已选「纯 Tailwind」），所有 UI 自实现。
- **编辑能力**：「删除帧」= 从帧数组过滤；「调整尺寸」= 缩放 RGBA 后再编码；「压缩」= `quality` 参数（用户已选）。
- **不做 SSR**：纯前端 SPA。
- **不做 i18n**：默认中文 UI，README/版权保留英文链接。
- **不引入路由库**：单页应用，状态驱动视图切换。
- **不引入状态管理库**：用 `useReducer` + Context 已足够。

## Verification
1. `pnpm install` 无错误，`pnpm dev` 启动后浏览器打开 `http://localhost:5173` 能看到上传卡片。
2. 上传一个合法 GIF（如仓库 `fixtures` 下的样例，或在线样例）：
   - 信息面板正确显示宽高、帧数、总时长、文件大小、循环次数。
   - 预览面板：自动播放；拖动时间线主画布同步刷新；点暂停后停在当前帧；点下载当前帧能下载到 PNG。
   - 编辑面板：取消勾选部分帧后，调节尺寸、质量、循环次数，点「保存为新 GIF」下载得到的新 GIF 用系统图片查看器可正常播放。
3. 切换暗色模式后所有面板背景/文字颜色正确。
4. 移动端（DevTools 模拟 iPhone 14 Pro）：Header / 信息面板 / 预览时间线均不溢出，主要操作可点。
5. 上传非 GIF（如 PNG）或超大文件时给出友好错误提示，不白屏。
6. 重新上传新 GIF 后状态被正确重置。
