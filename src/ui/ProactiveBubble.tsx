/**
 * @module ui/ProactiveBubble
 * @description Proactive nudge shown above the launcher to invite a conversation.
 *
 * Driven by `WidgetConfig.proactive` (enabled / message / delaySeconds /
 * maxPerSession). Appears once the delay elapses while the window is closed,
 * respects a per-page-load display cap (in-memory ref), and is dismissable. Tapping
 * the bubble opens the chat. Mirrors the proactive behaviour of the dashboard
 * widget-appearance editor.
 */

import { useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { WidgetConfig } from "@/config/types";

interface ProactiveBubbleProps {
  config: WidgetConfig;
  brandColor: string;
  isOpen: boolean;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  onOpen: () => void;
}

export function ProactiveBubble({ config, brandColor, isOpen, position, onOpen }: ProactiveBubbleProps) {
  const { enabled, message, delaySeconds, maxPerSession } = config.proactive;
  const [visible, setVisible] = useState(false);
  const shownCount = useRef(0);

  useEffect(() => {
    if (!enabled || isOpen) return;
    if (maxPerSession > 0 && shownCount.current >= maxPerSession) return;

    const timer = setTimeout(() => {
      shownCount.current += 1;
      setVisible(true);
    }, Math.max(0, delaySeconds) * 1000);

    return () => clearTimeout(timer);
  }, [enabled, isOpen, delaySeconds, maxPerSession]);

  // The chat opening (or a fresh session render) hides the nudge.
  useEffect(() => {
    if (isOpen) setVisible(false);
  }, [isOpen]);

  if (!enabled || !visible || isOpen || !message) return null;

  const side =
    position === "bottom-left"
      ? css`left: 20px;`
      : position === "bottom-center"
        ? css`left: 50%; transform: translateX(-50%);`
        : css`right: 20px;`;

  return (
    <div
      css={[
        css`
          position: fixed;
          bottom: 88px;
          z-index: ${tokens.z.host};
          max-width: 260px;
          background: ${tokens.color.bg};
          border: 1px solid ${tokens.color.border};
          border-radius: ${tokens.radius.lg};
          box-shadow: ${tokens.shadow.md};
          padding: 12px 34px 12px 14px;
          font-size: 13px;
          line-height: 1.45;
          color: ${tokens.color.text};
          cursor: pointer;
          pointer-events: auto;
          animation: z-pop-in 0.22s ease-out;
        `,
        side,
      ]}
      role="button"
      aria-label="Open chat"
      onClick={onOpen}
    >
      {message}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
        css={css`
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          color: ${tokens.color.textDisabled};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: ${tokens.radius.sm};
          &:hover {
            background: ${tokens.color.grey[100]};
            color: ${tokens.color.textSecondary};
          }
        `}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
      <span
        css={css`
          position: absolute;
          bottom: -5px;
          ${position === "bottom-left" ? "left: 22px;" : "right: 22px;"}
          width: 10px;
          height: 10px;
          background: ${tokens.color.bg};
          border-right: 1px solid ${tokens.color.border};
          border-bottom: 1px solid ${tokens.color.border};
          transform: rotate(45deg);
        `}
        aria-hidden="true"
      />
      <span
        css={css`
          display: block;
          margin-top: 6px;
          font-size: 11px;
          font-weight: 600;
          color: ${brandColor};
        `}
      >
        {config.name}
      </span>
    </div>
  );
}
