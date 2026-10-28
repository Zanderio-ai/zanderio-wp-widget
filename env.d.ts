/// <reference types="vite/client" />

/**
 * Compile-time environment, baked by Vite `define` (see vite.config.ts).
 * The widget has no runtime .env — URLs are fixed per build target/env.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AI_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by Vite `define` from package.json version. */
declare const __WIDGET_VERSION__: string;

/** CSS imported with Vite's `?inline` flag resolves to a raw string. */
declare module "*.css?inline" {
  const css: string;
  export default css;
}
