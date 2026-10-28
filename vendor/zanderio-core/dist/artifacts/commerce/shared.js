import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
import { css } from "@emotion/react";
import { tokens } from "../../ui/tokens.js";
import { useCartSheet } from "./CartSheet.js";
export function formatPrice(price, currency) {
    if (price == null)
        return null;
    const code = currency && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : "USD";
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price);
    }
    catch {
        return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    }
}
// Declared as a literal (not Record<string, …>) so `BADGE_TONES[tone]` resolves
// to a concrete tone under noUncheckedIndexedAccess rather than `… | undefined`.
const BADGE_TONES = {
    stock: { bg: "#EAF3DE", fg: "#27500A" },
    sale: { bg: "#FAEEDA", fg: "#633806" },
    best: { bg: "#EEEDFE", fg: "#3C3489" },
    value: { bg: "#E1F5EE", fg: "#085041" },
    budget: { bg: "#F1EFE8", fg: "#444441" },
};
export function badgeTone(label) {
    const l = (label ?? "").toLowerCase();
    if (l.includes("value"))
        return "value";
    if (l.includes("budget"))
        return "budget";
    if (l.includes("stock"))
        return "stock";
    if (l.includes("sale") || l.includes("off"))
        return "sale";
    return "best";
}
export function Badge({ label, tone = "best" }) {
    // Redundant under the type, kept for parity with the previous implementation:
    // an untyped caller passing an unknown tone still degrades to `best` rather
    // than throwing on `t.bg`.
    const t = BADGE_TONES[tone] ?? BADGE_TONES.best;
    return (_jsx("span", { css: css `
        display: inline-block;
        background: ${t.bg};
        color: ${t.fg};
        font-size: 10px;
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 6px;
        line-height: 1.4;
        white-space: nowrap;
      `, children: label }));
}
const MATCH_LABELS = {
    exact: "Exact match",
    similar: "Looks similar",
    related: "Related",
};
const MATCH_TONES = { exact: "stock", similar: "best", related: "budget" };
/**
 * How a product found by a photo search relates to the photo. Renders nothing
 * for cards that did not come from one.
 */
export function MatchBadge({ label }) {
    if (!label || !(label in MATCH_LABELS))
        return null;
    return _jsx(Badge, { label: MATCH_LABELS[label], tone: MATCH_TONES[label] });
}
export function ProductThumb({ image, alt, height, ratio = "16/10", children, }) {
    return (_jsxs("div", { css: css `
        position: relative;
        ${height ? `height: ${height}px;` : `aspect-ratio: ${ratio};`}
        background: ${tokens.color.grey[50]};
        border-radius: ${tokens.radius.md};
        overflow: hidden;
        flex-shrink: 0;
      `, children: [image && (_jsx("img", { src: image, alt: alt ?? "", css: css `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          `, onError: (e) => (e.target.style.display = "none") })), children] }));
}
export function SaleFlag({ discount_pct }) {
    if (!discount_pct || discount_pct <= 0)
        return null;
    return (_jsxs("span", { css: css `
        position: absolute;
        top: 5px;
        left: 5px;
        background: #1d9e75;
        color: #fff;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 4px;
      `, children: [Math.round(discount_pct), "% off"] }));
}
export function OutOfStockVeil({ in_stock }) {
    if (in_stock !== false)
        return null;
    return (_jsx("div", { css: css `
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 500;
        color: ${tokens.color.textSecondary};
      `, children: "Out of stock" }));
}
export function PriceRow({ price, price_max, compare_at_price, currency, size = 13, }) {
    const priceStr = formatPrice(price, currency);
    const compareStr = compare_at_price ? formatPrice(compare_at_price, currency) : null;
    const showFrom = price_max != null && price_max !== price;
    return (_jsxs("div", { css: css `
        display: flex;
        align-items: baseline;
        gap: 4px;
        flex-wrap: wrap;
      `, children: [showFrom && _jsx("span", { css: css `font-size: 10px; color: ${tokens.color.textSecondary};`, children: "from" }), priceStr && _jsx("span", { css: css `font-size: ${size}px; font-weight: 600;`, children: priceStr }), compareStr && (_jsx("span", { css: css `
            font-size: 10px;
            color: ${tokens.color.textDisabled};
            text-decoration: line-through;
          `, children: compareStr }))] }));
}
export function ColourSwatches({ swatches, max = 5 }) {
    if (!swatches?.length)
        return null;
    const visible = swatches.slice(0, max);
    const overflow = swatches.length - visible.length;
    return (_jsxs("div", { css: css `display: flex; align-items: center; gap: 3px; margin-top: 6px;`, children: [visible.map((s, i) => (_jsx("span", { title: s.value, css: css `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${s.hex ?? "#ccc"};
            border: 1px solid ${tokens.color.border};
            opacity: ${s.in_stock === false ? 0.3 : 1};
          ` }, i))), overflow > 0 && _jsxs("span", { css: css `font-size: 10px; color: ${tokens.color.textSecondary};`, children: ["+", overflow] })] }));
}
export function TypeLabel({ children }) {
    return (_jsx("div", { css: css `
        font-size: 11px;
        font-weight: 500;
        color: ${tokens.color.textSecondary};
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      `, children: children }));
}
const btnBase = css `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  padding: 7px 10px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
`;
export function ViewButton({ url, label = "View", fullWidth }) {
    return (_jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", "aria-disabled": !url, css: [
            btnBase,
            css `
          ${fullWidth ? "flex: 1;" : ""}
          border: 1px solid ${tokens.color.border};
          color: ${tokens.color.text};
          background: ${tokens.color.bg};
          pointer-events: ${url ? "auto" : "none"};
          opacity: ${url ? 1 : 0.5};
          &:hover {
            background: ${tokens.color.grey[50]};
          }
        `,
        ], children: label }));
}
export function CartButton({ item, label = "Add to cart", fullWidth }) {
    const openCart = useCartSheet();
    const disabled = item.in_stock === false;
    return (_jsx("button", { type: "button", disabled: disabled, onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCart(item);
        }, css: [
            btnBase,
            css `
          ${fullWidth ? "flex: 1;" : ""}
          border: none;
          color: #fff;
          background: ${tokens.color.text};
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `,
        ], children: label }));
}
export function CartIconButton({ item }) {
    const openCart = useCartSheet();
    const disabled = item.in_stock === false;
    return (_jsx("button", { type: "button", "aria-label": "Add to cart", disabled: disabled, onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCart(item);
        }, css: css `
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border: 1px solid ${tokens.color.border};
        border-radius: 8px;
        background: ${tokens.color.bg};
        color: ${tokens.color.text};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `, children: _jsx("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: _jsx("path", { d: "M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2m6 18a1 1 0 100-2 1 1 0 000 2Zm10 0a1 1 0 100-2 1 1 0 000 2Z", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) }) }));
}
//# sourceMappingURL=shared.js.map