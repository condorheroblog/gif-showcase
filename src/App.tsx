import type { ErrorKey } from "./lib/errorKey";
import { useTranslation } from "react-i18next";
import { EditorPanel } from "./components/EditorPanel";
import { Header } from "./components/Header";
import { InfoPanel } from "./components/InfoPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { UploadZone } from "./components/UploadZone";
import { useGif } from "./hooks/useGif";
import { useTheme } from "./hooks/useTheme";
import { useLanguageSync } from "./i18n/useLanguageSync";
import { isErrorKey } from "./lib/errorKey";

function App() {
	const { theme, toggleTheme } = useTheme();
	const { state, loadFromFile, setViewMode, reset } = useGif();
	const { t } = useTranslation();
	useLanguageSync();

	const errorText = state.status === "error"
		? (isErrorKey(state.message) ? t(state.message as ErrorKey) : state.message)
		: undefined;

	return (
		<div className="min-h-screen flex flex-col">
			<Header
				theme={theme}
				onToggleTheme={toggleTheme}
				showReset={state.status === "ready"}
				onReset={reset}
			/>

			<main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
				{state.status === "idle" || state.status === "error"
					? (
						<div className="space-y-4">
							<div className="text-center pt-4 sm:pt-8">
								<h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
									{t("app.heroTitle")}
									{" "}
									<span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
										GIF
									</span>
									{" "}
									{t("app.heroSubtitle")}
								</h2>
								<p className="mt-2 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
									{t("app.heroDescription", { lib: "@sindresorhus/gifkit" })}
								</p>
							</div>
							<UploadZone
								onFile={loadFromFile}
								errorMessage={errorText}
							/>
						</div>
					)
					: null}

				{state.status === "loading"
					? (
						<div className="flex items-center justify-center py-20 text-zinc-500 dark:text-zinc-400">
							<div className="flex items-center gap-3">
								<div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
								{t("app.loading")}
							</div>
						</div>
					)
					: null}

				{state.status === "ready"
					? (
						<>
							<InfoPanel
								file={state.loaded.file}
								decoded={state.loaded.decoded}
								viewMode={state.viewMode}
								onChangeViewMode={setViewMode}
							/>
							{state.viewMode === "preview"
								? (
									<PreviewPanel
										decoded={state.loaded.decoded}
										fileName={state.loaded.file.name}
									/>
								)
								: (
									<EditorPanel
										decoded={state.loaded.decoded}
										fileName={state.loaded.file.name}
									/>
								)}
						</>
					)
					: null}
			</main>

			<footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
				{t("app.footer")}
				{" · "}
				<a
					href="https://github.com/sindresorhus/gifkit"
					target="_blank"
					rel="noreferrer noopener"
					className="underline underline-offset-2 hover:text-indigo-500"
				>
					@sindresorhus/gifkit
				</a>
			</footer>
		</div>
	);
}

export default App;
