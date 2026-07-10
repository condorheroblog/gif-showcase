import type { Theme } from "../hooks/useTheme";
import type { SupportedLanguage } from "../i18n/i18n";
import { useTranslation } from "react-i18next";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "../i18n/i18n";

interface HeaderProps {
	theme: Theme
	onToggleTheme: () => void
	showReset?: boolean
	onReset?: () => void
}

export function Header({ theme, onToggleTheme, showReset, onReset }: HeaderProps) {
	const { t, i18n } = useTranslation();

	const currentLang = (i18n.resolvedLanguage ?? i18n.language ?? "zh-CN") as SupportedLanguage;
	const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
	const nextLang = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length] ?? SUPPORTED_LANGUAGES[0];

	const toggleLocale = () => {
		void i18n.changeLanguage(nextLang);
	};

	return (
		<header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
			<div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<img
						src="/logo.svg"
						alt=""
						width={32}
						height={32}
						className="h-8 w-8 rounded-lg shadow"
					/>
					<div className="min-w-0">
						<h1 className="text-sm sm:text-base font-semibold leading-tight truncate">
							{t("header.title")}
						</h1>
						<p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-tight truncate">
							{t("header.subtitle", { lib: "@sindresorhus/gifkit" })}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
					{showReset
						? (
							<button
								type="button"
								onClick={onReset}
								className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
							>
								<span className="hidden sm:inline">{t("header.reset")}</span>
								<span className="sm:hidden">↺</span>
							</button>
						)
						: null}
					<a
						href="https://github.com/condorheroblog/gif-showcase"
						target="_blank"
						rel="noreferrer noopener"
						className="rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
					>
						<span className="hidden sm:inline">{t("header.github")}</span>
						<span className="sm:hidden">↗</span>
					</a>
					<button
						type="button"
						onClick={toggleLocale}
						aria-label={t("header.language")}
						title={t("header.language")}
						className="rounded-lg h-8 px-2 sm:h-9 sm:px-2.5 inline-flex items-center justify-center text-xs sm:text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
					>
						<span aria-hidden>{LANGUAGE_LABELS[currentLang]}</span>
					</button>
					<button
						type="button"
						onClick={onToggleTheme}
						aria-label={t("header.toggleTheme")}
						className="rounded-lg h-8 w-8 sm:h-9 sm:w-9 inline-flex items-center justify-center border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-[0.98]"
					>
						<span aria-hidden>{theme === "dark" ? "☀️" : "🌙"}</span>
					</button>
				</div>
			</div>
		</header>
	);
}
