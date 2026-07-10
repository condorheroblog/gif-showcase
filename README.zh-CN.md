# GIF Showcase · gifkit 在线演示

一个基于 [`@sindresorhus/gifkit`](https://github.com/sindresorhus/gifkit) 构建的**纯前端、超轻量** GIF 演示站。上传一个 GIF 即可在浏览器内查看元数据、逐帧预览、编辑（缩放 / 删帧 / 调压缩质量 / 改循环次数 / 覆盖 FPS）并重新编码下载，整个过程**不会上传任何字节到服务器**。

🌐 **在线访问：** [https://condorheroblog.github.io/gif-showcase/](https://condorheroblog.github.io/gif-showcase/)

> English version: [README.md](./README.md)

## ✨ 功能

- **本地处理** —— 解码、帧渲染、重编码全部在浏览器中通过 `OffscreenCanvas` / `HTMLCanvasElement` 完成。
- **双语界面** —— 内置 `zh-CN` 与 `en-US`，基于 `i18next` + `react-i18next` + `i18next-browser-languagedetector`。首次访问按浏览器语言自动选择，结果写入 `localStorage`，之后可随时在顶栏切换。
- **预览模式**
  - 元数据总览：宽 × 高、帧数、总时长、平均 FPS、文件大小、循环次数。
  - 主画布自动播放，支持播放 / 暂停 / 上一帧 / 下一帧。
  - 时间线带帧缩略图，可拖拽定位到任意帧。
  - 一键把当前帧导出为 PNG。
- **编辑模式**
  - 逐帧勾选保留，支持「全选 / 反选」。
  - 尺寸调整：宽高比可锁定，并提供 50 / 75 / 100 / 150 / 200% 的快捷预设。
  - 压缩质量滑块（0.1 – 1.0），映射到 `gifkit` 的颜色量化器。
  - 循环控制：无限循环，或自定义播放次数。
  - **自定义 FPS** —— 默认沿用原 GIF 每帧的原始延迟；也可开启「自定义 FPS」以统一帧率（0 – 60 fps）重新编码。
  - 实时预览画布，所见即所得。
  - 一键导出为 `<原名>-edited.gif`。
- **暗色 / 亮色主题** —— 首次访问跟随系统偏好，之后记住用户选择（存 `localStorage`）。
- **响应式 UI** —— 从手机（已在 iPhone 14 Pro 视口下验证）到桌面端都能用。

## 🧱 技术栈

| 层级      | 选型                                                                       |
| --------- | -------------------------------------------------------------------------- |
| 构建工具  | [Vite](https://vitejs.dev/)                                                |
| UI 框架   | React 19 + TypeScript（严格模式）                                           |
| 样式方案  | [Tailwind CSS v4](https://tailwindcss.com/)（通过 `@tailwindcss/vite` 集成） |
| GIF 引擎  | [`@sindresorhus/gifkit`](https://github.com/sindresorhus/gifkit)           |
| 国际化    | [i18next](https://www.i18next.com/) + `react-i18next` + `i18next-browser-languagedetector` |
| 代码规范  | [`@antfu/eslint-config`](https://github.com/antfu/eslint-config) + `eslint-plugin-react-refresh` |
| Git 钩子  | `simple-git-hooks` + `lint-staged` + `commitlint`（Conventional Commits）   |

## 🚀 本地启动

```bash
# 1. 安装依赖（推荐 pnpm；npm / yarn 也可以）
pnpm install

# 2. 启动开发服务器：http://localhost:5173
pnpm dev

# 3. 生产构建（产物输出到 ./dist）
pnpm build

# 4. 本地预览生产构建
pnpm preview

# 5. 代码检查 & 类型检查
pnpm lint
pnpm typecheck
```

## 🗂 目录结构

```
gif-showcase/
├── .github/workflows/deploy.yml      # GitHub Pages 部署
├── src/
│   ├── components/                   # Header / UploadZone / InfoPanel / PreviewPanel / EditorPanel
│   ├── hooks/                        # useGif、useTheme
│   ├── i18n/                         # i18next 初始化（locales/、i18n.ts、useLanguageSync.ts）
│   ├── lib/                          # gif.ts（解码 / 编码 / 缩放 / 下载）、frameCache.ts、errorKey.ts
│   ├── shims/node-util.ts            # 给 gifkit 的 node:util 做浏览器侧 polyfill
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                     # Tailwind v4 入口
├── index.html
├── vite.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

## 🌐 部署

部署由 GitHub Actions 自动完成，见 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)：

1. 任何推送到 `main` 分支的提交都会触发工作流。
2. `pnpm install` + `pnpm run build` 产出 `dist/` 静态资源。
3. [`JamesIves/github-pages-deploy-action`](https://github.com/JamesIves/github-pages-deploy-action) 把 `dist/` 发布到 `github-pages` 环境。

站点发布在 **`/gif-showcase/`** 子路径下，因此所有资源 URL 都以当前页为基准解析。如果你 fork 本项目并改了仓库名，记得同步调整 `vite.config.ts` 中的 `base`（或最终部署路径）以匹配新的仓库名。

在仓库的 **Settings → Pages** 中这样设置：

- **Source：** *Deploy from a branch*
- **Branch：** `gh-pages` / `(root)`

GitHub 会把站点分配到 `https://<owner>.github.io/<repo>/`，本仓库对应 `https://condorheroblog.github.io/gif-showcase/`。

## 🛡 隐私

无上传、无埋点、无第三方请求（除首次加载的静态资源外）。你的 GIF 不会离开当前浏览器标签页。

## 📜 许可证

[MIT](https://github.com/condorheroblog/gif-showcase/blob/main/LICENSE) License © 2026-Present [Condor Hero](https://github.com/condorheroblog)。
