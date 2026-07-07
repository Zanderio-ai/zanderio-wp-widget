/**
 * @module ui/VoicePanel
 * @description Composer overlay shown while recording or transcribing voice.
 *
 * Replaces the text input bar for the two transient voice states:
 *   - recording:    animated waveform + "Listening… Tap to stop" + Cancel + Stop
 *   - transcribing: spinner + "Understanding your question…"
 * Both are announced via an aria-live region; the waveform/spinner honor
 * prefers-reduced-motion. Layout is responsive — on narrow (mobile) widths the
 * secondary hint is dropped and spacing tightens so nothing overflows.
 */

import { css, keyframes } from "@emotion/react";

interface VoicePanelProps {
  mode: "recording" | "transcribing";
  brandColor: string;
  isMobile?: boolean;
  /** Stop recording and transcribe (only used in recording mode). */
  onStop?: () => void;
  /** Discard the recording and return to the text input (recording mode). */
  onCancel?: () => void;
}

const wrap = css`
  padding: 12px;
  border-top: 1px solid var(--z-border);
  background: var(--z-bg);
  flex-shrink: 0;
`;

const card = (isMobile?: boolean) => css`
  display: flex;
  align-items: center;
  gap: ${isMobile ? "6px" : "10px"};
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--z-border);
  border-radius: 22px;
  padding: ${isMobile ? "6px 6px 6px 12px" : "8px 8px 8px 14px"};
  background: var(--z-bg);
`;

const wave = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;

// Gentler amplitude for reduced-motion users — still moving (the waveform is
// essential "recording in progress" feedback), just calmer and slower.
const waveGentle = keyframes`
  0%, 100% { transform: scaleY(0.65); }
  50% { transform: scaleY(0.85); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// The waveform + label together act as the primary "tap to stop" target.
const stopTarget = (brandColor: string) => css`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  font-family: var(--z-font);
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
const waveform = (brandColor: string) => css`
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

const label = css`
  font-size: 14px;
  color: var(--z-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  b {
    font-weight: 600;
  }
  small {
    font-size: 14px;
    color: var(--z-text-secondary, #6b7280);
    margin-left: 6px;
  }
`;

const cancelBtn = css`
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--z-text-secondary, #6b7280);
  font-size: 13px;
  font-family: var(--z-font);
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 8px;
  &:hover {
    color: var(--z-text);
  }
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

const roundBtn = (brandColor: string, isMobile?: boolean) => css`
  flex-shrink: 0;
  width: ${isMobile ? "36px" : "40px"};
  height: ${isMobile ? "36px" : "40px"};
  border: none;
  border-radius: 50%;
  background: ${brandColor}1f;
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

const spinner = (brandColor: string) => css`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid ${brandColor}33;
  border-top-color: ${brandColor};
  animation: ${spin} 0.8s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`;

export function VoicePanel({ mode, brandColor, isMobile, onStop, onCancel }: VoicePanelProps) {
  if (mode === "transcribing") {
    return (
      <div css={wrap}>
        <div css={card(isMobile)} role="status" aria-live="polite">
          <span css={spinner(brandColor)} aria-hidden="true" />
          <span css={label}>Understanding your question…</span>
        </div>
      </div>
    );
  }

  return (
    <div css={wrap}>
      <div css={card(isMobile)} role="status" aria-live="polite">
        <button type="button" css={stopTarget(brandColor)} onClick={onStop} aria-label="Stop recording">
          <span css={waveform(brandColor)} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
          <span css={label}>
            <b>Listening…</b>
            {!isMobile && <small>Tap to stop</small>}
          </span>
        </button>
        <button type="button" css={cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          css={roundBtn(brandColor, isMobile)}
          onClick={onStop}
          aria-label="Stop and send"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
