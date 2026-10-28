import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/commerce/SpotlightCard
 * @description Single-product, highest-intent card: large image, sale/stock
 * badges, price, optional pitch, and a primary Add-to-cart (option selection
 * happens in the cart sheet). Reads `artifact.{title,subtitle,media,target,data}`.
 */
import { css } from "@emotion/react";
import { tokens } from "../../ui/tokens.js";
import { Badge, CartButton, MatchBadge, ProductThumb, SaleFlag, ViewButton, formatPrice } from "./shared.js";
export function SpotlightCard({ artifact }) {
    const { title, subtitle, media, target } = artifact;
    const data = (artifact.data ?? {});
    const price = data.price;
    const currency = data.currency ?? "USD";
    const compareAt = data.compare_at_price;
    const inStock = data.in_stock !== false;
    const brand = data.brand;
    const sku = data.sku;
    const onSale = Boolean(data.on_sale);
    const discount = data.discount_pct ?? 0;
    const matchLabel = data.match_label;
    const priceStr = formatPrice(price, currency);
    const compareStr = compareAt ? formatPrice(compareAt, currency) : null;
    const cartItem = {
        doc_id: data.product_id ?? "",
        title: title ?? undefined,
        price,
        currency,
        image: media,
        url: target,
        in_stock: inStock,
        brand,
        options: data.options ?? [],
    };
    return (_jsxs("div", { css: css `
        width: 100%;
        max-width: 360px;
        border: 1px solid ${tokens.color.border};
        border-radius: ${tokens.radius.lg};
        background: ${tokens.color.bg};
        overflow: hidden;
      `, children: [_jsx(ProductThumb, { image: media, alt: title ?? "", height: 180, ratio: "16/9", children: _jsx(SaleFlag, { discount_pct: onSale ? discount : 0 }) }), _jsxs("div", { css: css `padding: 12px;`, children: [_jsxs("div", { css: css `display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px;`, children: [_jsx(MatchBadge, { label: matchLabel }), onSale && discount > 0 && _jsx(Badge, { label: `${Math.round(discount)}% off`, tone: "sale" }), _jsx(Badge, { label: inStock ? "In stock" : "Out of stock", tone: inStock ? "stock" : "budget" })] }), _jsx("div", { css: css `font-size: 15px; font-weight: 600; line-height: 1.3;`, children: title ?? "Product" }), (brand || sku) && (_jsx("div", { css: css `font-size: 12px; color: ${tokens.color.textSecondary}; margin-bottom: 6px;`, children: [brand, sku ? `SKU: ${sku}` : null].filter(Boolean).join(" · ") })), subtitle && _jsx("div", { css: css `font-size: 12px; color: ${tokens.color.textSecondary}; line-height: 1.5; margin-bottom: 8px;`, children: subtitle }), _jsxs("div", { css: css `display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;`, children: [priceStr && _jsx("span", { css: css `font-size: 18px; font-weight: 600;`, children: priceStr }), compareStr && _jsx("span", { css: css `font-size: 13px; color: ${tokens.color.textDisabled}; text-decoration: line-through;`, children: compareStr })] }), _jsxs("div", { css: css `display: flex; gap: 8px;`, children: [_jsx(ViewButton, { url: target, label: "View listing", fullWidth: true }), _jsx(CartButton, { item: cartItem, fullWidth: true })] })] })] }));
}
//# sourceMappingURL=SpotlightCard.js.map