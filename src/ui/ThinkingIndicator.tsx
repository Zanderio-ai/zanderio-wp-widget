/**
 * @module ui/ThinkingIndicator
 * @description Three-dot pulse shown while the assistant is streaming, with
 * an optional "what's happening" label (e.g. "Searching your products…").
 *
 * Per product direction this is a 3-dot bounce, never a blinking cursor. The
 * label always shows when present — no click-to-reveal — falling back to
 * "Thinking…" otherwise.
 */

import { css } from "@emotion/react";

const wrap = css`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  width: fit-content;
  border-radius: var(--z-radius-lg);
  background: var(--z-bg-muted);
`;

const dot = (brandColor: string, delay: number) => css`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${brandColor};
  animation: z-bounce-dot 1.4s ${delay}s infinite ease-in-out both;
`;

const label = css`
  font-size: 12px;
  font-weight: 600;
  color: var(--z-text-secondary, #6b7280);
  margin-left: 2px;
`;

export function ThinkingIndicator({ brandColor, label: text }: { brandColor: string; label?: string | null }) {
  return (
    <div css={wrap} aria-label={text ?? "Assistant is typing"}>
      {[0, 0.16, 0.32].map((d) => (
        <span key={d} css={dot(brandColor, d)} />
      ))}
      <span css={label}>{text ?? "Thinking…"}</span>
    </div>
  );
}
