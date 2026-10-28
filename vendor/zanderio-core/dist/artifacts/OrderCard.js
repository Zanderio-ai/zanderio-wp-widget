import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/OrderCard
 * @description Order-status artifact — line items, total, tracking. Reads
 * `artifact.data.{order_id,status,items,total,currency,tracking_*,carrier,...}`.
 */
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel, headerRow, cardTitle } from "../ui/shell.js";
const STATUS_COLORS = {
    delivered: tokens.color.success,
    shipped: tokens.brand.primary,
    processing: tokens.color.warning,
    cancelled: tokens.color.error,
};
export function OrderCard({ artifact }) {
    const data = (artifact.data ?? {});
    const status = data.status ?? "";
    const items = data.items ?? [];
    const total = data.total;
    const currency = data.currency ?? "USD";
    const sym = currency === "USD" ? "$" : `${currency} `;
    const trackingNumber = data.tracking_number;
    const trackingUrl = data.tracking_url;
    const statusColor = STATUS_COLORS[status.toLowerCase()] ?? tokens.color.grey[400];
    return (_jsxs("div", { css: panel, children: [_jsxs("div", { css: headerRow, children: [_jsx("span", { css: cardTitle, children: artifact.title ?? `Order ${data.order_id ?? ""}` }), status && (_jsx("span", { css: css `font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; color: #fff; background: ${statusColor};`, children: status }))] }), items.length > 0 && (_jsx("div", { css: css `margin: 10px 0;`, children: items.map((it, i) => (_jsxs("div", { css: css `
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                font-size: 13px;
                color: ${tokens.color.textSecondary};
                border-bottom: ${i < items.length - 1 ? `1px solid ${tokens.color.border}` : "none"};
              `, children: [_jsxs("span", { children: [it.name ?? it.title ?? "Item", " \u00D7 ", it.quantity ?? 1] }), it.price != null && _jsxs("span", { css: css `font-weight: 500; color: ${tokens.color.text};`, children: [sym, it.price.toFixed(2)] })] }, i))) })), total != null && _jsxs("div", { css: css `font-size: 13px; font-weight: 700; margin-bottom: 8px;`, children: ["Total: ", sym, total.toFixed(2)] }), trackingNumber && (_jsxs("div", { css: css `display: flex; align-items: center; gap: 6px; padding: 8px; background: ${tokens.color.grey[50]}; border-radius: 8px; font-size: 12px; color: ${tokens.color.textSecondary};`, children: [_jsxs("span", { children: ["\uD83D\uDCE6 ", trackingNumber] }), trackingUrl && (_jsx("a", { href: trackingUrl, target: "_blank", rel: "noopener noreferrer", css: css `margin-left: auto; font-weight: 600; color: ${tokens.brand.primary};`, children: "Track" }))] }))] }));
}
//# sourceMappingURL=OrderCard.js.map