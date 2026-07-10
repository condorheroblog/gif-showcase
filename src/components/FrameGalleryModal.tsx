import type { DecodedAnimatedGIFFrame } from "../lib/gif";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type ThumbnailMap = Record<number, string>;

interface FrameGalleryModalProps {
	frames: DecodedAnimatedGIFFrame[]
	thumbnails: ThumbnailMap
	sourceWidth: number
	sourceHeight: number
	cellSize: number
	zoomedIndex: number | null
	selectedIndices: Set<number>
	onEnterZoom: (index: number | null) => void
	onToggleIndex: (index: number) => void
	onSelectAll: () => void
	onInvertSelection: () => void
	onClose: () => void
}

export function FrameGalleryModal({
	frames,
	thumbnails,
	sourceWidth,
	sourceHeight,
	cellSize,
	zoomedIndex,
	selectedIndices,
	onEnterZoom,
	onToggleIndex,
	onSelectAll,
	onInvertSelection,
	onClose,
}: FrameGalleryModalProps) {
	const { t } = useTranslation();
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);
	const dragStateRef = useRef<{ startX: number, startY: number, baseX: number, baseY: number } | null>(null);
	const [zoomScale, setZoomScale] = useState(1);
	const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });

	const resetZoom = () => {
		setZoomScale(1);
		setZoomPan({ x: 0, y: 0 });
	};

	const exitZoom = () => {
		onEnterZoom(null);
		resetZoom();
	};

	const gotoFrame = (index: number) => {
		onEnterZoom(index);
		resetZoom();
	};

	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		closeButtonRef.current?.focus();
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (zoomedIndex !== null) {
					exitZoom();
				}
				else {
					onClose();
				}
				return;
			}
			if (zoomedIndex === null) {
				return;
			}
			if (event.key === "ArrowRight") {
				event.preventDefault();
				gotoFrame(Math.min(frames.length - 1, zoomedIndex + 1));
			}
			else if (event.key === "ArrowLeft") {
				event.preventDefault();
				gotoFrame(Math.max(0, zoomedIndex - 1));
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
		// exitZoom / gotoFrame are stable inline helpers that only depend on props/state
		// already listed (zoomedIndex, onClose) plus the local setZoomScale/setZoomPan setters.
		// eslint-disable-next-line react/exhaustive-deps
	}, [zoomedIndex, frames.length, onClose]);

	const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
		if (zoomedIndex === null) {
			return;
		}
		event.preventDefault();
		const direction = event.deltaY > 0 ? -1 : 1;
		const next = Math.max(1, Math.min(8, zoomScale + direction * 0.25));
		setZoomScale(next);
	};

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (zoomedIndex === null) {
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		dragStateRef.current = {
			startX: event.clientX,
			startY: event.clientY,
			baseX: zoomPan.x,
			baseY: zoomPan.y,
		};
	};

	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const state = dragStateRef.current;
		if (!state) {
			return;
		}
		setZoomPan({
			x: state.baseX + (event.clientX - state.startX),
			y: state.baseY + (event.clientY - state.startY),
		});
	};

	const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		dragStateRef.current = null;
	};

	const stepZoom = (delta: number) => {
		setZoomScale(Math.max(1, Math.min(8, zoomScale + delta)));
	};

	const titleId = "frame-gallery-title";

	return (
		<div
			className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			onClick={onClose}
		>
			<div
				className="fixed inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(96vw,1100px)] sm:max-h-[90vh] sm:rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
				onClick={event => event.stopPropagation()}
			>
				<div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
					<h4 id={titleId} className="text-sm font-semibold truncate">
						{t("editor.galleryTitle")}
					</h4>
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={onSelectAll}
							className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
						>
							{t("editor.selectAll")}
						</button>
						<button
							type="button"
							onClick={onInvertSelection}
							className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
						>
							{t("editor.invertSelection")}
						</button>
						<button
							ref={closeButtonRef}
							type="button"
							onClick={onClose}
							aria-label={t("editor.close")}
							title={t("editor.close")}
							className="rounded-md p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M6 6l12 12M18 6L6 18" />
							</svg>
						</button>
					</div>
				</div>

				{zoomedIndex === null
					? (
						<div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-800/40">
							<div
								className="grid gap-2 sm:gap-3"
								style={{
									gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
								}}
							>
								{frames.map((_frame: DecodedAnimatedGIFFrame, index: number) => {
									const isSelected = selectedIndices.has(index);
									return (
										<button
											key={index}
											type="button"
											onClick={() => onToggleIndex(index)}
											className={[
												"group relative rounded-md overflow-hidden border-2 transition bg-white dark:bg-zinc-900",
												isSelected
													? "border-pink-500 shadow-sm"
													: "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500",
											].join(" ")}
											style={{ aspectRatio: `${sourceWidth} / ${sourceHeight}` }}
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
											{isSelected
												? (
													<>
														{/* Diagonal ribbon hanging from the top-right corner */}
														<span
															aria-hidden="true"
															className="pointer-events-none absolute inset-0"
															style={{
																background:
																	"linear-gradient(135deg, rgba(236, 72, 153, 0.7) 0%, rgba(236, 72, 153, 0.7) 10%, transparent 10%, transparent 100%)",
															}}
														/>
														<span
															aria-hidden="true"
															className="pointer-events-none absolute text-white font-bold"
															style={{
																top: 3,
																right: -22,
																transform: "rotate(45deg)",
																fontSize: 8,
																letterSpacing: "0.3px",
																width: 44,
																textAlign: "center",
																opacity: 0.85,
															}}
														>
															✓
														</span>
													</>
												)
												: null}
											<span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] tabular-nums leading-tight py-0.5 text-center">
												{index + 1}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)
					: (
						<div className="flex-1 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
							<div
								tabIndex={-1}
								className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
								style={{
									backgroundImage:
										"linear-gradient(45deg, #d4d4d8 25%, transparent 25%), linear-gradient(-45deg, #d4d4d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d8 75%), linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)",
									backgroundSize: "20px 20px",
									backgroundPosition: "0 0, 0 10px, 10px -10px, 10px 0px",
								}}
								onWheel={onWheel}
								onPointerDown={onPointerDown}
								onPointerMove={onPointerMove}
								onPointerUp={onPointerUp}
								onPointerCancel={onPointerUp}
							>
								{thumbnails[zoomedIndex]
									? (
										<img
											src={thumbnails[zoomedIndex]}
											alt={t("preview.frameAlt", { index: zoomedIndex + 1 })}
											draggable={false}
											className="max-w-none max-h-none shadow-lg"
											style={{
												imageRendering: "pixelated",
												transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`,
												transformOrigin: "center center",
												width: sourceWidth,
												height: sourceHeight,
											}}
										/>
									)
									: (
										<div className="w-32 h-32 bg-zinc-300 dark:bg-zinc-700 animate-pulse rounded" />
									)}
							</div>

							<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/70 text-white px-1.5 py-1 text-xs shadow-lg">
								<button
									type="button"
									onClick={() => stepZoom(-0.25)}
									className="w-7 h-7 rounded-full hover:bg-white/10 active:scale-95 transition"
									aria-label="Zoom out"
								>
									−
								</button>
								<span className="tabular-nums w-12 text-center">
									{Math.round(zoomScale * 100)}
									%
								</span>
								<button
									type="button"
									onClick={() => stepZoom(0.25)}
									className="w-7 h-7 rounded-full hover:bg-white/10 active:scale-95 transition"
									aria-label="Zoom in"
								>
									+
								</button>
								<span className="mx-1 h-4 w-px bg-white/20" />
								<button
									type="button"
									onClick={resetZoom}
									className="rounded-full px-2 h-7 hover:bg-white/10 active:scale-95 transition"
								>
									{t("editor.zoomReset")}
								</button>
							</div>

							<div className="absolute bottom-3 right-3 flex items-center gap-1.5">
								<button
									type="button"
									onClick={() => {
										if (zoomedIndex > 0) {
											gotoFrame(zoomedIndex - 1);
										}
									}}
									disabled={zoomedIndex <= 0}
									className="rounded-md bg-black/70 text-white px-3 py-1.5 text-xs font-medium hover:bg-black/80 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{t("editor.prevFrameShort")}
								</button>
								<button
									type="button"
									onClick={() => {
										if (zoomedIndex < frames.length - 1) {
											gotoFrame(zoomedIndex + 1);
										}
									}}
									disabled={zoomedIndex >= frames.length - 1}
									className="rounded-md bg-black/70 text-white px-3 py-1.5 text-xs font-medium hover:bg-black/80 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
								>
									{t("editor.nextFrameShort")}
								</button>
							</div>

							<div className="absolute top-3 left-3 rounded-md bg-black/70 text-white px-2 py-1 text-[11px] tabular-nums">
								{zoomedIndex + 1}
								{" / "}
								{frames.length}
							</div>

							<button
								type="button"
								onClick={exitZoom}
								className="absolute top-3 right-3 rounded-md bg-black/70 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-black/80 active:scale-95 transition"
							>
								←
								{" "}
								{t("editor.galleryTitle")}
							</button>
						</div>
					)}
			</div>
		</div>
	);
}
