import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/commerce/DiscoveryCard
 * @description Browse-stage commerce artifact — a horizontal scroller of
 * view-led product tiles (cart de-emphasized as an icon). Reads
 * `artifact.data.items` (CommerceItem[]).
 */
import { css } from "@emotion/react";
import { tokens } from "../../ui/tokens.js";
import { cardShell } from "../../ui/shell.js";
import { Badge, CartIconButton, ColourSwatches, OutOfStockVeil, PriceRow, ProductThumb, SaleFlag, TypeLabel, ViewButton, MatchBadge, badgeTone, } from "./shared.js";
function Tile({ item }) {
    return (_jsxs("div", { css: css `
        min-width: 158px;
        max-width: 158px;
        flex-shrink: 0;
        border: 1px solid ${tokens.color.border};
        border-radius: ${tokens.radius.lg};
        background: ${tokens.color.bg};
        display: flex;
        flex-direction: column;
        padding: 8px;
        scroll-snap-align: start;
      `, children: [_jsxs(ProductThumb, { image: item.image, alt: item.title, height: 104, children: [_jsx(SaleFlag, { discount_pct: item.on_sale ? item.discount_pct : 0 }), _jsx(OutOfStockVeil, { in_stock: item.in_stock })] }), (item.badge || item.match_label) && (_jsxs("div", { css: css `margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;`, children: [_jsx(MatchBadge, { label: item.match_label }), item.badge && _jsx(Badge, { label: item.badge, tone: badgeTone(item.badge) })] })), _jsxs("div", { css: css `margin-top: 6px; flex: 1;`, children: [item.brand && _jsx("div", { css: css `font-size: 10px; color: ${tokens.color.textSecondary};`, children: item.brand }), _jsx("div", { css: css `
            font-size: 12px;
            font-weight: 500;
            line-height: 1.35;
            margin-bottom: 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          `, children: item.title ?? "Product" }), _jsx(PriceRow, { price: item.price, price_max: item.price_max, compare_at_price: item.compare_at_price, currency: item.currency }), _jsx(ColourSwatches, { swatches: item.colour_swatches })] }), _jsxs("div", { css: css `display: flex; gap: 5px; margin-top: 8px; align-items: stretch;`, children: [_jsx(ViewButton, { url: item.url, fullWidth: true }), _jsx(CartIconButton, { item: item })] })] }));
}
export function DiscoveryCard({ artifact }) {
    const items = artifact.data?.items ?? [];
    if (!items.length)
        return null;
    return (_jsxs("div", { css: cardShell, children: [artifact.title && _jsx(TypeLabel, { children: artifact.title }), _jsx("div", { css: css `
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          &::-webkit-scrollbar {
            display: none;
          }
        `, children: items.map((item, i) => (_jsx(Tile, { item: item }, item.doc_id ?? i))) })] }));
}
//# sourceMappingURL=DiscoveryCard.js.map