import type { SupportedLanguage } from "./i18n";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "./i18n";

function isSupported(value: string | undefined): value is SupportedLanguage {
	return value !== undefined && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Keeps the `<html lang>` attribute in sync with the current i18next language.
 * Mount once near the root of the app.
 */
export function useLanguageSync(): void {
	const { i18n: instance } = useTranslation();

	useEffect(() => {
		const apply = (lang: string) => {
			const normalized = isSupported(lang) ? lang : lang.split("-")[0];
			document.documentElement.lang = isSupported(lang) ? lang : (normalized ?? lang);
		};
		apply(instance.language);
		const handler = (lng: string) => apply(lng);
		instance.on("languageChanged", handler);
		return () => {
			instance.off("languageChanged", handler);
		};
	}, [instance]);
}
