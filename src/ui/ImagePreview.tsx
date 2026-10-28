/**
 * @module ui/ImagePreview
 * @description The photo chosen for the next message, above the composer —
 * with a way to remove it, and a spinner while it is being checked.
 */

import { css, keyframes } from "@emotion/react";

interface ImagePreviewProps {
  previewUrl: string;
  uploading: boolean;
  onRemove: () => void;
}

const wrap = css`
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 0 8px 4px;
  flex-shrink: 0;
`;

const thumb = (uploading: boolean) => css`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  border: 1px solid var(--z-border);
  opacity: ${uploading ? 0.5 : 1};
`;

const removeBtn = css`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #374151;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const spinner = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: var(--z-primary);
  animation: ${spin} 0.8s linear infinite;
`;

export function ImagePreview({ previewUrl, uploading, onRemove }: ImagePreviewProps) {
  return (
    <div css={wrap}>
      <img src={previewUrl} alt="Photo to send" css={thumb(uploading)} />
      {uploading ? (
        <span css={spinner} role="status" aria-label="Checking your photo" />
      ) : (
        <button type="button" css={removeBtn} onClick={onRemove} aria-label="Remove photo">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
