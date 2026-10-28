import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "@emotion/react/jsx-runtime";
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
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { css, keyframes } from "@emotion/react";
import { tokens } from "../../ui/tokens.js";
import { formatPrice } from "./shared.js";
const CartSheetContext = createContext(() => { });
export function useCartSheet() {
    return useContext(CartSheetContext);
}
/**
 * Defined locally rather than relying on a host-provided keyframe, so the sheet
 * animates identically in the widget's shadow root and in the dashboard.
 */
const sheetIn = keyframes `
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;
function buildAxes(item) {
    if (!item)
        return [];
    if (Array.isArray(item.options) && item.options.length) {
        return item.options.map((opt) => {
            const inStock = new Set(opt.values_in_stock ?? opt.values ?? []);
            const swatches = opt.role === "colour" ? opt.swatches : null;
            const values = swatches?.length
                ? swatches.map((s) => ({ value: String(s.value), hex: s.hex, in_stock: inStock.has(String(s.value)) }))
                : (opt.values ?? []).map((v) => ({ value: v, in_stock: inStock.has(v) }));
            return { name: String(opt.name ?? "Option"), role: String(opt.role ?? "generic"), values };
        });
    }
    if (item.colour_swatches?.length) {
        return [
            {
                name: "Colour",
                role: "colour",
                values: item.colour_swatches.map((s) => ({ value: s.value, hex: s.hex, in_stock: s.in_stock !== false })),
            },
        ];
    }
    return [];
}
function defaultSelections(axes) {
    const sel = {};
    for (const axis of axes) {
        const first = axis.values.find((v) => v.in_stock !== false) ?? axis.values[0];
        if (first)
            sel[axis.name] = first.value;
    }
    return sel;
}
function resolveVariant(item, selections) {
    return item.variants?.find((variant) => variant.in_stock !== false &&
        Object.entries(selections).every(([name, value]) => variant.options?.some((option) => option.name?.toLocaleLowerCase() === name.toLocaleLowerCase() && option.value === value)));
}
function SheetBody({ item, onClose, onConfirm, submitting, }) {
    const axes = useMemo(() => buildAxes(item), [item]);
    const [selections, setSelections] = useState(() => defaultSelections(axes));
    const priceStr = formatPrice(item.price, item.currency);
    const ready = axes.every((a) => Boolean(selections[a.name]));
    const oos = item.in_stock === false;
    return (_jsxs("div", { css: css `padding: 8px 16px 16px;`, children: [_jsx("div", { css: css `width: 36px; height: 4px; border-radius: 2px; background: ${tokens.color.border}; margin: 0 auto 12px;` }), _jsxs("div", { css: css `display: flex; gap: 12px; align-items: center;`, children: [_jsx("div", { css: css `
            width: 56px; height: 56px; border-radius: 10px; flex-shrink: 0; overflow: hidden;
            background: ${tokens.color.grey[50]};
          `, children: item.image && _jsx("img", { src: item.image, alt: "", css: css `width: 100%; height: 100%; object-fit: cover;` }) }), _jsxs("div", { css: css `flex: 1; min-width: 0;`, children: [_jsx("div", { css: css `font-size: 14px; font-weight: 600; line-height: 1.3;`, children: item.title ?? "Product" }), item.brand && _jsx("div", { css: css `font-size: 11px; color: ${tokens.color.textSecondary};`, children: item.brand }), priceStr && _jsx("div", { css: css `font-size: 15px; font-weight: 600; margin-top: 2px;`, children: priceStr })] }), _jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, css: css `border: none; background: none; cursor: pointer; color: ${tokens.color.textSecondary}; padding: 4px;`, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M6 6l12 12M18 6 6 18", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) })] }), axes.map((axis) => (_jsxs("div", { css: css `margin-top: 16px;`, children: [_jsxs("div", { css: css `font-size: 11px; color: ${tokens.color.textSecondary}; margin-bottom: 8px;`, children: [axis.name, selections[axis.name] && _jsxs("span", { css: css `color: ${tokens.color.text}; font-weight: 500; margin-left: 6px;`, children: ["\u2014 ", selections[axis.name]] })] }), _jsx("div", { css: css `display: flex; flex-wrap: wrap; gap: 8px;`, children: axis.values.map((v, i) => {
                            const isOos = v.in_stock === false;
                            const active = selections[axis.name] === v.value;
                            const pick = () => !isOos && setSelections((p) => ({ ...p, [axis.name]: v.value }));
                            return axis.role === "colour" && v.hex ? (_jsx("span", { title: v.value, onClick: pick, css: css `
                    width: 30px; height: 30px; border-radius: 50%; background: ${v.hex}; flex-shrink: 0;
                    border: ${active ? "2px" : "1px"} solid ${active ? tokens.color.text : tokens.color.border};
                    opacity: ${isOos ? 0.35 : 1}; cursor: ${isOos ? "not-allowed" : "pointer"};
                  ` }, i)) : (_jsx("button", { type: "button", onClick: pick, disabled: isOos, css: css `
                    height: 34px; padding: 0 12px; font-size: 13px; border-radius: 8px; cursor: ${isOos ? "not-allowed" : "pointer"};
                    background: ${active ? tokens.color.text : tokens.color.bg};
                    color: ${active ? "#fff" : tokens.color.text};
                    border: 1px solid ${active ? tokens.color.text : tokens.color.border};
                    text-decoration: ${isOos ? "line-through" : "none"};
                  `, children: v.value }, i));
                        }) })] }, axis.name))), _jsx("button", { type: "button", disabled: !ready || oos || submitting, onClick: () => onConfirm(selections), css: css `
          width: 100%; margin-top: 20px; padding: 14px; border: none; border-radius: 12px; cursor: pointer;
          font-size: 15px; font-weight: 600; background: ${tokens.color.text}; color: #fff;
          &:disabled { opacity: 0.5; cursor: not-allowed; }
        `, children: oos ? "Out of stock" : submitting ? "Adding…" : "Add to cart" })] }));
}
export function CartSheetProvider({ cart, children }) {
    const [item, setItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const openCart = useCallback((next) => setItem(next), []);
    const close = useCallback(() => !submitting && setItem(null), [submitting]);
    const showToast = useCallback((msg) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 3000);
    }, []);
    const confirm = useCallback(async (selections) => {
        if (!item)
            return;
        const productId = item.product_id ?? "";
        const variant = resolveVariant(item, selections);
        const variantId = variant?.id || (Object.keys(selections).length === 0 ? item.default_variant_id : "");
        if (!cart.supportsCart || !productId || (item.platform === "shopify" && !variantId)) {
            if (item.url)
                window.open(item.url, "_blank", "noopener");
            setItem(null);
            return;
        }
        setSubmitting(true);
        try {
            const line = { productId, quantity: 1, attributes: selections };
            if (variantId)
                line.variationId = variantId;
            await cart.add(line, item);
            const selectionLabel = Object.values(selections).join(" · ");
            showToast(`${item.title ?? "Item"} added to cart${selectionLabel ? ` — ${selectionLabel}` : ""}`);
            setItem(null);
        }
        catch {
            showToast("Couldn't add to cart. Try the product page.");
        }
        finally {
            setSubmitting(false);
        }
    }, [item, cart, showToast]);
    return (_jsxs(CartSheetContext.Provider, { value: openCart, children: [children, item && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: close, css: css `position: absolute; inset: 0; background: rgba(0,0,0,0.4); z-index: 5;` }), _jsx("div", { css: css `
              position: absolute; left: 0; right: 0; bottom: 0; z-index: 6;
              background: ${tokens.color.bg};
              border-radius: ${tokens.radius.xl} ${tokens.radius.xl} 0 0;
              box-shadow: ${tokens.shadow.md};
              animation: ${sheetIn} 0.2s ease-out;
            `, children: _jsx(SheetBody, { item: item, onClose: close, onConfirm: confirm, submitting: submitting }) })] })), toast && (_jsx("div", { css: css `
            position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 7;
            background: ${tokens.color.text}; color: #fff; font-size: 13px;
            padding: 10px 16px; border-radius: ${tokens.radius.pill}; white-space: nowrap;
            box-shadow: ${tokens.shadow.md};
          `, children: toast }))] }));
}
//# sourceMappingURL=CartSheet.js.map