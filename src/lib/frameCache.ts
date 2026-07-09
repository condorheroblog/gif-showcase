import type { DecodedAnimatedGIFFrame } from "./gif";
import { useEffect, useState } from "react";
import { frameToPngBlob } from "./gif";

type ThumbnailMap = Record<number, string>;

/**
 * Lazily generate PNG blob URLs for each frame and keep them in sync with
 * the input array. Returns a map from frame index to object URL plus a
 * boolean indicating whether every frame is ready.
 */
export function useFrameThumbnails(
	frames: DecodedAnimatedGIFFrame[],
	width: number,
	height: number,
): { thumbnails: ThumbnailMap, readyCount: number, total: number } {
	const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});
	const [readyCount, setReadyCount] = useState(0);

	useEffect(() => {
		const local: ThumbnailMap = {};
		const objectUrls: string[] = [];
		let cancelled = false;
		let generated = 0;

		(async () => {
			for (let i = 0; i < frames.length; i += 1) {
				if (cancelled) {
					return;
				}
				try {
					const blob = await frameToPngBlob(frames[i].pixels, width, height);
					if (cancelled) {
						return;
					}
					const url = URL.createObjectURL(blob);
					local[i] = url;
					objectUrls.push(url);
					generated += 1;
					setReadyCount(generated);
					// Trigger re-render on every thumbnail to keep UI responsive.
					setThumbnails((prev: ThumbnailMap) => ({ ...prev, [i]: url }));
				}
				catch {
					// Skip individual frame failures; continue with the rest.
				}
			}
		})();

		return () => {
			cancelled = true;
			for (const url of objectUrls) {
				URL.revokeObjectURL(url);
			}
		};
		// We intentionally re-run when the underlying frame buffer reference
		// changes (i.e. a new GIF is loaded).
	}, [frames, width, height]);

	return { thumbnails, readyCount, total: frames.length };
}
