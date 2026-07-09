// Centralised list of error keys that can flow through the state machine
// and need to be translated via i18next.
export const ERROR_KEYS = [
	"upload.emptyFile",
	"upload.parseError",
] as const;

export type ErrorKey = (typeof ERROR_KEYS)[number];

const ERROR_KEY_SET = new Set<string>(ERROR_KEYS);

export function isErrorKey(value: string): value is ErrorKey {
	return ERROR_KEY_SET.has(value);
}
