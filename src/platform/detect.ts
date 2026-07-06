/**
 * @module platform/detect
 * @description Detect the storefront the widget is embedded on.
 *
 * Used to pick the right cart adapter and to tailor cart UX. An explicit hint
 * from settings/config wins; otherwise we sniff well-known globals/markers.
 */

import type { Storefront } from "@/config/types";

export function detectStorefront(hint?: string): Storefront {
  if (hint) {
    if (/shopify/i.test(hint)) return "shopify";
    if (/woo|wordpress/i.test(hint)) return "woocommerce";
    if (/custom|cloudflare/i.test(hint)) return "custom";
  }

  const w = window as unknown as Record<string, unknown>;

  if ((w.Shopify as { routes?: unknown })?.routes) return "shopify";

  if (
    w.wc_add_to_cart_params ||
    w.wc_cart_fragments_params ||
    document.body?.classList.contains("woocommerce") ||
    document.body?.classList.contains("woocommerce-page")
  ) {
    return "woocommerce";
  }

  return "custom";
}
