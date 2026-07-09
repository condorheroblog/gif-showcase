import type { DecodedAnimatedGIF, DecodedAnimatedGIFFrame, EncodableFrame } from "../lib/gif";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFrameThumbnails } from "../lib/frameCache";
import {

	exportGif,
	resizeRgbaFrames,
	triggerDownload,
} from "../lib/gif";

interface EditorPanelProps {
	decoded: DecodedAnimatedGIF
	fileName: string
}

type LoopMode = "forever" | number;

const MIN_SIZE = 16;
const MAX_SIZE = 4096;

function gcd(a: number, b: number): number {
	return b === 0 ? a : gcd(b, a % b);
}

export function EditorPanel({ decoded, fileName }: EditorPanelProps) {
	const { t } = useTranslation();
	const { width: sourceWidth, height: sourceHeight, frames } = decoded;
	const { thumbnails } = useFrameThumbnails(frames, sourceWidth, sourceHeight);

	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
		return new Set(frames.map((_f: DecodedAnimatedGIFFrame, index: number) => index));
	});
	// Reset selection when frames change (new file loaded).
	const framesRef = useRef(frames);
	useEffect(() => {
		if (framesRef.current !== frames) {
			framesRef.current = frames;
			setSelectedIndices(new Set(frames.map((_, index) => index)));
		}
	}, [frames]);

	const [targetWidth, setTargetWidth] = useState(sourceWidth);
	const [targetHeight, setTargetHeight] = useState(sourceHeight);
	const [lockAspect, setLockAspect] = useState(true);
	const [quality, setQuality] = useState(0.8);
	const [loopMode, setLoopMode] = useState<LoopMode>("forever");
	const [loopCount, setLoopCount] = useState(3);
	const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
	const [isExporting, setIsExporting] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);

	const aspectRatio = sourceWidth / sourceHeight;

	// Keep the target height in sync when width changes with aspect locked.
	useEffect(() => {
		if (lockAspect) {
			setTargetHeight(Math.max(MIN_SIZE, Math.round(targetWidth / aspectRatio)));
		}
	}, [targetWidth, lockAspect, aspectRatio]);

	const selectedFrames: DecodedAnimatedGIFFrame[] = useMemo(() => {
		const result: DecodedAnimatedGIFFrame[] = [];
		for (let i = 0; i < frames.length; i += 1) {
			if (selectedIndices.has(i)) {
				result.push(frames[i]);
			}
		}
		return result;
	}, [frames, selectedIndices]);

	const selectedCount = selectedIndices.size;
	const totalCount = frames.length;

	const toggleIndex = (index: number) => {
		setSelectedIndices((prev: Set<number>) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			}
			else {
				next.add(index);
			}
			return next;
		});
	};

	const selectAll = () => {
		setSelectedIndices(new Set(frames.map((_f: DecodedAnimatedGIFFrame, i: number) => i)));
	};

	const invertSelection = () => {
		setSelectedIndices((prev: Set<number>) => {
			const next = new Set<number>();
			for (let i = 0; i < frames.length; i += 1) {
				if (!prev.has(i)) {
					next.add(i);
				}
			}
			return next;
		});
	};

	// Play the preview at the configured frame rate.
	useEffect(() => {
		if (selectedFrames.length === 0) {
			return;
		}
		const index = previewFrameIndex % selectedFrames.length;
		setPreviewFrameIndex(index);
		const timer = window.setTimeout(() => {
			setPreviewFrameIndex(i => (i + 1) % selectedFrames.length);
		}, Math.max(20, Math.round(selectedFrames[index].delay * 1000)));
		return () => window.clearTimeout(timer);
	}, [previewFrameIndex, selectedFrames]);

	// Draw the current preview frame at the target resolution.
	const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
	useEffect(() => {
		const canvas = previewCanvasRef.current;
		if (!canvas || selectedFrames.length === 0) {
			return;
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}
		const frame = selectedFrames[previewFrameIndex % selectedFrames.length];
		const imageData = new ImageData(
			new Uint8ClampedArray(frame.pixels),
			sourceWidth,
			sourceHeight,
		);
		// Build a temporary canvas at source size, blit, then draw scaled.
		const scratch = document.createElement("canvas");
		scratch.width = sourceWidth;
		scratch.height = sourceHeight;
		const sctx = scratch.getContext("2d");
		if (!sctx) {
			return;
		}
		sctx.putImageData(imageData, 0, 0);
		ctx.clearRect(0, 0, targetWidth, targetHeight);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";
		ctx.drawImage(scratch, 0, 0, targetWidth, targetHeight);
	}, [previewFrameIndex, selectedFrames, sourceWidth, sourceHeight, targetWidth, targetHeight]);

	const playCount: number | "forever"
		= typeof loopMode === "number" ? Math.max(1, Math.floor(loopCount)) : "forever";

	const onExport = async () => {
		setExportError(null);
		if (selectedFrames.length === 0) {
			setExportError(t("editor.keepOneFrame"));
			return;
		}
		if (targetWidth < MIN_SIZE || targetHeight < MIN_SIZE) {
			setExportError(t("editor.sizeTooSmall", { min: MIN_SIZE }));
			return;
		}
		setIsExporting(true);
		try {
			const resized: EncodableFrame[] = await resizeRgbaFrames(
				selectedFrames,
				sourceWidth,
				sourceHeight,
				targetWidth,
				targetHeight,
			);
			const blob = await exportGif(resized, {
				width: targetWidth,
				height: targetHeight,
				quality,
				playCount,
			});
			const base = fileName.replace(/\.gif$/i, "");
			triggerDownload(blob, `${base}-edited.gif`);
		}
		catch (error) {
			const raw = error instanceof Error ? error.message : "";
			setExportError(raw || t("editor.exportFail"));
		}
		finally {
			setIsExporting(false);
		}
	};

	// Calculate the GCD of selected frame dimensions to suggest step.
	const stepHint = useMemo(() => {
		const g = gcd(sourceWidth, sourceHeight);
		return Math.max(1, Math.round(g));
	}, [sourceWidth, sourceHeight]);

	return (
		<section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-5 space-y-5">
			<div className="flex items-center justify-between">
				<h3 className="text-base sm:text-lg font-semibold">{t("editor.title")}</h3>
				<span className="text-xs text-zinc-500 dark:text-zinc-400">
					{t("editor.selected", { selected: selectedCount, total: totalCount })}
				</span>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium">{t("editor.frameSelection")}</span>
						<div className="flex gap-1.5">
							<button
								type="button"
								onClick={selectAll}
								className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
							>
								{t("editor.selectAll")}
							</button>
							<button
								type="button"
								onClick={invertSelection}
								className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
							>
								{t("editor.invertSelection")}
							</button>
						</div>
					</div>
					<div
						className="grid gap-1.5 overflow-y-auto p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700"
						style={{
							gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
							maxHeight: 280,
						}}
					>
						{frames.map((_frame: DecodedAnimatedGIFFrame, index: number) => {
							const checked = selectedIndices.has(index);
							return (
								<label
									key={index}
									className={[
										"relative rounded-md overflow-hidden border-2 cursor-pointer transition",
										checked
											? "border-pink-500 shadow-sm"
											: "border-zinc-200 dark:border-zinc-700 opacity-40",
									].join(" ")}
									style={{ aspectRatio: `${sourceWidth} / ${sourceHeight}` }}
									title={t("preview.frameTitle", {
										index: index + 1,
										delay: Math.round(frames[index].delay * 1000),
									})}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() => toggleIndex(index)}
									/>
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
									<span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center h-4 w-4 rounded-sm bg-black/60 text-white text-[10px]">
										{checked ? "✓" : "✕"}
									</span>
									<span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] tabular-nums leading-tight py-0.5 text-center">
										{index + 1}
									</span>
								</label>
							);
						})}
					</div>
				</div>

				<div className="space-y-4">
					<div>
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium">{t("editor.dimension")}</span>
							<label className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
								<input
									type="checkbox"
									checked={lockAspect}
									onChange={event => setLockAspect(event.target.checked)}
									className="rounded"
								/>
								{t("editor.lockAspect")}
							</label>
						</div>
						<div className="flex items-center gap-2">
							<div className="flex-1">
								<label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
									{t("editor.width")}
								</label>
								<input
									type="number"
									min={MIN_SIZE}
									max={MAX_SIZE}
									step={stepHint}
									value={targetWidth}
									onChange={(event) => {
										const next = Number(event.target.value);
										if (Number.isFinite(next)) {
											setTargetWidth(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(next))));
										}
									}}
									className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>
							<div className="flex-1">
								<label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
									{t("editor.height")}
								</label>
								<input
									type="number"
									min={MIN_SIZE}
									max={MAX_SIZE}
									step={stepHint}
									value={targetHeight}
									onChange={(event) => {
										const next = Number(event.target.value);
										if (Number.isFinite(next)) {
											setTargetHeight(Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(next))));
											setLockAspect(false);
										}
									}}
									className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
								/>
							</div>
						</div>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{[0.5, 0.75, 1, 1.5, 2].map(factor => (
								<button
									key={factor}
									type="button"
									onClick={() => {
										setTargetWidth(Math.max(MIN_SIZE, Math.round(sourceWidth * factor)));
										setLockAspect(true);
									}}
									className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
								>
									{factor === 1 ? t("editor.original") : `${factor * 100}%`}
								</button>
							))}
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1">
							<span className="text-sm font-medium">{t("editor.quality")}</span>
							<span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
								{quality.toFixed(2)}
							</span>
						</div>
						<input
							type="range"
							min={0.1}
							max={1}
							step={0.05}
							value={quality}
							onChange={event => setQuality(Number(event.target.value))}
							className="w-full"
						/>
						<p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
							{t("editor.qualityHint")}
						</p>
					</div>

					<div>
						<span className="text-sm font-medium">{t("editor.loop")}</span>
						<div className="mt-1 flex gap-2 items-center flex-wrap">
							<label className="inline-flex items-center gap-1 text-sm">
								<input
									type="radio"
									name="loop"
									checked={loopMode === "forever"}
									onChange={() => setLoopMode("forever")}
									className="rounded"
								/>
								{t("editor.loopForever")}
							</label>
							<label className="inline-flex items-center gap-1 text-sm">
								<input
									type="radio"
									name="loop"
									checked={loopMode !== "forever"}
									onChange={() => setLoopMode(3)}
									className="rounded"
								/>
								{t("editor.loopCount")}
							</label>
							{typeof loopMode === "number"
								? (
									<input
										type="number"
										min={1}
										max={65536}
										value={loopCount}
										onChange={(event) => {
											const next = Number(event.target.value);
											if (Number.isFinite(next)) {
												setLoopCount(Math.max(1, Math.min(65536, Math.round(next))));
											}
										}}
										className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
									/>
								)
								: null}
						</div>
					</div>
				</div>
			</div>

			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium">{t("editor.livePreview")}</span>
					<span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
						{targetWidth}
						{" × "}
						{targetHeight}
					</span>
				</div>
				<div className="flex items-center justify-center rounded-xl bg-[conic-gradient(at_50%_50%,_#f4f4f5,_#e4e4e7,_#f4f4f5)] dark:bg-[conic-gradient(at_50%_50%,_#18181b,_#27272a,_#18181b)] p-3 sm:p-4">
					{selectedFrames.length > 0
						? (
							<canvas
								ref={previewCanvasRef}
								width={targetWidth}
								height={targetHeight}
								className="max-w-full max-h-[40vh] h-auto block rounded-lg shadow"
								style={{ imageRendering: "pixelated" }}
							/>
						)
						: (
							<div className="h-32 flex items-center justify-center text-sm text-zinc-500">
								{t("editor.noFrame")}
							</div>
						)}
				</div>
			</div>

			{exportError
				? (
					<p className="rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
						{exportError}
					</p>
				)
				: null}

			<div className="flex justify-end">
				<button
					type="button"
					onClick={onExport}
					disabled={isExporting || selectedCount === 0}
					className={[
						"rounded-xl px-5 py-2 text-sm font-semibold text-white shadow active:scale-[0.98] transition",
						isExporting || selectedCount === 0
							? "bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed"
							: "bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90",
					].join(" ")}
				>
					{isExporting ? t("editor.exporting") : t("editor.export")}
				</button>
			</div>
		</section>
	);
}
