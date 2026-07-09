# GIF Showcase

An ultra-lightweight, **100% client-side** GIF demo built on top of [`@sindresorhus/gifkit`](https://github.com/sindresorhus/gifkit). Upload an animated GIF, inspect its metadata, scrub through its frames, edit it (resize / drop frames / tweak quality / loop count), and re-encode it — all without sending a single byte to a server.

🌐 **Live demo:** [https://condorheroblog.github.io/gif-showcase/](https://condorheroblog.github.io/gif-showcase/)

> 中文版说明见 [README.zh-CN.md](./README.zh-CN.md)。

## ✨ Features

- **Local-only processing** — decoding, frame rendering and re-encoding happen entirely in the browser via `OffscreenCanvas` / `HTMLCanvasElement`.
- **Preview mode**
  - Metadata overview (dimensions, frame count, total duration, average FPS, file size, loop count).
  - Animated canvas preview with play / pause / prev / next controls.
  - Scrubable timeline with per-frame thumbnails.
  - Download the currently visible frame as a PNG.
- **Editor mode**
  - Per-frame selection with *Select all* / *Invert* shortcuts.
  - Resize with optional aspect-ratio lock and quick preset factors (50 / 75 / 100 / 150 / 200 %).
  - Quality slider (0.1 – 1.0) wired to `gifkit`'s color quantizer.
  - Loop control: *forever* or a custom play count.
  - Live preview canvas that reflects your edits in real time.
  - One-click export of the edited GIF as `<name>-edited.gif`.
- **Dark / light theme** — follows system preference on first visit, then remembers the user's choice in `localStorage`.
- **Responsive UI** — usable from a phone (DevTools-verified on iPhone 14 Pro viewport) up to a desktop.

## 🧱 Tech Stack

| Layer        | Choice                                                |
| ------------ | ----------------------------------------------------- |
| Build tool   | [Vite](https://vitejs.dev/)                           |
| UI framework | React 19 + TypeScript (strict)                        |
| Styling      | [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite` |
| GIF engine   | [`@sindresorhus/gifkit`](https://github.com/sindresorhus/gifkit) |
| Linting      | [`@antfu/eslint-config`](https://github.com/antfu/eslint-config) + `eslint-plugin-react-refresh` |
| Hooks        | `simple-git-hooks` + `lint-staged` + `commitlint` (Conventional Commits) |

## 🚀 Getting Started

```bash
# 1. Install dependencies (pnpm is recommended; npm / yarn also work)
pnpm install

# 2. Start the dev server on http://localhost:5173
pnpm dev

# 3. Build for production (output goes to ./dist)
pnpm build

# 4. Preview the production build locally
pnpm preview

# 5. Lint
pnpm lint
```

## 🗂 Project Layout

```
gif-showcase/
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── src/
│   ├── components/                # Header, UploadZone, InfoPanel, PreviewPanel, EditorPanel
│   ├── hooks/                     # useGif, useTheme
│   ├── lib/                       # gif.ts (decode / encode / resize / download), frameCache.ts
│   ├── shims/node-util.ts         # browser polyfill for gifkit's node:util import
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # Tailwind v4 entry
├── index.html
├── vite.config.ts
├── eslint.config.js
├── tsconfig*.json
└── package.json
```

## 🌐 Deployment

Deployment is fully automated via GitHub Actions — see [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):

1. On every push to `main`, the workflow checks out the repo.
2. `pnpm install` and `pnpm run build` produce a static bundle in `dist/`.
3. [`JamesIves/github-pages-deploy-action`](https://github.com/JamesIves/github-pages-deploy-action) ships the contents of `dist/` to the `github-pages` environment.

The site is served from the **`/gif-showcase/`** sub-path, so all asset URLs are resolved relative to the page. If you fork this project and rename the repo, make sure to keep the `vite.config.ts` `base` option (or the deployed path) consistent with the repo name.

In **Settings → Pages**, set:

- **Source:** *Deploy from a branch*
- **Branch:** `gh-pages` / `(root)`

GitHub will assign the site to `https://<owner>.github.io/<repo>/`, which is `https://condorheroblog.github.io/gif-showcase/` for this repo.

## 🛡 Privacy

No upload, no telemetry, no third-party requests beyond the initial bundle. Your GIFs never leave the browser tab.

## 📜 License

MIT.