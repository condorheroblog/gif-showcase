import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		codeInspectorPlugin({
			bundler: "vite",
			// hideConsole: true,
		}),
	],
	resolve: {
		alias: {
			// gifkit's `validate.js` imports `node:util` for `util.types`.
			// Provide a browser shim that polyfills the two functions actually
			// used (`isUint8Array`, `isUint8ClampedArray`).
			"node:util": resolve(__dirname, "src/shims/node-util.ts"),
		},
	},
	server: {
		port: 5173,
		host: true,
	},
});
