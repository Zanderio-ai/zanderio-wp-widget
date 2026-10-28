import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/FallbackCard
 * @description Renderer for artifact types without a dedicated layout — shows
 * the title/subtitle and the raw type so unknown artifacts degrade gracefully.
 */
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel, headerRow, cardTitle } from "../ui/shell.js";
export function FallbackCard({ artifact }) {
    if (!artifact.title && !artifact.subtitle)
        return null;
    return (_jsxs("div", { css: panel, children: [_jsxs("div", { css: headerRow, children: [_jsx("span", { css: cardTitle, children: artifact.title ?? "Content" }), artifact.type && (_jsx("span", { css: css `font-size: 10px; color: ${tokens.color.textSecondary}; border: 1px solid ${tokens.color.border}; border-radius: 6px; padding: 2px 6px;`, children: artifact.type }))] }), artifact.subtitle && _jsx("div", { css: css `font-size: 13px; color: ${tokens.color.textSecondary}; margin-top: 6px;`, children: artifact.subtitle })] }));
}
//# sourceMappingURL=FallbackCard.js.map