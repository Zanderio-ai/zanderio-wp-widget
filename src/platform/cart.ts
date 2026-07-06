/**
 * @module platform/cart
 * @description Storefront-agnostic cart-add contract + adapter dispatch.
 *
 * The widget adds items to the host store's REAL cart (not a widget-local cart).
 * Each storefront needs its own mechanism:
 *   - woocommerce: POST to the wc-ajax add_to_cart endpoint + fragment refresh
 *   - shopify:     POST /cart/add.js (Cart AJAX API)
 *   - custom:      no native cart; product tiles deep-link to the PDP instead
 *
 * Phase 1 defines the interface and the WooCommerce port. Shopify and the
 * confirmation-sheet UX land in Phase 3.
 */

import type { Storefront } from "@/config/types";

export interface CartLine {
  productId: string;
  variationId?: string;
  quantity: number;
  attributes?: Record<string, string>;
}

export interface CartAdapter {
  readonly storefront: Storefront;
  /** Whether this storefront supports in-place cart adds. */
  readonly supportsCart: boolean;
  add(line: CartLine): Promise<void>;
}

/* ── WooCommerce ─────────────────────────────────────────────────────────── */

function wooAjaxUrl(): string {
  const w = window as unknown as {
    wc_add_to_cart_params?: { wc_ajax_url?: string };
    wc_cart_fragments_params?: { wc_ajax_url?: string };
  };
  const tmpl = w.wc_add_to_cart_params?.wc_ajax_url ?? w.wc_cart_fragments_params?.wc_ajax_url;
  if (tmpl) return tmpl.replace("%%endpoint%%", "add_to_cart");

  const url = new URL(window.location.href);
  url.searchParams.set("wc-ajax", "add_to_cart");
  return url.toString();
}

const wooAdapter: CartAdapter = {
  storefront: "woocommerce",
  supportsCart: true,
  async add(line) {
    const body = new URLSearchParams();
    body.set("product_id", line.productId);
    body.set("quantity", String(line.quantity));
    if (line.variationId) body.set("variation_id", line.variationId);
    for (const [name, value] of Object.entries(line.attributes ?? {})) {
      body.set(`attribute_${name}`, value);
    }

    const res = await fetch(wooAjaxUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      credentials: "same-origin",
      body: body.toString(),
    });

    const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
    if (!res.ok || payload?.error) throw new Error("woocommerce_cart_failed");

    // Refresh WooCommerce cart fragments so the theme's mini-cart updates.
    const w = window as unknown as { jQuery?: (el: unknown) => { trigger: (e: string) => void } };
    if (w.jQuery) w.jQuery(document.body).trigger("wc_fragment_refresh");
  },
};

/* ── Shopify / custom (Phase 3) ──────────────────────────────────────────── */

// TODO(widget-overhaul Phase 3): implement Shopify Cart AJAX (`POST /cart/add.js`).
const unsupportedAdapter = (storefront: Storefront): CartAdapter => ({
  storefront,
  supportsCart: false,
  async add() {
    throw new Error("cart_unsupported");
  },
});

export function getCartAdapter(storefront: Storefront): CartAdapter {
  if (storefront === "woocommerce") return wooAdapter;
  // Shopify cart-add is TODO; custom storefronts deep-link to the PDP.
  return unsupportedAdapter(storefront);
}
