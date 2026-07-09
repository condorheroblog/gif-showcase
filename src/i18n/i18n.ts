import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enUS from "./locales/en-US.json";
import zhCN from "./locales/zh-CN.json";

export const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "zh-CN";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
	"zh-CN": "中文",
	"en-US": "English",
};

export const resources = {
	"zh-CN": { translation: zhCN },
	"en-US": { translation: enUS },
} as const;

void i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: DEFAULT_LANGUAGE,
		supportedLngs: [...SUPPORTED_LANGUAGES],
		defaultNS: "translation",
		ns: ["translation"],
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ["localStorage", "navigator", "htmlTag"],
			caches: ["localStorage"],
			lookupLocalStorage: "gifkit-showcase-locale",
		},
	});

export default i18n;
