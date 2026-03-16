/**
 * Zanderio Widget — Configuration
 *
 * Single source of truth for every tunable value the widget uses at runtime.
 * The host page drops a global object (ideally `window.ZanderioWidgetConfig`)
 * before the widget script loads; this module reads it, merges it with
 * sensible defaults, and exposes the result via `resolveConfig()`.
 *
 * Legacy global names (`ZanderioChatConfig`, `MyChatWidgetConfig`,
 * `aiChatConfig`) are still honoured but will be removed in a future major
 * version — new integrations should always use `ZanderioWidgetConfig`.
 *
 * Defaults
 * --------
 * primaryColor : "#7E3FF2"   — brand purple used for the toggle button and accents
 * shopId       : "default-shop"
 * apiRoot      : baked in per environment via Vite define (dev / prod)
 * socketUrl    : baked in per environment via Vite define (dev / prod)
 *
 * @module config/widget.config
 */

const DEFAULTS = {
  primaryColor: "#7E3FF2",
  shopId: "default-shop",
  apiRoot: import.meta.env.VITE_API_BASE_URL || "https://dev-api.zanderio.ai",
  socketUrl:
    import.meta.env.VITE_SOCKET_URL || "https://dev-ws.zanderio.ai/widget",
};

/**
 * Reads the host page's global config object, falls back through legacy names,
 * and merges the result with DEFAULTS.
 *
 * `shopDomain` is resolved from the config or, if absent, from
 * `window.location.hostname` so Shopify and standalone installs work
 * without any extra setup.
 *
 * @returns {{ primaryColor: string, shopId: string, apiRoot: string,
 *             socketUrl: string, shopDomain: string, [key: string]: any }}
 */
export function resolveConfig() {
  const userConfig =
    window.ZanderioWidgetConfig ||
    window.ZanderioChatConfig ||
    window.MyChatWidgetConfig ||
    window.aiChatConfig ||
    {};

  return {
    ...DEFAULTS,
    ...userConfig,
    shopDomain:
      userConfig.shopDomain || userConfig.shopUrl || window.location.hostname,
  };
}
