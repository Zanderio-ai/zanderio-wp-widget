/**
 * @module ui/ConversationEndedScreen
 * @description Terminal state shown when the backend closes a conversation.
 *
 * Renders at the bottom of the transcript so the visitor can still read the
 * history. Presents a clear end-of-conversation signal and a single CTA to
 * start fresh — the backend drives when this appears, not the visitor.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";

interface ConversationEndedScreenProps {
  brandColor: string;
  onStartNewChat: () => void;
}

const wrapper = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 24px 8px;
  gap: 10px;
`;

const iconCircle = (color: string) => css`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${color}1a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const title = css`
  font-size: 15px;
  font-weight: 600;
  color: var(--z-text);
  margin: 0;
`;

const subtitle = css`
  font-size: 13px;
  color: var(--z-text-secondary);
  margin: 0;
  line-height: 1.5;
`;

const cta = (brandColor: string) => css`
  margin-top: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: ${tokens.radius.md};
  background: ${brandColor};
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.88;
  }
  &:active {
    opacity: 0.75;
  }
`;

const divider = css`
  width: 100%;
  border: none;
  border-top: 1px solid var(--z-border);
  margin: 0;
`;

export function ConversationEndedScreen({ brandColor, onStartNewChat }: ConversationEndedScreenProps) {
  return (
    <>
      <hr css={divider} aria-hidden="true" />
      <div css={wrapper}>
        <div css={iconCircle(brandColor)} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12l2 2 4-4"
              stroke={brandColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="9" stroke={brandColor} strokeWidth="2" />
          </svg>
        </div>
        <p css={title}>Conversation ended</p>
        <p css={subtitle}>
          This conversation has been closed.
          <br />
          Start a new one to keep chatting.
        </p>
        <button type="button" css={cta(brandColor)} onClick={onStartNewChat}>
          Start new conversation
        </button>
      </div>
    </>
  );
}
