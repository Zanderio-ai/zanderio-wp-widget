import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/VoiceErrorBanner
 * @description Inline voice-input error, shown above the composer. Announced
 * via role=alert. Renders the card only; the host owns the spacing around it.
 */
import { css } from "@emotion/react";
const card = css `
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fecdca;
  background: #fef3f2;
  border-radius: 12px;
  padding: 10px 12px;
`;
const text = css `
  font-size: 13px;
  line-height: 1.4;
  color: #b42318;
`;
const icon = css `
  flex-shrink: 0;
`;
export function VoiceErrorBanner({ message }) {
    return (_jsxs("div", { css: card, role: "alert", children: [_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", css: icon, children: _jsx("path", { d: "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z", stroke: "#b42318", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsx("span", { css: text, children: message })] }));
}
//# sourceMappingURL=VoiceErrorBanner.js.map