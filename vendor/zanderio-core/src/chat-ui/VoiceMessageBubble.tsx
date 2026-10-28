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
import type { VoiceAudio } from "../chat/types.js";
import { voiceBars } from "../chat/voice.js";
import { useVoicePlayback, voicePlayer } from "./voice-player.js";

export interface VoiceMessageBubbleProps {
  audio: VoiceAudio;
  /** Assistant messages sit on a neutral surface; the visitor's on the brand colour. */
  isBot: boolean;
  brandColor: string;
}

const MUTED_BG = `var(--z-bg-muted, ${tokens.color.bgMuted})`;
const TEXT = `var(--z-text, ${tokens.color.text})`;

const wrap = (isBot: boolean, brandColor: string) => css`
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

const button = (isBot: boolean, brandColor: string) => css`
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

const body = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const waveform = css`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 24px;
`;

// Bars the playhead has passed are solid; the rest are faded.
const bar = (played: boolean) => css`
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

const footer = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const meta = css`
  font-size: 11px;
  line-height: 1;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
`;

// Sent/received time and the mic mark, together at the bubble's trailing edge.
const stamp = css`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const spinner = css`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, currentColor 30%, transparent);
  border-top-color: currentColor;
  animation: ${spin} 0.8s linear infinite;
`;

function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Time of day a voice message was sent or received, e.g. "5:07 PM". */
function timeOfDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function VoiceMessageBubble({ audio, isBot, brandColor }: VoiceMessageBubbleProps) {
  const playback = useVoicePlayback(audio.audio_id);
  const playing = playback.status === "playing";
  const active = playing || (playback.status === "paused" && playback.positionMs > 0);
  const progress =
    audio.duration_ms > 0 ? Math.min(1, playback.positionMs / audio.duration_ms) : playing ? 1 : 0;
  const bars = useMemo(() => voiceBars(audio), [audio]);
  const sentAt = timeOfDay(audio.created_at);

  return (
    <div css={wrap(isBot, brandColor)} role="group" aria-label="Voice message">
      <button
        type="button"
        css={button(isBot, brandColor)}
        onClick={() => voicePlayer.toggle(audio.audio_id)}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playback.status === "loading" ? (
          <span css={spinner} aria-hidden="true" />
        ) : playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div css={body}>
        <div css={waveform} aria-hidden="true">
          {bars.map((height, i) => (
            <span
              key={i}
              css={bar(active && (i + 1) / bars.length <= progress)}
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
        <div css={footer}>
          <span css={meta} role={playback.status === "error" ? "alert" : undefined}>
            {playback.status === "error"
              ? "Couldn't play — tap to retry"
              : clock(active ? playback.positionMs : audio.duration_ms)}
          </span>
          <span css={stamp}>
            {sentAt && <span css={meta}>{sentAt}</span>}
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" opacity="0.8">
              <path
                fill="currentColor"
                d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

const failed = css`
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

const retry = (brandColor: string) => css`
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

/**
 * Stands in for a voice reply that could not be created. Voice-to-voice
 * answers a voice message with a voice message, so the written answer is not
 * shown in its place — the visitor asks for the voice again instead.
 */
export interface VoiceReplyFailedProps {
  brandColor: string;
  onRetry: () => void;
}

export function VoiceReplyFailed({ brandColor, onRetry }: VoiceReplyFailedProps) {
  return (
    <div css={failed} role="alert">
      <span>Voice reply couldn&apos;t be sent.</span>
      <button type="button" css={retry(brandColor)} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
