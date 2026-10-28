import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/VoiceMessageBubble
 * @description A voice message in the transcript — play/pause, a waveform
 * that fills as it plays, and the length.
 *
 * Used for both sides of a voice-to-voice turn: the visitor's recording and
 * the assistant's spoken reply, in the widget and in the dashboard. The length
 * comes from the message itself, not the audio element — recordings straight
 * from MediaRecorder carry no duration metadata, so the element can't be
 * trusted to report one.
 *
 * Playback goes through `voicePlayer`, so the host must have given it a loader
 * (`voicePlayer.setLoader`). Surfaces read the host's `--z-bg-muted` /
 * `--z-text` variables, with the tokens as fallback.
 */
import { useMemo } from "react";
import { css, keyframes } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { voiceBars } from "../chat/voice.js";
import { useVoicePlayback, voicePlayer } from "./voice-player.js";
const MUTED_BG = `var(--z-bg-muted, ${tokens.color.bgMuted})`;
const TEXT = `var(--z-text, ${tokens.color.text})`;
const wrap = (isBot, brandColor) => css `
  display: flex;
  align-items: center;
  gap: 10px;
  width: 250px;
  max-width: 85%;
  box-sizing: border-box;
  padding: 8px 12px 8px 8px;
  border-radius: ${isBot ? "4px 14px 14px 14px" : "14px 14px 4px 14px"};
  background: ${isBot ? MUTED_BG : brandColor};
  color: ${isBot ? TEXT : "#fff"};
`;
const button = (isBot, brandColor) => css `
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: ${isBot ? brandColor : "#fff"};
  color: ${isBot ? "#fff" : brandColor};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s ease;
  &:active {
    transform: scale(0.94);
  }
  &:focus-visible {
    outline: 2px solid ${isBot ? brandColor : "#fff"};
    outline-offset: 2px;
  }
`;
const body = css `
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const waveform = css `
  display: flex;
  align-items: center;
  gap: 2px;
  height: 24px;
`;
// Bars the playhead has passed are solid; the rest are faded.
const bar = (played) => css `
  flex: 1;
  min-width: 2px;
  border-radius: 2px;
  background: currentColor;
  opacity: ${played ? 1 : 0.35};
  transition: opacity 0.15s linear;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const footer = css `
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const meta = css `
  font-size: 11px;
  line-height: 1;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
`;
// Sent/received time and the mic mark, together at the bubble's trailing edge.
const stamp = css `
  display: flex;
  align-items: center;
  gap: 4px;
`;
const spin = keyframes `
  to { transform: rotate(360deg); }
`;
const spinner = css `
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, currentColor 30%, transparent);
  border-top-color: currentColor;
  animation: ${spin} 0.8s linear infinite;
`;
function clock(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
/** Time of day a voice message was sent or received, e.g. "5:07 PM". */
function timeOfDay(iso) {
    if (!iso)
        return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()))
        return null;
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
export function VoiceMessageBubble({ audio, isBot, brandColor }) {
    const playback = useVoicePlayback(audio.audio_id);
    const playing = playback.status === "playing";
    const active = playing || (playback.status === "paused" && playback.positionMs > 0);
    const progress = audio.duration_ms > 0 ? Math.min(1, playback.positionMs / audio.duration_ms) : playing ? 1 : 0;
    const bars = useMemo(() => voiceBars(audio), [audio]);
    const sentAt = timeOfDay(audio.created_at);
    return (_jsxs("div", { css: wrap(isBot, brandColor), role: "group", "aria-label": "Voice message", children: [_jsx("button", { type: "button", css: button(isBot, brandColor), onClick: () => voicePlayer.toggle(audio.audio_id), "aria-label": playing ? "Pause voice message" : "Play voice message", children: playback.status === "loading" ? (_jsx("span", { css: spinner, "aria-hidden": "true" })) : playing ? (_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("rect", { x: "6", y: "5", width: "4", height: "14", rx: "1", fill: "currentColor" }), _jsx("rect", { x: "14", y: "5", width: "4", height: "14", rx: "1", fill: "currentColor" })] })) : (_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M8 5v14l11-7z", fill: "currentColor" }) })) }), _jsxs("div", { css: body, children: [_jsx("div", { css: waveform, "aria-hidden": "true", children: bars.map((height, i) => (_jsx("span", { css: bar(active && (i + 1) / bars.length <= progress), style: { height: `${height * 100}%` } }, i))) }), _jsxs("div", { css: footer, children: [_jsx("span", { css: meta, role: playback.status === "error" ? "alert" : undefined, children: playback.status === "error"
                                    ? "Couldn't play — tap to retry"
                                    : clock(active ? playback.positionMs : audio.duration_ms) }), _jsxs("span", { css: stamp, children: [sentAt && _jsx("span", { css: meta, children: sentAt }), _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", "aria-hidden": "true", opacity: "0.8", children: _jsx("path", { fill: "currentColor", d: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z" }) })] })] })] })] }));
}
const failed = css `
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 85%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 4px 14px 14px 14px;
  background: ${MUTED_BG};
  color: ${TEXT};
  font-size: 13px;
`;
const retry = (brandColor) => css `
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 2px 0;
  color: ${brandColor};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid ${brandColor};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;
export function VoiceReplyFailed({ brandColor, onRetry }) {
    return (_jsxs("div", { css: failed, role: "alert", children: [_jsx("span", { children: "Voice reply couldn't be sent." }), _jsx("button", { type: "button", css: retry(brandColor), onClick: onRetry, children: "Try again" })] }));
}
//# sourceMappingURL=VoiceMessageBubble.js.map