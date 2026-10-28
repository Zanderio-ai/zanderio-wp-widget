import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/ActionCard
 * @description Single call-to-action artifact (book / open / etc.).
 */
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel, cardTitle } from "../ui/shell.js";
export function ActionCard({ artifact }) {
    const data = artifact.data;
    if (!data)
        return null;
    const action = data;
    const label = action.label ?? artifact.title ?? "Action";
    const url = action.url;
    const secondary = action.style === "secondary";
    const styles = css `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid ${secondary ? tokens.color.border : tokens.brand.primary};
    background: ${secondary ? tokens.color.grey[50] : tokens.brand.primary};
    color: ${secondary ? tokens.color.text : "#fff"};
  `;
    return (_jsxs("div", { css: panel, children: [artifact.title && artifact.title !== label && (_jsx("div", { css: [cardTitle, css `margin-bottom: 10px;`], children: artifact.title })), url ? (_jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", css: styles, children: label })) : (_jsx("button", { type: "button", css: styles, children: label }))] }));
}
//# sourceMappingURL=ActionCard.js.map