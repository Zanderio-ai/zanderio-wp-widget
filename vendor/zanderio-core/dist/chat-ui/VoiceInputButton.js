import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/VoiceInputButton
 * @description Mic button docked inside the input field — starts a recording.
 *
 * Purely presentational: recording/transcribing/error states are handled by
 * the composer (VoicePanel / VoiceErrorBanner). The caller only renders this
 * when voice is enabled and the browser supports recording, so text input is
 * always the fallback.
 */
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
const TEXT_SECONDARY = `var(--z-text-secondary, ${tokens.color.textSecondary})`;
const TEXT_DISABLED = `var(--z-text-disabled, ${tokens.color.textDisabled})`;
const MUTED_BG = `var(--z-bg-muted, ${tokens.color.bgMuted})`;
const micBtn = (brandColor, active) => css `
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${active ? TEXT_SECONDARY : TEXT_DISABLED};
  cursor: ${active ? "pointer" : "default"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover {
    background: ${active ? MUTED_BG : "transparent"};
  }
  &:focus-visible {
    outline: 2px solid ${brandColor};
    outline-offset: 2px;
  }
`;
export function VoiceInputButton({ brandColor, disabled, onStart }) {
    return (_jsx("button", { type: "button", "aria-label": "Start voice input", disabled: disabled, onClick: onStart, css: micBtn(brandColor, !disabled), children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true", children: [_jsx("path", { d: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z", stroke: "currentColor", strokeWidth: "2" }), _jsx("path", { d: "M19 11a7 7 0 0 1-14 0M12 18v3", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })] }) }));
}
//# sourceMappingURL=VoiceInputButton.js.map