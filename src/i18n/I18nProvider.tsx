import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	DEFAULT_LOCALE,
	SUPPORTED_LOCALES,
	translate,
	type Locale,
	type TranslationKey,
} from "./translations";

const STORAGE_KEY = "gifkit-showcase-locale";

interface I18nContextValue {
	locale: Locale
	setLocale: (locale: Locale) => void
	t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
	return value !== null && (SUPPORTED_LOCALES as string[]).includes(value);
}

function detectInitialLocale(): Locale {
	if (typeof window === "undefined") {
		return DEFAULT_LOCALE;
	}
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (isLocale(stored)) {
		return stored;
	}
	const nav = window.navigator.language;
	if (isLocale(nav)) {
		return nav;
	}
	const prefix = nav.split("-")[0]?.toLowerCase();
	const match = SUPPORTED_LOCALES.find(l => l.toLowerCase().startsWith(`${prefix}-`));
	return match ?? DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

	useEffect(() => {
		if (typeof document !== "undefined") {
			document.documentElement.lang = locale;
		}
		try {
			window.localStorage.setItem(STORAGE_KEY, locale);
		}
		catch {
			// localStorage may be unavailable; ignore.
		}
	}, [locale]);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
	}, []);

	const t = useCallback(
		(key: TranslationKey, params?: Record<string, string | number>) => {
			return translate(locale, key, params);
		},
		[locale],
	);

	const value = useMemo<I18nContextValue>(
		() => ({ locale, setLocale, t }),
		[locale, setLocale, t],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
	const ctx = useContext(I18nContext);
	if (!ctx) {
		throw new Error("useI18n must be used within an I18nProvider");
	}
	return ctx;
}
