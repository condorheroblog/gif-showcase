import { resolve } from "node:path";
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { defineConfig } from "vite";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
	base: isDev ? "/" : "/gif-showcase/",

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
