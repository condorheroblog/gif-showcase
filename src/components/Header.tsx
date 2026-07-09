import type { Theme } from "../hooks/useTheme";
import { useI18n } from "../i18n/I18nProvider";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "../i18n/translations";

interface HeaderProps {
	theme: Theme
	onToggleTheme: () => void
	showReset?: boolean
	onReset?: () => void
}

export function Header({ theme, onToggleTheme, showReset, onReset }: HeaderProps) {
	const { t, locale, setLocale } = useI18n();

	const toggleLocale = () => {
		const idx = SUPPORTED_LOCALES.indexOf(locale);
		const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length] as Locale;
		setLocale(next);
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
						href="https://github.com/sindresorhus/gifkit"
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
						<span aria-hidden>{LOCALE_LABELS[locale]}</span>
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
