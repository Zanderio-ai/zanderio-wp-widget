/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AI_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __WIDGET_VERSION__: string;

declare module "*.css?inline" {
  const css: string;
  export default css;
}
