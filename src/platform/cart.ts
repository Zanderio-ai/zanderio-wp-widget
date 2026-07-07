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

export interface CartSnapshot {
  itemCount: number;
}

export interface CartAdapter {
  readonly storefront: Storefront;
  /** Whether this storefront supports in-place cart adds. */
  readonly supportsCart: boolean;
  add(line: CartLine): Promise<void>;
  /**
   * Read current cart contents, for the `cart_age` nudge trigger. Returns
   * null when unsupported (custom storefronts) or the read fails — the
   * trigger simply never fires rather than guessing.
   */
  getCart(): Promise<CartSnapshot | null>;
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

/** WooCommerce Store API — public, no auth required, ships with core since 8.x. */
async function wooGetCart(): Promise<CartSnapshot | null> {
  try {
    const res = await fetch("/wp-json/wc/store/v1/cart", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { items_count?: number };
    return { itemCount: typeof payload.items_count === "number" ? payload.items_count : 0 };
  } catch {
    return null;
  }
}

const wooAdapter: CartAdapter = {
  storefront: "woocommerce",
  supportsCart: true,
  getCart: wooGetCart,
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

/** Shopify Cart AJAX — public, no auth required. Read-only for now: `add()`
 * (`POST /cart/add.js`) is still Phase 3 work; the `cart_age` nudge trigger
 * only needs to observe cart state, not write to it. */
async function shopifyGetCart(): Promise<CartSnapshot | null> {
  try {
    const res = await fetch("/cart.js", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { item_count?: number };
    return { itemCount: typeof payload.item_count === "number" ? payload.item_count : 0 };
  } catch {
    return null;
  }
}

// TODO(widget-overhaul Phase 3): implement Shopify Cart AJAX (`POST /cart/add.js`).
const shopifyAdapter: CartAdapter = {
  storefront: "shopify",
  supportsCart: false,
  getCart: shopifyGetCart,
  async add() {
    throw new Error("cart_unsupported");
  },
};

const unsupportedAdapter = (storefront: Storefront): CartAdapter => ({
  storefront,
  supportsCart: false,
  async getCart() {
    return null;
  },
  async add() {
    throw new Error("cart_unsupported");
  },
});

export function getCartAdapter(storefront: Storefront): CartAdapter {
  if (storefront === "woocommerce") return wooAdapter;
  if (storefront === "shopify") return shopifyAdapter;
  // Custom storefronts have no native cart to observe; deep-link to the PDP.
  return unsupportedAdapter(storefront);
}
