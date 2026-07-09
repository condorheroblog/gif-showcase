import type { DecodedAnimatedGIF } from "../lib/gif";
import { useCallback, useReducer } from "react";
import { decodeGif, loadGifBytes } from "../lib/gif";

export type ViewMode = "preview" | "edit";

export interface LoadedGif {
	file: File
	decoded: DecodedAnimatedGIF
	// Indices the user wants to keep in the editor. null means "keep all".
	selectedFrameIndices: Set<number> | null
}

type State
	= | { status: "idle" }
	  | { status: "loading", file: File }
	  | { status: "ready", loaded: LoadedGif, viewMode: ViewMode }
	  | { status: "error", message: string };

type Action
	= | { type: "load-start", file: File }
	  | { type: "load-success", loaded: LoadedGif }
	  | { type: "load-error", message: string }
	  | { type: "set-view-mode", mode: ViewMode }
	  | { type: "set-selected-frames", indices: Set<number> | null }
	  | { type: "reset" };

const initialState: State = { status: "idle" };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "load-start":
			return { status: "loading", file: action.file };
		case "load-success":
			return {
				status: "ready",
				loaded: action.loaded,
				viewMode: "preview",
			};
		case "load-error":
			return { status: "error", message: action.message };
		case "set-view-mode":
			if (state.status !== "ready") {
				return state;
			}
			return { ...state, viewMode: action.mode };
		case "set-selected-frames":
			if (state.status !== "ready") {
				return state;
			}
			return {
				...state,
				loaded: { ...state.loaded, selectedFrameIndices: action.indices },
			};
		case "reset":
			return initialState;
		default:
			return state;
	}
}

export function useGif(): {
	state: State
	loadFromFile: (file: File) => Promise<void>
	setViewMode: (mode: ViewMode) => void
	setSelectedFrames: (indices: Set<number> | null) => void
	reset: () => void
} {
	const [state, dispatch] = useReducer(reducer, initialState);

	const loadFromFile = useCallback(async (file: File) => {
		dispatch({ type: "load-start", file });
		try {
			const bytes = await loadGifBytes(file);
			const decoded = decodeGif(bytes);
			if (decoded.frames.length === 0) {
				dispatch({ type: "load-error", message: "upload.emptyFile" });
				return;
			}
			dispatch({
				type: "load-success",
				loaded: { file, decoded, selectedFrameIndices: null },
			});
		}
		catch {
			dispatch({ type: "load-error", message: "upload.parseError" });
		}
	}, []);

	const setViewMode = useCallback((mode: ViewMode) => {
		dispatch({ type: "set-view-mode", mode });
	}, []);

	const setSelectedFrames = useCallback((indices: Set<number> | null) => {
		dispatch({ type: "set-selected-frames", indices });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "reset" });
	}, []);

	return { state, loadFromFile, setViewMode, setSelectedFrames, reset };
}
