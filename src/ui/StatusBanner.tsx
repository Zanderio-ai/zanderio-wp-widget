/**
 * @module ui/StatusBanner
 * @description Inline status card for chat error / closed states.
 *
 * Token-styled twin of client/app `PlaygroundStatusCard` (inline layout). Renders
 * a coloured strip with a title, message, and optional recovery action. Used by
 * MessageList for the conversation-closed banner and stream-error states.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";

type Severity = "error" | "warning" | "info";

interface StatusBannerProps {
  severity: Severity;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

const tone: Record<Severity, { fg: string; bg: string; border: string }> = {
  error: { fg: "#B42318", bg: "#FEF3F2", border: "#FECDCA" },
  warning: { fg: "#B54708", bg: "#FFFAEB", border: "#FEDF89" },
  info: { fg: "#175CD3", bg: "#EFF8FF", border: "#B2DDFF" },
};

export function StatusBanner({ severity, title, message, action }: StatusBannerProps) {
  const c = tone[severity];
  return (
    <div
      css={css`
        border: 1px solid ${c.border};
        background: ${c.bg};
        border-radius: ${tokens.radius.lg};
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      `}
    >
      <span css={css`font-size: 13px; font-weight: 700; color: ${c.fg};`}>{title}</span>
      <span css={css`font-size: 12px; color: ${tokens.color.textSecondary}; line-height: 1.5;`}>
        {message}
      </span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          css={css`
            align-self: flex-start;
            margin-top: 6px;
            padding: 6px 12px;
            border: 1px solid ${c.border};
            border-radius: ${tokens.radius.md};
            background: ${tokens.color.bg};
            color: ${c.fg};
            font-size: 12px;
            font-weight: 600;
            font-family: ${tokens.font.family};
            cursor: pointer;
            &:hover {
              background: ${c.bg};
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
