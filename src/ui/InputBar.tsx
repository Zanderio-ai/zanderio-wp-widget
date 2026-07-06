/**
 * @module ui/InputBar
 * @description Composer — textarea + send/stop button.
 */

import { useState } from "react";
import { css } from "@emotion/react";

interface InputBarProps {
  brandColor: string;
  disabled: boolean;
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

const wrap = css`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--z-border);
  background: var(--z-bg);
  flex-shrink: 0;
`;

const field = css`
  flex: 1;
  resize: none;
  border: 1px solid var(--z-border);
  border-radius: 22px;
  padding: 10px 16px;
  font-size: 14px;
  font-family: var(--z-font);
  max-height: 96px;
  outline: none;
  &:focus {
    border-color: var(--z-primary);
  }
  &:disabled {
    background: var(--z-bg-muted);
  }
`;

// 2026 pattern: arrow-up glyph in a circle that's a muted ghost when there's
// nothing to send, and fills with the brand color (plus a soft halo + press
// scale) the moment the field has text.
const sendBtn = (brandColor: string, active: boolean) => css`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: ${active ? brandColor : "var(--z-bg-muted)"};
  color: ${active ? "#fff" : "var(--z-text-disabled)"};
  box-shadow: ${active ? `0 4px 12px ${brandColor}40` : "none"};
  cursor: ${active ? "pointer" : "default"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
  &:active {
    transform: ${active ? "scale(0.94)" : "none"};
  }
`;

export function InputBar({ brandColor, disabled, isStreaming, onSend, onStop }: InputBarProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    setValue("");
    onSend(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div css={wrap}>
      <textarea
        css={field}
        rows={1}
        placeholder={disabled ? "Conversation ended" : "Type a message…"}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {isStreaming ? (
        <button type="button" aria-label="Stop" onClick={onStop} css={sendBtn(brandColor, true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          aria-label="Send"
          onClick={submit}
          disabled={disabled || !value.trim()}
          css={sendBtn(brandColor, !disabled && Boolean(value.trim()))}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 19V5M5 12l7-7 7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
