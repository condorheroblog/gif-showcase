export type Locale = "zh-CN" | "en-US";

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en-US"];

export const LOCALE_LABELS: Record<Locale, string> = {
	"zh-CN": "中文",
	"en-US": "English",
};

type TranslationParams = Record<string, string | number>;

const translations = {
	"zh-CN": {
		// Header
		"header.title": "GIF Showcase",
		"header.subtitle": "基于 {{lib}} 的演示",
		"header.reset": "重新上传",
		"header.toggleTheme": "切换明暗模式",
		"header.github": "GitHub ↗",
		"header.language": "切换语言",

		// App
		"app.heroTitle": "一个超轻量的",
		"app.heroSubtitle": "在线演示",
		"app.heroDescription": "全部在浏览器中完成解码、预览与重新编码，基于 {{lib}}。",
		"app.loading": "正在解析 GIF…",
		"app.footer": "纯前端演示，不会上传文件",

		// Upload
		"upload.prompt": "拖拽 GIF 到此处，或",
		"upload.promptAction": "点击选择文件",
		"upload.hint": "支持 .gif 格式 · 最大 20 MB · 文件不会上传到服务器",
		"upload.fileTooLarge": "文件太大（{{size}} MB），最大支持 20 MB。",
		"upload.emptyFile": "GIF 不包含任何帧。",
		"upload.parseError": "无法解析该 GIF 文件。",

		// InfoPanel
		"info.tablist": "面板切换",
		"info.previewTab": "▶ 预览",
		"info.editTab": "✎ 编辑",
		"info.summary": "{{size}} · {{count}} 帧 · 总时长 {{ms}} ms",
		"info.dimension": "尺寸",
		"info.frameCount": "帧数",
		"info.totalDuration": "总时长",
		"info.avgFps": "平均 fps",
		"info.loop": "循环",
		"info.fileSize": "文件大小",
		"info.loopDefault": "默认（不循环）",
		"info.loopForever": "无限循环",
		"info.loopTimes": "{{count}} 次",

		// PreviewPanel
		"preview.title": "预览",
		"preview.frameIndex": "帧 {{index}} / {{total}}",
		"preview.prevFrame": "⏮ 上一帧",
		"preview.nextFrame": "下一帧 ⏭",
		"preview.play": "▶ 播放",
		"preview.pause": "⏸ 暂停",
		"preview.saveFrame": "⬇ 保存当前帧",
		"preview.frameTiming": "{{ms}} ms / {{total}} ms · 帧间隔 {{delay}} ms",
		"preview.timelineLabel": "时间线（拖动跳到指定帧）",
		"preview.timelineAria": "帧时间线",
		"preview.frameTitle": "帧 {{index}} · {{delay}} ms",
		"preview.frameAlt": "帧 {{index}}",
		"preview.exportError": "无法导出当前帧：{{message}}",
		"preview.downloadFail": "下载失败",

		// EditorPanel
		"editor.title": "编辑",
		"editor.selected": "已选 {{selected}} / {{total}} 帧",
		"editor.frameSelection": "帧选择",
		"editor.selectAll": "全选",
		"editor.invertSelection": "反选",
		"editor.keepOneFrame": "请至少保留一帧。",
		"editor.sizeTooSmall": "尺寸不能小于 {{min}}px。",
		"editor.exportFail": "导出失败",
		"editor.dimension": "尺寸",
		"editor.width": "宽",
		"editor.height": "高",
		"editor.lockAspect": "锁定宽高比",
		"editor.original": "原始",
		"editor.quality": "压缩质量",
		"editor.qualityHint": "越低压缩越狠（颜色量化更激进），越高越接近原画质。",
		"editor.loop": "循环",
		"editor.loopForever": "无限",
		"editor.loopCount": "指定次数",
		"editor.livePreview": "实时预览",
		"editor.noFrame": "请至少保留一帧",
		"editor.exporting": "正在生成…",
		"editor.export": "⬇ 保存为新 GIF",
	},
	"en-US": {
		// Header
		"header.title": "GIF Showcase",
		"header.subtitle": "A demo built on {{lib}}",
		"header.reset": "Re-upload",
		"header.toggleTheme": "Toggle light/dark mode",
		"header.github": "GitHub ↗",
		"header.language": "Switch language",

		// App
		"app.heroTitle": "A super lightweight",
		"app.heroSubtitle": "online demo",
		"app.heroDescription": "Decode, preview and re-encode right in your browser, powered by {{lib}}.",
		"app.loading": "Parsing GIF…",
		"app.footer": "Pure front-end demo. No files are uploaded.",

		// Upload
		"upload.prompt": "Drop a GIF here, or",
		"upload.promptAction": "click to choose a file",
		"upload.hint": ".gif only · up to 20 MB · files never leave your browser",
		"upload.fileTooLarge": "File is too large ({{size}} MB). Maximum is 20 MB.",
		"upload.emptyFile": "The GIF contains no frames.",
		"upload.parseError": "Unable to parse this GIF file.",

		// InfoPanel
		"info.tablist": "Panel switcher",
		"info.previewTab": "▶ Preview",
		"info.editTab": "✎ Edit",
		"info.summary": "{{size}} · {{count}} frames · total {{ms}} ms",
		"info.dimension": "Size",
		"info.frameCount": "Frames",
		"info.totalDuration": "Duration",
		"info.avgFps": "Avg fps",
		"info.loop": "Loop",
		"info.fileSize": "File size",
		"info.loopDefault": "Default (no loop)",
		"info.loopForever": "Forever",
		"info.loopTimes": "{{count}} times",

		// PreviewPanel
		"preview.title": "Preview",
		"preview.frameIndex": "Frame {{index}} / {{total}}",
		"preview.prevFrame": "⏮ Previous",
		"preview.nextFrame": "Next ⏭",
		"preview.play": "▶ Play",
		"preview.pause": "⏸ Pause",
		"preview.saveFrame": "⬇ Save current frame",
		"preview.frameTiming": "{{ms}} ms / {{total}} ms · frame delay {{delay}} ms",
		"preview.timelineLabel": "Timeline (drag to jump to a frame)",
		"preview.timelineAria": "Frame timeline",
		"preview.frameTitle": "Frame {{index}} · {{delay}} ms",
		"preview.frameAlt": "Frame {{index}}",
		"preview.exportError": "Failed to export the current frame: {{message}}",
		"preview.downloadFail": "Download failed",

		// EditorPanel
		"editor.title": "Edit",
		"editor.selected": "{{selected}} / {{total}} frames selected",
		"editor.frameSelection": "Frame selection",
		"editor.selectAll": "Select all",
		"editor.invertSelection": "Invert",
		"editor.keepOneFrame": "Please keep at least one frame.",
		"editor.sizeTooSmall": "Size must be at least {{min}}px.",
		"editor.exportFail": "Export failed",
		"editor.dimension": "Size",
		"editor.width": "Width",
		"editor.height": "Height",
		"editor.lockAspect": "Lock aspect ratio",
		"editor.original": "Original",
		"editor.quality": "Quality",
		"editor.qualityHint": "Lower values compress harder (more aggressive color quantization); higher values stay closer to the original.",
		"editor.loop": "Loop",
		"editor.loopForever": "Forever",
		"editor.loopCount": "Times",
		"editor.livePreview": "Live preview",
		"editor.noFrame": "Please keep at least one frame",
		"editor.exporting": "Generating…",
		"editor.export": "⬇ Save as new GIF",
	},
} as const;

export type TranslationKey = keyof typeof translations["zh-CN"];

const ZH_KEYS = new Set<string>(Object.keys(translations["zh-CN"]));

export function isTranslationKey(value: string): value is TranslationKey {
	return ZH_KEYS.has(value);
}

function interpolate(template: string, params?: TranslationParams): string {
	if (!params) {
		return template;
	}
	return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
		if (Object.prototype.hasOwnProperty.call(params, key)) {
			return String(params[key]);
		}
		return match;
	});
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
	const dict = translations[locale] as Record<string, string>;
	const value = dict[key];
	if (value === undefined) {
		// Fall back to default locale to avoid showing raw keys.
		const fallback = translations[DEFAULT_LOCALE] as Record<string, string>;
		return interpolate(fallback[key] ?? key, params);
	}
	return interpolate(value, params);
}
