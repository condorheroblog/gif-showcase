import type { ViewMode } from "../hooks/useGif";
import type { DecodedAnimatedGIF } from "../lib/gif";
import { useTranslation } from "react-i18next";
import {
	averageFps,

	formatBytes,
	totalDurationSeconds,
} from "../lib/gif";

interface InfoPanelProps {
	file: File
	decoded: DecodedAnimatedGIF
	viewMode: ViewMode
	onChangeViewMode: (mode: ViewMode) => void
}

function Stat({ label, value }: { label: string, value: string }) {
	return (
		<div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
			<div className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
				{label}
			</div>
			<div className="mt-0.5 text-sm sm:text-base font-semibold break-all">{value}</div>
		</div>
	);
}

export function InfoPanel({ file, decoded, viewMode, onChangeViewMode }: InfoPanelProps) {
	const { t } = useTranslation();
	const totalDuration = totalDurationSeconds(decoded.frames);
	const fps = averageFps(decoded.frames);
	const loopLabel
		= decoded.playCount === undefined
			? t("info.loopDefault")
			: decoded.playCount === "forever"
				? t("info.loopForever")
				: t("info.loopTimes", { count: decoded.playCount });

	return (
		<section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-5">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-2 min-w-0">
						<h2 className="text-base sm:text-lg font-semibold truncate" title={file.name}>
							{file.name}
						</h2>
					</div>
					<p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
						{t("info.summary", {
							size: formatBytes(file.size),
							count: decoded.frames.length,
							ms: (totalDuration * 1000).toFixed(0),
						})}
					</p>
				</div>

				<div
					role="tablist"
					aria-label={t("info.tablist")}
					className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-700 p-1 bg-zinc-100 dark:bg-zinc-800/60 self-start shrink-0"
				>
					<button
						role="tab"
						aria-selected={viewMode === "preview"}
						onClick={() => onChangeViewMode("preview")}
						className={[
							"rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition active:scale-[0.98]",
							viewMode === "preview"
								? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400"
								: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
						].join(" ")}
					>
						<span className="sm:hidden">▶</span>
						<span className="hidden sm:inline">{t("info.previewTab")}</span>
					</button>
					<button
						role="tab"
						aria-selected={viewMode === "edit"}
						onClick={() => onChangeViewMode("edit")}
						className={[
							"rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition active:scale-[0.98]",
							viewMode === "edit"
								? "bg-white dark:bg-zinc-900 shadow-sm text-pink-600 dark:text-pink-400"
								: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
						].join(" ")}
					>
						<span className="sm:hidden">✎</span>
						<span className="hidden sm:inline">{t("info.editTab")}</span>
					</button>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
				<Stat label={t("info.dimension")} value={`${decoded.width} × ${decoded.height}`} />
				<Stat label={t("info.frameCount")} value={`${decoded.frames.length}`} />
				<Stat label={t("info.totalDuration")} value={`${(totalDuration * 1000).toFixed(0)} ms`} />
				<Stat label={t("info.avgFps")} value={fps > 0 ? fps.toFixed(2) : "—"} />
				<Stat label={t("info.loop")} value={loopLabel} />
				<Stat label={t("info.fileSize")} value={formatBytes(file.size)} />
			</div>
		</section>
	);
}
