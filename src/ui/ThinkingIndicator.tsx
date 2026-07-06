/**
 * @module ui/ThinkingIndicator
 * @description Three-dot pulse shown while the assistant is streaming.
 *
 * Per product direction this is a 3-dot bounce, never a blinking cursor.
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

export function ThinkingIndicator({ brandColor }: { brandColor: string }) {
  return (
    <div css={wrap} aria-label="Assistant is typing">
      {[0, 0.16, 0.32].map((d) => (
        <span key={d} css={dot(brandColor, d)} />
      ))}
    </div>
  );
}
