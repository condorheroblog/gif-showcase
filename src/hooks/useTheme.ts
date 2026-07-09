import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "gifkit-showcase-theme";

function getInitialTheme(): Theme {
	if (typeof window === "undefined") {
		return "light";
	}
	const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (stored === "light" || stored === "dark") {
		return stored;
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	if (theme === "dark") {
		root.classList.add("dark");
	}
	else {
		root.classList.remove("dark");
	}
}

export function useTheme(): {
	theme: Theme
	toggleTheme: () => void
} {
	const [theme, setTheme] = useState<Theme>(getInitialTheme);

	useEffect(() => {
		applyTheme(theme);
		try {
			window.localStorage.setItem(STORAGE_KEY, theme);
		}
		catch {
			// localStorage may be unavailable in private browsing; ignore.
		}
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme((current: Theme) => (current === "dark" ? "light" : "dark"));
	}, []);

	return { theme, toggleTheme };
}
