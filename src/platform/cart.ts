/**
 * @module platform/cart
 * @description Storefront-agnostic cart-add contract + adapter dispatch.
 *
 * The widget adds items to the host store's REAL cart (not a widget-local cart).
 * Each storefront needs its own mechanism:
 *   - woocommerce: WooCommerce Blocks cart store / Store API
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
    const productId = Number(line.variationId || line.productId);
    if (!Number.isSafeInteger(productId) || productId <= 0) throw new Error("invalid_woocommerce_product_id");

    const host = window as unknown as {
      wp?: { data?: { dispatch?: (store: string) => { addItemToCart?: (id: number, quantity: number) => Promise<unknown> } } };
      wcSettings?: { storeApiNonce?: string };
      ZanderioWidgetConfig?: { storeApiNonce?: string };
    };
    const cartStore = host.wp?.data?.dispatch?.("wc/store/cart");
    if (cartStore?.addItemToCart) {
      await cartStore.addItemToCart(productId, line.quantity);
      return;
    }

    const nonce = host.ZanderioWidgetConfig?.storeApiNonce ?? host.wcSettings?.storeApiNonce;
    if (!nonce) throw new Error("woocommerce_store_api_nonce_missing");
    const res = await fetch("/wp-json/wc/store/v1/cart/add-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Nonce: nonce,
      },
      credentials: "same-origin",
      body: JSON.stringify({ id: productId, quantity: line.quantity }),
    });
    if (!res.ok) throw new Error("woocommerce_cart_failed");
  },
};

/* ── Shopify / custom (Phase 3) ──────────────────────────────────────────── */

/** Shopify Cart AJAX — public storefront cart API. */
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

const shopifyAdapter: CartAdapter = {
  storefront: "shopify",
  supportsCart: true,
  getCart: shopifyGetCart,
  async add(line) {
    const id = line.variationId || line.productId;
    if (!/^\d+$/.test(id)) throw new Error("invalid_shopify_variant_id");
    const root = (window as unknown as { Shopify?: { routes?: { root?: string } } }).Shopify?.routes?.root ?? "/";
    const res = await fetch(`${root}cart/add.js`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ items: [{ id, quantity: line.quantity }] }),
    });
    if (!res.ok) throw new Error("shopify_cart_failed");
    document.dispatchEvent(new CustomEvent("zanderio:cart-updated"));
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
