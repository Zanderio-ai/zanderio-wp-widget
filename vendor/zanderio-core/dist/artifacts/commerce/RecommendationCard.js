import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/commerce/RecommendationCard
 * @description Decision-stage, cart-led ranked list. Top pick gets an accent
 * rail + full Add-to-cart; the rest keep View + an icon cart. Reads
 * `artifact.data.items`. Items may carry agent-written `badge`/`pitch`.
 */
import { css } from "@emotion/react";
import { tokens } from "../../ui/tokens.js";
import { cardShell } from "../../ui/shell.js";
import { Badge, CartButton, CartIconButton, ProductThumb, TypeLabel, ViewButton, MatchBadge, badgeTone, formatPrice, } from "./shared.js";
function Row({ item, rank, top }) {
    const priceStr = formatPrice(item.price, item.currency);
    return (_jsxs("div", { css: css `
        display: grid;
        grid-template-columns: 60px 1fr;
        gap: 10px;
        padding: 10px;
        background: ${tokens.color.bg};
        border: 1px solid ${tokens.color.border};
        border-left: ${top ? `3px solid ${tokens.brand.primary}` : `1px solid ${tokens.color.border}`};
        border-radius: ${top ? "0 12px 12px 0" : tokens.radius.lg};
      `, children: [_jsxs("div", { children: [_jsx(ProductThumb, { image: item.image, alt: item.title, ratio: "1/1" }), _jsxs("div", { css: css `font-size: 10px; color: ${tokens.color.textSecondary}; text-align: center; margin-top: 4px;`, children: ["#", rank] })] }), _jsxs("div", { css: css `min-width: 0;`, children: [(item.badge || item.match_label) && (_jsxs("div", { css: css `margin-bottom: 4px; display: flex; gap: 4px; flex-wrap: wrap;`, children: [_jsx(MatchBadge, { label: item.match_label }), item.badge && _jsx(Badge, { label: item.badge, tone: badgeTone(item.badge) })] })), _jsx("div", { css: css `font-size: 13px; font-weight: 500; line-height: 1.3;`, children: item.title ?? "Product" }), item.brand && _jsx("div", { css: css `font-size: 10px; color: ${tokens.color.textSecondary};`, children: item.brand }), item.pitch && _jsx("div", { css: css `font-size: 11px; color: ${tokens.color.textSecondary}; line-height: 1.4; margin-top: 4px;`, children: item.pitch }), _jsxs("div", { css: css `display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px;`, children: [priceStr && _jsx("span", { css: css `font-size: 14px; font-weight: 600;`, children: priceStr }), _jsxs("div", { css: css `display: flex; gap: 6px; align-items: center;`, children: [_jsx(ViewButton, { url: item.url }), top ? _jsx(CartButton, { item: item }) : _jsx(CartIconButton, { item: item })] })] })] })] }));
}
export function RecommendationCard({ artifact }) {
    const items = artifact.data?.items ?? [];
    if (!items.length)
        return null;
    return (_jsxs("div", { css: cardShell, children: [_jsx(TypeLabel, { children: artifact.title ?? "Top picks" }), _jsx("div", { css: css `display: flex; flex-direction: column; gap: 8px;`, children: items.map((item, i) => (_jsx(Row, { item: item, rank: i + 1, top: i === 0 }, item.doc_id ?? i))) })] }));
}
//# sourceMappingURL=RecommendationCard.js.map