// Browser shim for `node:util` (gifkit's `validate.js` only calls
// `util.types.isUint8Array` / `isUint8ClampedArray`).
export const types = {
	isUint8Array: (value: unknown): value is Uint8Array => value instanceof Uint8Array,
	isUint8ClampedArray: (value: unknown): value is Uint8ClampedArray =>
		value instanceof Uint8ClampedArray,
};
