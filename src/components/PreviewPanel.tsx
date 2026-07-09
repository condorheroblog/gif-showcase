import type { ChangeEvent } from "react";
import type { DecodedAnimatedGIF, DecodedAnimatedGIFFrame } from "../lib/gif";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrameThumbnails } from "../lib/frameCache";
import { frameToPngBlob, totalDurationSeconds, triggerDownload } from "../lib/gif";
import { useI18n } from "../i18n/I18nProvider";
import { isTranslationKey, type TranslationKey } from "../i18n/translations";

interface PreviewPanelProps {
	decoded: DecodedAnimatedGIF
	fileName: string
}

export function PreviewPanel({ decoded, fileName }: PreviewPanelProps) {
	const { t } = useI18n();
	const { width, height, frames } = decoded;
	const totalDuration = totalDurationSeconds(frames);
	const { thumbnails } = useFrameThumbnails(frames, width, height);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// Keep currentIndex in range whenever frames changes (e.g. after a reset).
	useEffect(() => {
		setCurrentIndex((index: number) => Math.min(index, Math.max(0, frames.length - 1)));
	}, [frames]);

	// Draw the current frame onto the main canvas.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}
		const safePixels = new Uint8ClampedArray(frames[currentIndex].pixels);
		const imageData = new ImageData(safePixels, width, height);
		ctx.putImageData(imageData, 0, 0);
	}, [frames, currentIndex, width, height]);

	// Playback timer.
	useEffect(() => {
		if (!isPlaying) {
			return;
		}
		const currentDelayMs = Math.max(10, Math.round(frames[currentIndex].delay * 1000));
		const timer = window.setTimeout(() => {
			setCurrentIndex((index: number) => (index + 1) % frames.length);
		}, currentDelayMs);
		return () => window.clearTimeout(timer);
	}, [isPlaying, currentIndex, frames]);

	const currentFrameMs = useMemo(() => {
		let ms = 0;
		for (let i = 0; i < currentIndex; i += 1) {
			ms += frames[i].delay * 1000;
		}
		return ms;
	}, [frames, currentIndex]);

	const goPrev = () => {
		setIsPlaying(false);
		setCurrentIndex((index: number) => (index - 1 + frames.length) % frames.length);
	};

	const goNext = () => {
		setIsPlaying(false);
		setCurrentIndex((index: number) => (index + 1) % frames.length);
	};

	const togglePlay = () => {
		setIsPlaying((playing: boolean) => !playing);
	};

	const onScrub = (event: ChangeEvent<HTMLInputElement>) => {
		setIsPlaying(false);
		setCurrentIndex(Number(event.target.value));
	};

	const handleDownloadFrame = async () => {
		try {
			const blob = await frameToPngBlob(frames[currentIndex].pixels, width, height);
			const base = fileName.replace(/\.gif$/i, "");
			triggerDownload(blob, `${base}-frame-${String(currentIndex + 1).padStart(3, "0")}.png`);
		}
		catch (error) {
			const raw = error instanceof Error ? error.message : "";
			const fallback = t("preview.downloadFail");
			const message = isTranslationKey(raw) ? t(raw as TranslationKey) : (raw || fallback);
			window.alert(t("preview.exportError", { message }));
		}
	};

	return (
		<section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-5 space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-base sm:text-lg font-semibold">{t("preview.title")}</h3>
				<span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
					{t("preview.frameIndex", { index: currentIndex + 1, total: frames.length })}
				</span>
			</div>

			<div className="flex items-center justify-center rounded-xl bg-[conic-gradient(at_50%_50%,_#f4f4f5,_#e4e4e7,_#f4f4f5)] dark:bg-[conic-gradient(at_50%_50%,_#18181b,_#27272a,_#18181b)] p-3 sm:p-4">
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					className="max-w-full max-h-[60vh] h-auto block rounded-lg shadow"
					style={{ imageRendering: "pixelated" }}
				/>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-2">
				<button
					type="button"
					onClick={goPrev}
					className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
				>
					{t("preview.prevFrame")}
				</button>
				<button
					type="button"
					onClick={togglePlay}
					className={[
						"rounded-lg px-4 py-1.5 text-sm font-semibold text-white active:scale-[0.98] transition shadow",
						isPlaying
							? "bg-zinc-700 hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
							: "bg-indigo-500 hover:bg-indigo-600",
					].join(" ")}
				>
					{isPlaying ? t("preview.pause") : t("preview.play")}
				</button>
				<button
					type="button"
					onClick={goNext}
					className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
				>
					{t("preview.nextFrame")}
				</button>
				<button
					type="button"
					onClick={handleDownloadFrame}
					className="rounded-lg border border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 px-3 py-1.5 text-sm font-medium hover:bg-pink-50 dark:hover:bg-pink-950/30 active:scale-[0.98] transition"
				>
					{t("preview.saveFrame")}
				</button>
			</div>

			<div className="text-center text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
				{t("preview.frameTiming", {
					ms: Math.round(currentFrameMs),
					total: Math.round(totalDuration * 1000),
					delay: Math.round(frames[currentIndex].delay * 1000),
				})}
			</div>

			<div>
				<div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
					<span>{t("preview.timelineLabel")}</span>
					<span className="tabular-nums">
						{currentIndex + 1}
						{" / "}
						{frames.length}
					</span>
				</div>
				<div className="relative">
					<div
						className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40 p-2"
						style={{ touchAction: "pan-y" }}
					>
						<div className="flex gap-1.5 min-w-min">
							{frames.map((_frame: DecodedAnimatedGIFFrame, index: number) => (
								<button
									key={index}
									type="button"
									onClick={() => {
										setIsPlaying(false);
										setCurrentIndex(index);
									}}
									className={[
										"relative shrink-0 rounded-md overflow-hidden border-2 transition",
										index === currentIndex
											? "border-indigo-500 shadow-md scale-[1.05]"
											: "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600",
									].join(" ")}
									style={{ width: 48, height: 48 * (height / width) }}
									title={t("preview.frameTitle", {
										index: index + 1,
										delay: Math.round(frames[index].delay * 1000),
									})}
								>
									{thumbnails[index]
										? (
											<img
												src={thumbnails[index]}
												alt={t("preview.frameAlt", { index: index + 1 })}
												className="w-full h-full object-cover"
												draggable={false}
											/>
										)
										: (
											<div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
										)}
									<span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] tabular-nums leading-tight py-0.5">
										{index + 1}
									</span>
								</button>
							))}
						</div>
					</div>
					<input
						type="range"
						min={0}
						max={Math.max(0, frames.length - 1)}
						step={1}
						value={currentIndex}
						onChange={onScrub}
						aria-label={t("preview.timelineAria")}
						className="mt-2 w-full"
					/>
				</div>
			</div>
		</section>
	);
}
