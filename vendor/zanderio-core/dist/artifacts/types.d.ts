/**
 * @module artifacts/types
 * @description The cart injection seam for commerce artifact cards.
 *
 * These never appear on the wire — they exist only so a host can plug its own
 * cart into the shared sheet. The artifact payload contracts are wire shapes and
 * live in `../chat/types.ts`.
 */
import type { CommerceItem } from "../chat/types.js";
/** One add-to-cart request, handed to the host app's {@link CartPort}. */
export interface CartLine {
    productId: string;
    variationId?: string;
    quantity: number;
    attributes?: Record<string, string>;
}
/**
 * The host application's cart, injected into {@link CartSheetProvider}.
 *
 * This package deliberately knows nothing about storefronts. The widget passes
 * its real WooCommerce/Shopify adapter; the dashboard playground passes an
 * in-memory stub. Both satisfy this structurally.
 */
export interface CartPort {
    /** False for storefronts with no in-place add (the sheet then opens the product page instead). */
    supportsCart: boolean;
    /**
     * `line` carries what a storefront needs (ids, quantity, chosen options);
     * `item` is the full catalog record the shopper acted on, for hosts that also
     * want display data — a title and thumbnail for a cart badge, say. A port
     * that only needs `line` can declare a one-argument `add` and still satisfy
     * this, which is how the widget's storefront adapter plugs in unchanged.
     */
    add(line: CartLine, item: CommerceItem): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map