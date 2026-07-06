/**
 * @module ui/ChatHeader
 * @description Branded header bar — logo, store name, close button.
 */

import { css } from "@emotion/react";
import type { WidgetConfig } from "@/config/types";
import type { PanelSize } from "./ChatWindow";

interface ChatHeaderProps {
  config: WidgetConfig;
  /** Hide the expand controls on mobile — the panel is always full-bleed there. */
  isMobile: boolean;
  size: PanelSize;
  onToggleExpand: () => void;
  onToggleModal: () => void;
  onClose: () => void;
}

/** Diagonal out/in arrows — the "expanded" (larger corner panel) toggle. */
function ExpandIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {expanded ? (
        <path
          d="M10 14 4 20M4 20h4M4 20v-4M14 10l6-6M20 4h-4M20 4v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M14 10l6-6M20 4h-4M20 4v4M10 14l-6 6M4 20h4M4 20v-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Corner brackets — the "modal" (large centered overlay) toggle. */
function ModalIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {active ? (
        <path
          d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const iconBtn = css`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  opacity: 0.85;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 1;
  }
`;

// Solid brand-color header — the merchant's chosen color drives the header,
// launcher, user bubble, and send button uniformly (matches the client/app
// widget preview). No tint.
const bar = (brandColor: string) => css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: ${brandColor};
  color: #fff;
  flex-shrink: 0;
`;

export function ChatHeader({
  config,
  isMobile,
  size,
  onToggleExpand,
  onToggleModal,
  onClose,
}: ChatHeaderProps) {
  return (
    <div css={bar(config.color)}>
      {config.logoUrl && (
        <img
          src={config.logoUrl}
          alt=""
          width={28}
          height={28}
          css={css`
            border-radius: 50%;
            object-fit: cover;
            background: rgba(255, 255, 255, 0.2);
          `}
        />
      )}
      <span
        css={css`
          font-weight: 600;
          font-size: 15px;
          flex: 1;
        `}
      >
        {config.name}
      </span>
      {!isMobile && (
        <>
          <button
            type="button"
            aria-label={size === "expanded" ? "Shrink chat" : "Expand chat"}
            onClick={onToggleExpand}
            css={iconBtn}
          >
            <ExpandIcon expanded={size === "expanded"} />
          </button>
          <button
            type="button"
            aria-label={size === "modal" ? "Exit full view" : "Open full view"}
            onClick={onToggleModal}
            css={iconBtn}
          >
            <ModalIcon active={size === "modal"} />
          </button>
        </>
      )}
      <button type="button" aria-label="Close chat" onClick={onClose} css={iconBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6 6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
