/**
 * @module ui/ImageMessageBubble
 * @description The visitor's photo in the transcript — a placeholder while it
 * loads, and a note when it can no longer be shown.
 */

import { css } from "@emotion/react";
import type { VisitorImage } from "@zanderio/core/chat";
import { useVisitorImage } from "@/core/visitor-image";

interface ImageMessageBubbleProps {
  image: VisitorImage;
  token: string | null;
}

const frame = css`
  width: 200px;
  max-width: 85%;
  border-radius: 14px 14px 4px 14px;
  overflow: hidden;
  background: var(--z-bg-muted);
  border: 1px solid var(--z-border);
`;

const photo = css`
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  display: block;
`;

const placeholder = css`
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--z-text-disabled);
`;

export function ImageMessageBubble({ image, token }: ImageMessageBubbleProps) {
  const { url, failed } = useVisitorImage(image.image_id, token);

  return (
    <div css={frame} role="group" aria-label="Photo">
      {url ? (
        <img src={url} alt="Your photo" css={photo} />
      ) : (
        <div css={placeholder} aria-busy={!failed}>
          {failed ? "Photo unavailable" : null}
        </div>
      )}
    </div>
  );
}
