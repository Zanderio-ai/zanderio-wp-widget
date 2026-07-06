/**
 * @module config/settings
 * @description Resolve host-page settings.
 *
 * Embed contract (custom / Cloudflare channel):
 *
 *   <script src=".../loader.js" data-id="wdg_..." defer></script>
 *
 * The widget reads its store key from the `data-id` attribute on its own
 * <script> tag (the industry-standard generic-loader pattern). A
 * `window.ZanderioWidgetConfig = { key }` global is also honored so the Shopify
 * extension and WordPress plugin (which inject the key server-side) can set it
 * without a data attribute.
 */

import type { WidgetSettings } from "./types";

/** Find the <script> element that loaded this bundle, to read its data-*. */
function findOwnScript(): HTMLScriptElement | null {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript;
  }
  // Fallback for module/async loads where currentScript is null.
  return document.querySelector<HTMLScriptElement>("script[data-id]");
}

export function resolveSettings(): WidgetSettings | null {
  const script = findOwnScript();
  const global = (window as unknown as { ZanderioWidgetConfig?: Partial<WidgetSettings> })
    .ZanderioWidgetConfig;

  const key = script?.dataset.id ?? global?.key ?? "";

  if (!key) {
    // Without a key there is nothing to bootstrap — fail quietly.
    console.error("Zanderio Widget: missing data-id (or window.ZanderioWidgetConfig.key)");
    return null;
  }

  return {
    key,
    platform: global?.platform,
    origin: window.location.origin,
  };
}
