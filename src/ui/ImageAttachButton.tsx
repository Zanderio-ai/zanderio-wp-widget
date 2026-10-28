/**
 * @module ui/ImageAttachButton
 * @description Photo button docked inside the input field — opens the file
 * picker for a photo search.
 *
 * The chosen photo is previewed above the composer and only uploaded when the
 * visitor sends. The caller only renders this when the merchant has photo
 * search on, so the composer is unchanged otherwise.
 */

import { useRef } from "react";
import { css } from "@emotion/react";
import { IMAGE_ACCEPT } from "@/core/visitor-image";

interface ImageAttachButtonProps {
  brandColor: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
}

const photoBtn = (brandColor: string, active: boolean) => css`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${active ? "var(--z-text-secondary, #6b7280)" : "var(--z-text-disabled)"};
  cursor: ${active ? "pointer" : "default"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  &:hover {
    background: ${active ? "var(--z-bg-muted)" : "transparent"};
  }
  &:focus-visible {
    outline: 2px solid ${brandColor};
    outline-offset: 2px;
  }
`;

export function ImageAttachButton({ brandColor, disabled, onSelect }: ImageAttachButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so choosing the same photo again still fires onChange.
          e.target.value = "";
          if (file) onSelect(file);
        }}
      />
      <button
        type="button"
        aria-label="Search with a photo"
        title="Search with a photo"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        css={photoBtn(brandColor, !disabled)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 5l1.5-2h5L16 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
