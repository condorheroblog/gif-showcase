import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { useI18n } from "../i18n/I18nProvider";

interface UploadZoneProps {
	onFile: (file: File) => void
	errorMessage?: string
	disabled?: boolean
}

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function UploadZone({ onFile, errorMessage, disabled }: UploadZoneProps) {
	const { t } = useI18n();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);

	const handleFile = useCallback(
		(file: File | null | undefined) => {
			setLocalError(null);
			if (!file) {
				return;
			}
			if (file.size > MAX_BYTES) {
				setLocalError(t("upload.fileTooLarge", { size: (file.size / 1024 / 1024).toFixed(1) }));
				return;
			}
			onFile(file);
		},
		[onFile, t],
	);

	const handleInput = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			handleFile(event.target.files?.[0]);
			// Reset so the same file can be re-selected.
			event.target.value = "";
		},
		[handleFile],
	);

	const handleDrop = useCallback(
		(event: DragEvent<HTMLLabelElement>) => {
			event.preventDefault();
			setIsDragging(false);
			if (disabled) {
				return;
			}
			handleFile(event.dataTransfer.files?.[0]);
		},
		[handleFile, disabled],
	);

	const error = localError ?? errorMessage;

	return (
		<div className="w-full max-w-2xl mx-auto">
			<label
				onDragOver={(event) => {
					event.preventDefault();
					if (!disabled) {
						setIsDragging(true);
					}
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				className={[
					"flex flex-col items-center justify-center gap-4",
					"rounded-2xl border-2 border-dashed",
					"px-8 py-16 sm:py-20 text-center cursor-pointer select-none",
					"transition-all duration-200",
					isDragging
						? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]"
						: "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-indigo-400 dark:hover:border-indigo-500",
					disabled ? "opacity-50 cursor-not-allowed" : "",
				].join(" ")}
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/gif"
					className="hidden"
					onChange={handleInput}
					disabled={disabled}
				/>
				<img
					src="/logo.svg"
					alt=""
					width={64}
					height={64}
					className="h-16 w-16 rounded-2xl shadow-lg"
				/>
				<div>
					<p className="text-lg sm:text-xl font-semibold">
						{t("upload.prompt")}
						{" "}
						<span className="text-indigo-500">{t("upload.promptAction")}</span>
					</p>
					<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
						{t("upload.hint")}
					</p>
				</div>
				{error
					? (
						<p className="rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
							{error}
						</p>
					)
					: null}
			</label>
		</div>
	);
}
