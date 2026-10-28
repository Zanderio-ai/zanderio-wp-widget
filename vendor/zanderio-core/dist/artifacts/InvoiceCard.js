import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/InvoiceCard
 * @description Invoice artifact — a compact list of invoices with amount,
 * status, and a download link. Accepts `data.invoices`, a bare array, or a
 * single object.
 */
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel, cardTitle } from "../ui/shell.js";
function toList(data) {
    const d = data;
    if (Array.isArray(d?.invoices))
        return d.invoices;
    if (Array.isArray(d))
        return d;
    return d ? [d] : [];
}
export function InvoiceCard({ artifact }) {
    const invoices = toList(artifact.data);
    return (_jsxs("div", { css: [panel, css `max-width: 380px;`], children: [_jsx("div", { css: [cardTitle, css `margin-bottom: 10px;`], children: artifact.title ?? "Invoices" }), invoices.length === 0 ? (_jsx("div", { css: css `font-size: 13px; color: ${tokens.color.textSecondary};`, children: "No invoices found." })) : (_jsx("div", { css: css `display: flex; flex-direction: column; gap: 8px;`, children: invoices.map((inv, i) => {
                    const number = inv.stripeInvoiceId ?? inv.invoice_number ?? inv.number ?? inv.id ?? "—";
                    const paid = inv.status?.toLowerCase() === "paid";
                    const href = inv.pdfUrl ?? inv.hostedUrl ?? inv.url;
                    return (_jsxs("div", { css: css `
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 10px;
                  border: 1px solid ${tokens.color.border};
                  border-radius: 8px;
                  font-size: 13px;
                `, children: [_jsxs("div", { css: css `flex: 1; min-width: 0;`, children: [_jsx("div", { css: css `font-weight: 600;`, children: number }), _jsx("div", { css: css `font-size: 11px; color: ${tokens.color.textSecondary};`, children: inv.planName ?? inv.description ?? "" })] }), _jsxs("span", { css: css `font-weight: 500;`, children: [inv.amount, inv.currency ? ` ${inv.currency.toUpperCase()}` : ""] }), _jsx("span", { css: css `font-size: 11px; font-weight: 600; color: ${paid ? tokens.color.success : tokens.color.warning};`, children: inv.status ?? "" }), href && (_jsx("a", { href: href, target: "_blank", rel: "noopener noreferrer", css: css `font-size: 12px; color: ${tokens.brand.primary}; font-weight: 600;`, children: "Download" }))] }, i));
                }) }))] }));
}
//# sourceMappingURL=InvoiceCard.js.map