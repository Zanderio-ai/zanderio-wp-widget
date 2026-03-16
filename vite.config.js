import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Unified Vite config for the Zanderio Chat Widget.
 *
 * WIDGET_TARGET  — where the bundle lands
 *   "cdn"       → dist/                                    (Cloudflare R2 / CDN)
 *   "shopify"   → sources/shopify/assets/                  (Shopify theme extension)
 *   "wordpress" → sources/wordpress/assets/                (WordPress plugin bundle)
 *
 * WIDGET_ENV    — which environment URLs to bake in
 *   "dev"      → dev-api.zanderio.ai / dev-socket.zanderio.ai  (default)
 *   "prod"     → api.zanderio.ai / socket.zanderio.ai
 *
 * Examples:
 *   npm run build                                          → cdn + dev
 *   WIDGET_TARGET=shopify WIDGET_ENV=prod npm run build
 *   WIDGET_TARGET=wordpress WIDGET_ENV=prod npm run build
 */

const target = process.env.WIDGET_TARGET || "cdn";
const env = process.env.WIDGET_ENV || "dev";

const CDN_BASES = {
  dev: "https://dev-cdn.zanderio.ai/",
  prod: "https://cdn.zanderio.ai/",
};

const API_URLS = {
  dev: "https://dev-api.zanderio.ai",
  prod: "https://api.zanderio.ai",
};

const SOCKET_URLS = {
  dev: "https://dev-ws.zanderio.ai/widget",
  prod: "https://ws.zanderio.ai/widget",
};

const TARGETS = {
  cdn: {
    outDir: "dist",
    base: CDN_BASES[env] || CDN_BASES.dev,
    assetsInlineLimit: 50_000, // inline everything <50 KB (images, SVGs)
    dropConsole: env === "prod",
  },
  shopify: {
    outDir: "sources/shopify/assets",
    base: undefined, // relative — Shopify serves from its own CDN
    assetsInlineLimit: 4_096,
    dropConsole: env === "prod",
  },
  wordpress: {
    outDir: "sources/wordpress/assets",
    base: undefined, // served locally by WordPress via plugin_dir_url()
    assetsInlineLimit: 50_000, // inline everything <50 KB (images, SVGs)
    dropConsole: env === "prod",
  },
};

const cfg = TARGETS[target] || TARGETS.cdn;

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: cfg.outDir,
    emptyOutDir: true,
    ...(cfg.base && { base: cfg.base }),

    rollupOptions: {
      input: { main: "./src/main.jsx" },
      output: {
        format: "iife",
        name: "ZanderioWidget",
        entryFileNames: "widget.js",
        assetFileNames: (info) =>
          info.name?.endsWith(".css") ? "widget.css" : "[name][extname]",
      },
    },

    cssCodeSplit: false,
    assetsInlineLimit: cfg.assetsInlineLimit,

    minify: "terser",
    terserOptions: {
      compress: { drop_console: cfg.dropConsole },
    },
  },

  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      API_URLS[env] || API_URLS.dev,
    ),
    "import.meta.env.VITE_SOCKET_URL": JSON.stringify(
      SOCKET_URLS[env] || SOCKET_URLS.dev,
    ),
    "import.meta.env.VITE_FARO_COLLECTOR_URL": JSON.stringify(
      process.env.VITE_FARO_COLLECTOR_URL || "",
    ),
    __WIDGET_VERSION__: JSON.stringify(
      process.env.npm_package_version || "0.0.0",
    ),
  },
});
