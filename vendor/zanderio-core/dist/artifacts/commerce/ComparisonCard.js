import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
import { css } from "@emotion/react";
import { tokens } from "../../ui/tokens.js";
import { cardShell } from "../../ui/shell.js";
import { Badge, CartButton, ProductThumb, SaleFlag, TypeLabel, ViewButton, MatchBadge, badgeTone, formatPrice, } from "./shared.js";
function SpecRow({ label, children }) {
    return (_jsxs("div", { css: css `
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        padding: 4px 0;
        border-bottom: 1px solid ${tokens.color.border};
        &:last-of-type {
          border-bottom: none;
        }
      `, children: [_jsx("span", { css: css `color: ${tokens.color.textSecondary};`, children: label }), _jsx("span", { css: css `font-weight: 500;`, children: children })] }));
}
function Column({ item, featured }) {
    const colours = item.colour_swatches?.length ?? 0;
    return (_jsxs("div", { css: css `
        flex: 0 0 168px;
        background: ${tokens.color.bg};
        border-radius: ${tokens.radius.lg};
        border: ${featured ? `2px solid ${tokens.brand.primary}` : `1px solid ${tokens.color.border}`};
        padding: 10px;
      `, children: [_jsxs("div", { css: css `min-height: 18px; margin-bottom: 6px; display: flex; justify-content: center; gap: 4px; flex-wrap: wrap;`, children: [_jsx(MatchBadge, { label: item.match_label }), item.badge && _jsx(Badge, { label: item.badge, tone: badgeTone(item.badge) })] }), _jsx(ProductThumb, { image: item.image, alt: item.title, height: 92, children: _jsx(SaleFlag, { discount_pct: item.on_sale ? item.discount_pct : 0 }) }), _jsx("div", { css: css `
          font-size: 12px;
          font-weight: 500;
          line-height: 1.3;
          margin-top: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        `, children: item.title ?? "Product" }), item.brand && _jsx("div", { css: css `font-size: 10px; color: ${tokens.color.textSecondary}; margin-bottom: 6px;`, children: item.brand }), _jsx(SpecRow, { label: "Price", children: formatPrice(item.price, item.currency) ?? "—" }), item.product_type && _jsx(SpecRow, { label: "Type", children: item.product_type }), _jsx(SpecRow, { label: "Stock", children: item.in_stock === false ? "Out" : "In stock" }), colours > 0 && _jsx(SpecRow, { label: "Colours", children: colours }), _jsxs("div", { css: css `display: flex; gap: 5px; margin-top: 10px;`, children: [_jsx(ViewButton, { url: item.url, fullWidth: true }), _jsx(CartButton, { item: item, label: "Cart", fullWidth: true })] })] }));
}
export function ComparisonCard({ artifact }) {
    const items = artifact.data?.items ?? [];
    if (!items.length)
        return null;
    return (_jsxs("div", { css: cardShell, children: [_jsx(TypeLabel, { children: artifact.title ?? "Comparison" }), _jsx("div", { css: css `
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          &::-webkit-scrollbar {
            display: none;
          }
        `, children: items.map((item, i) => (_jsx(Column, { item: item, featured: Boolean(item.badge) }, item.doc_id ?? i))) })] }));
}
//# sourceMappingURL=ComparisonCard.js.map