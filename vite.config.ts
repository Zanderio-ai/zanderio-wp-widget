import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unified build config for the Zanderio widget.
 *
 * WIDGET_TARGET — where the IIFE bundle lands:
 *   "cdn"       → dist/                          (Cloudflare R2 / CDN)
 *   "shopify"   → sources/shopify/zanderio-ai/assets/   (theme app extension — currently unused, see note below)
 *   "wordpress" → sources/wordpress/assets/             (WordPress plugin)
 *
 * WIDGET_ENV — which backend URLs to bake in ("dev" default | "prod").
 *
 * The widget is a single self-mounting IIFE (`loader.js` + `loader.css`).
 * There is no runtime env; the URLs below are compile-time constants.
 */
const target = process.env.WIDGET_TARGET ?? "cdn";
const env = process.env.WIDGET_ENV === "prod" ? "prod" : "dev";

const API_URLS = {
  dev: "https://dev-api.zanderio.ai",
  prod: "https://api.zanderio.ai",
} as const;

const AI_URLS = {
  dev: "https://dev-agent.zanderio.ai",
  prod: "https://agent.zanderio.ai",
} as const;

const CDN_BASES = {
  dev: "https://dev-cdn.zanderio.ai/widget/",
  prod: "https://cdn.zanderio.ai/widget/",
} as const;

const TARGETS = {
  cdn: { outDir: "dist", base: CDN_BASES[env] },
  shopify: { outDir: "sources/shopify/zanderio-ai/assets", base: undefined },
  wordpress: { outDir: "sources/wordpress/assets", base: undefined },
} as const;

const cfg = TARGETS[target as keyof typeof TARGETS] ?? TARGETS.cdn;

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: { plugins: ["@emotion/babel-plugin"] },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: cfg.outDir,
    emptyOutDir: true,
    ...(cfg.base ? { base: cfg.base } : {}),
    cssCodeSplit: false,
    assetsInlineLimit: 50_000, // inline icons/logos < 50 KB
    minify: "terser",
    terserOptions: { compress: { drop_console: env === "prod" } },
    rollupOptions: {
      input: { main: path.resolve(__dirname, "src/main.tsx") },
      output: {
        format: "iife",
        name: "ZanderioWidget",
        entryFileNames: "loader.js",
        assetFileNames: (info) =>
          info.names?.[0]?.endsWith(".css") ? "loader.css" : "[name][extname]",
      },
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(API_URLS[env]),
    "import.meta.env.VITE_AI_URL": JSON.stringify(AI_URLS[env]),
    __WIDGET_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
  },
});
