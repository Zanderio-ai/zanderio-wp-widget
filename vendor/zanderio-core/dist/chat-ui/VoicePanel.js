import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/VoicePanel
 * @description Composer overlay shown while recording or transcribing voice.
 *
 * Renders the card only — the host places it where its text input goes and
 * owns the spacing around it.
 *
 * Replaces the text input bar for the two transient voice states:
 *   - recording:    animated waveform + "Listening… Tap to stop" + Cancel + Stop
 *   - transcribing: spinner + "Understanding your question…" (or "Sending
 *                   voice message…" when the recording is sent as one)
 * Both are announced via an aria-live region; the waveform/spinner honor
 * prefers-reduced-motion. With `compact` (narrow screens) the secondary hint is
 * dropped and spacing tightens so nothing overflows.
 */
import { css, keyframes } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
const BG = `var(--z-bg, ${tokens.color.bg})`;
const BORDER = `var(--z-border, ${tokens.color.border})`;
const TEXT = `var(--z-text, ${tokens.color.text})`;
const TEXT_SECONDARY = `var(--z-text-secondary, ${tokens.color.textSecondary})`;
const card = (compact) => css `
  display: flex;
  align-items: center;
  gap: ${compact ? "6px" : "10px"};
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid ${BORDER};
  border-radius: 22px;
  padding: ${compact ? "6px 6px 6px 12px" : "8px 8px 8px 14px"};
  background: ${BG};
`;
const wave = keyframes `
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;
// Gentler amplitude for reduced-motion users — still moving (the waveform is
// essential "recording in progress" feedback), just calmer and slower.
const waveGentle = keyframes `
  0%, 100% { transform: scaleY(0.65); }
  50% { transform: scaleY(0.85); }
`;
const spin = keyframes `
  to { transform: rotate(360deg); }
`;
// The waveform + label together act as the primary "tap to stop" target.
const stopTarget = (brandColor) => css `
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  &:focus-visible {
    outline: 2px solid ${brandColor};
    outline-offset: 2px;
    border-radius: 8px;
  }
`;
// Explicit bar height (not 100%): percentage heights on flex items in a
// non-stretch flex container collapse to 0 on mobile Safari, which would hide
// the whole animation. A fixed height keeps the bars visible everywhere.
const waveform = (brandColor) => css `
  display: flex;
  align-items: center;
  gap: 3px;
  height: 22px;
  flex-shrink: 0;
  span {
    display: block;
    width: 3px;
    border-radius: 2px;
    background: ${brandColor};
    transform-origin: center;
    animation: ${wave} 0.9s ease-in-out infinite;
    will-change: transform;
  }
  /* Varied base heights give the moving bars an equalizer-like arch. */
  span:nth-of-type(1) { height: 10px; animation-delay: 0s; }
  span:nth-of-type(2) { height: 16px; animation-delay: 0.15s; }
  span:nth-of-type(3) { height: 20px; animation-delay: 0.3s; }
  span:nth-of-type(4) { height: 16px; animation-delay: 0.45s; }
  span:nth-of-type(5) { height: 10px; animation-delay: 0.6s; }
  @media (prefers-reduced-motion: reduce) {
    span {
      animation-name: ${waveGentle};
      animation-duration: 1.8s;
    }
  }
`;
// Live waveform: one bar per loudness reading, newest on the right, so the
// shape scrolls left as the visitor keeps talking.
const liveWaveform = (brandColor) => css `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  height: 22px;
  width: 110px;
  flex-shrink: 1;
  min-width: 40px;
  overflow: hidden;
  span {
    display: block;
    flex: 0 0 2px;
    min-height: 2px;
    border-radius: 1px;
    background: ${brandColor};
    transition: height 80ms linear;
  }
  @media (prefers-reduced-motion: reduce) {
    span {
      transition: none;
    }
  }
`;
const label = css `
  font-size: 14px;
  color: ${TEXT};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  b {
    font-weight: 600;
  }
  small {
    font-size: 14px;
    color: ${TEXT_SECONDARY};
    margin-left: 6px;
  }
`;
const cancelBtn = css `
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: ${TEXT_SECONDARY};
  font-size: 13px;
  font-family: inherit;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    color: ${TEXT};
  }
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;
const roundBtn = (brandColor, compact) => css `
  flex-shrink: 0;
  width: ${compact ? "36px" : "40px"};
  height: ${compact ? "36px" : "40px"};
  border: none;
  border-radius: 50%;
  background: color-mix(in srgb, ${brandColor} 12%, transparent);
  color: ${brandColor};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s ease;
  &:active {
    transform: scale(0.94);
  }
  &:focus-visible {
    outline: 2px solid ${brandColor};
    outline-offset: 2px;
  }
`;
const spinner = (brandColor) => css `
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, ${brandColor} 20%, transparent);
  border-top-color: ${brandColor};
  animation: ${spin} 0.8s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`;
export function VoicePanel({ mode, brandColor, compact, onStop, onCancel, voiceMessage, levels, }) {
    if (mode === "transcribing") {
        return (_jsxs("div", { css: card(compact), role: "status", "aria-live": "polite", children: [_jsx("span", { css: spinner(brandColor), "aria-hidden": "true" }), _jsx("span", { css: label, children: voiceMessage ? "Sending voice message…" : "Understanding your question…" })] }));
    }
    return (_jsxs("div", { css: card(compact), role: "status", "aria-live": "polite", children: [_jsxs("button", { type: "button", css: stopTarget(brandColor), onClick: onStop, "aria-label": "Stop recording", children: [levels && levels.length > 0 ? (_jsx("span", { css: liveWaveform(brandColor), "aria-hidden": "true", children: levels.map((level, i) => (_jsx("span", { style: { height: `${Math.max(9, level * 100)}%` } }, i))) })) : (_jsxs("span", { css: waveform(brandColor), "aria-hidden": "true", children: [_jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {}), _jsx("span", {})] })), _jsxs("span", { css: label, children: [_jsx("b", { children: voiceMessage ? "Recording…" : "Listening…" }), !compact && _jsx("small", { children: "Tap to stop" })] })] }), _jsx("button", { type: "button", css: cancelBtn, onClick: onCancel, children: "Cancel" }), _jsx("button", { type: "button", css: roundBtn(brandColor, compact), onClick: onStop, "aria-label": "Stop and send", children: _jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2.5", fill: "currentColor" }) }) })] }));
}
//# sourceMappingURL=VoicePanel.js.map