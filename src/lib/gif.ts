import type { DecodedAnimatedGIF, DecodedAnimatedGIFFrame } from "@sindresorhus/gifkit";
import {
	decodeAnimatedGIF,
	encodeAnimatedGIF,

} from "@sindresorhus/gifkit";

export type { DecodedAnimatedGIF, DecodedAnimatedGIFFrame };

export interface EncodableFrame {
	pixels: Uint8ClampedArray
	delay: number
}

export async function loadGifBytes(file: File): Promise<Uint8Array> {
	const buffer = await file.arrayBuffer();
	return new Uint8Array(buffer);
}

export function decodeGif(bytes: Uint8Array): DecodedAnimatedGIF {
	return decodeAnimatedGIF(bytes);
}

/** Write RGBA pixels to a canvas and return a PNG Blob. */
export async function frameToPngBlob(
	pixels: Uint8ClampedArray,
	width: number,
	height: number,
): Promise<Blob> {
	// Copy the source buffer to a fresh ArrayBuffer-backed Uint8ClampedArray
	// to satisfy strict TS lib types.
	const safePixels = new Uint8ClampedArray(pixels);
	const imageData = new ImageData(safePixels, width, height);

	if (typeof OffscreenCanvas !== "undefined") {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Failed to acquire 2D context.");
		}
		ctx.putImageData(imageData, 0, 0);
		return canvas.convertToBlob({ type: "image/png" });
	}

	return new Promise<Blob>((resolve, reject) => {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			reject(new Error("Failed to acquire 2D context."));
			return;
		}
		ctx.putImageData(imageData, 0, 0);
		canvas.toBlob((blob) => {
			if (blob) {
				resolve(blob);
			}
			else {
				reject(new Error("Failed to convert canvas to blob."));
			}
		}, "image/png");
	});
}

/**
 * Resize every decoded RGBA frame to `newWidth × newHeight`. The caller
 * supplies the original logical-screen size because gifkit's animated frame
 * type only carries `pixels` + `delay`.
 */
export async function resizeRgbaFrames(
	frames: DecodedAnimatedGIFFrame[],
	sourceWidth: number,
	sourceHeight: number,
	newWidth: number,
	newHeight: number,
): Promise<EncodableFrame[]> {
	if (newWidth <= 0 || newHeight <= 0) {
		throw new Error("Width and height must be positive integers.");
	}
	if (sourceWidth <= 0 || sourceHeight <= 0) {
		throw new Error("Source width and height must be positive integers.");
	}

	const targetWidth = Math.max(1, Math.round(newWidth));
	const targetHeight = Math.max(1, Math.round(newHeight));

	const useOffscreen = typeof OffscreenCanvas !== "undefined";

	const makeCanvas = (w: number, h: number) => {
		if (useOffscreen) {
			return new OffscreenCanvas(w, h) as unknown as {
				getContext: (
					id: "2d",
					opts?: unknown,
				) => OffscreenCanvasRenderingContext2D | null
				width: number
				height: number
			};
		}
		const c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		return c as unknown as HTMLCanvasElement;
	};

	const sourceCanvas = makeCanvas(sourceWidth, sourceHeight);
	const targetCanvas = makeCanvas(targetWidth, targetHeight);

	const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true }) as
	  | OffscreenCanvasRenderingContext2D
	  | CanvasRenderingContext2D
	  | null;
	const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true }) as
	  | OffscreenCanvasRenderingContext2D
	  | CanvasRenderingContext2D
	  | null;
	if (!sourceCtx || !targetCtx) {
		throw new Error("Failed to acquire 2D context for resize.");
	}

	const out: EncodableFrame[] = [];
	const targetPixels = new Uint8ClampedArray(targetWidth * targetHeight * 4);

	for (const frame of frames) {
		const imageData = new ImageData(
			new Uint8ClampedArray(frame.pixels),
			sourceWidth,
			sourceHeight,
		);
		sourceCtx.putImageData(imageData, 0, 0);
		targetCtx.imageSmoothingEnabled = true;
		targetCtx.imageSmoothingQuality = "high";
		targetCtx.clearRect(0, 0, targetWidth, targetHeight);
		targetCtx.drawImage(
			sourceCanvas as unknown as CanvasImageSource,
			0,
			0,
			targetWidth,
			targetHeight,
		);
		const result = targetCtx.getImageData(0, 0, targetWidth, targetHeight);
		targetPixels.set(result.data);
		out.push({ pixels: new Uint8ClampedArray(targetPixels), delay: frame.delay });
	}

	return out;
}

export interface ExportOptions {
	width: number
	height: number
	quality: number
	playCount: number | "forever"
}

export async function exportGif(
	frames: EncodableFrame[],
	options: ExportOptions,
): Promise<Blob> {
	if (frames.length === 0) {
		throw new Error("没有可导出的帧。");
	}

	const width = Math.max(1, Math.round(options.width));
	const height = Math.max(1, Math.round(options.height));
	const clampedQuality = Math.min(1, Math.max(0, options.quality));

	const encodeOptions: Parameters<typeof encodeAnimatedGIF>[1] = {
		width,
		height,
		quality: clampedQuality,
	};

	if (options.playCount !== undefined) {
		encodeOptions.playCount = options.playCount;
	}

	// Per-frame delays preserve the original timing of each frame.
	const input = frames.map(frame => ({
		pixels: frame.pixels,
		delay: frame.delay,
	}));

	const bytes = encodeAnimatedGIF(input, encodeOptions);
	// The encoder returns a `Uint8Array<ArrayBufferLike>` which TS 5.7+ won't
	// accept directly as a BlobPart. Copy into a fresh ArrayBuffer to satisfy
	// the lib type.
	const buffer = new Uint8Array(bytes);
	return new Blob([buffer.buffer], { type: "image/gif" });
}

export function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDelayMs(seconds: number): string {
	return `${Math.round(seconds * 1000)} ms`;
}

export function totalDurationSeconds(frames: DecodedAnimatedGIFFrame[]): number {
	return frames.reduce((acc, frame) => acc + frame.delay, 0);
}

export function averageFps(frames: DecodedAnimatedGIFFrame[]): number {
	const total = totalDurationSeconds(frames);
	if (total === 0) {
		return 0;
	}
	return frames.length / total;
}
