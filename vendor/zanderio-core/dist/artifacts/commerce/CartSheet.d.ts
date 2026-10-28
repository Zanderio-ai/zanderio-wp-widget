/**
 * @module artifacts/commerce/CartSheet
 * @description Bottom-sheet cart configurator + provider.
 *
 * Per product direction, the add-to-cart action lives on the product card; this
 * sheet only appears after the shopper taps it, to pick options + confirm.
 *
 * Product and variant identifiers are read as explicit artifact fields. A
 * storefront ID is never derived from an internal document identifier.
 *
 * The sheet does not know what a storefront is. The host app injects a
 * {@link CartPort} via `CartSheetProvider cart={...}`:
 *   - the widget passes its real adapter (WooCommerce Blocks / Shopify Ajax),
 *   - the dashboard playground passes an in-memory stub.
 * When the port reports `supportsCart: false`, or the payload lacks the ids the
 * platform needs, the sheet falls back to opening the product page.
 */
import type { ReactNode } from "react";
import type { CommerceItem } from "../../chat/types.js";
import type { CartPort } from "../types.js";
type OpenCart = (item: CommerceItem) => void;
export declare function useCartSheet(): OpenCart;
export declare function CartSheetProvider({ cart, children }: {
    cart: CartPort;
    children: ReactNode;
}): import("@emotion/react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CartSheet.d.ts.map