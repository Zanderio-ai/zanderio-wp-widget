/**
 * @module ui/InputBar
 * @description Composer — textarea with photo, mic and send/stop icons docked
 * inside its right edge, and the chosen photo previewed above it.
 */

import { useRef, useState } from "react";
import { css } from "@emotion/react";

interface InputBarProps {
  brandColor: string;
  disabled: boolean;
  isMobile?: boolean;
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Optional external value control (e.g. voice transcript injection). Omit for the default self-contained behavior. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Rendered inside the field's right edge, before the send button (e.g. a mic button). */
  voiceControl?: React.ReactNode;
  /** Rendered inside the field's right edge, before the voice control (the photo button). */
  attachControl?: React.ReactNode;
  /** The chosen photo, shown above the field. While present, the message may be sent without words. */
  attachment?: React.ReactNode;
  /** The message can't be sent yet (e.g. its photo is still being checked). */
  sendBlocked?: boolean;
}

const wrap = css`
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-top: 1px solid var(--z-border);
  background: var(--z-bg);
  flex-shrink: 0;
`;

// The pill itself owns the border/rounding and holds the textarea + icons as
// flex children, so the buttons are always inside it (bottom-aligned so the
// icons stay put as the textarea grows to multiple rows).
const fieldPill = (disabled?: boolean) => css`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  min-width: 0;
  border: 1px solid var(--z-border);
  border-radius: 22px;
  padding: 5px 6px;
  background: ${disabled ? "var(--z-bg-muted)" : "var(--z-bg)"};
  transition: border-color 0.15s ease;
  &:focus-within {
    border-color: var(--z-primary);
  }
`;

// iOS Safari auto-zooms the page on focus when an input's computed font-size
// is under 16px — there's no CSS opt-out, so on mobile we bump the textarea
// to 16px to keep it from triggering that zoom (which otherwise leaves the
// widget zoomed in and horizontally scrollable once the keyboard closes).
// Android doesn't have this behavior, so desktop/Android keep the smaller size.
const field = (isMobile?: boolean) => css`
  flex: 1;
  min-width: 0;
  resize: none;
  border: none;
  background: transparent;
  /* Explicit — a textarea takes its color from the UA's \`fieldtext\` system
     color rather than inheriting, which turns white on a host page that sets
     \`color-scheme: dark\` (inherited across the shadow boundary). */
  color: var(--z-text);
  padding: 6px 4px 6px 10px;
  font-size: ${isMobile ? "16px" : "14px"};
  font-family: var(--z-font);
  line-height: 1.45;
  max-height: 96px;
  outline: none;
  &::placeholder {
    color: var(--z-text-disabled);
    opacity: 1;
  }
`;

const iconTray = css`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

// 2026 pattern: arrow-up glyph in a circle that's a muted ghost when there's
// nothing to send, and fills with the brand color (plus a soft halo + press
// scale) the moment the field has text.
const sendBtn = (brandColor: string, active: boolean) => css`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
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

export function InputBar({
  brandColor,
  disabled,
  isMobile,
  isStreaming,
  onSend,
  onStop,
  value: externalValue,
  onValueChange,
  voiceControl,
  attachControl,
  attachment,
  sendBlocked,
}: InputBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;
  const setValue = isControlled ? (onValueChange ?? (() => {})) : setInternalValue;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Some host pages (WordPress sites with copy-protection / anti-inspect
  // scripts in particular) interfere with the browser's default click→focus
  // behavior for elements inside our shadow root, so a plain click can land
  // without ever moving keyboard focus into the textarea. Focusing explicitly
  // on mousedown sidesteps whatever the host page is doing instead of relying
  // on the default action.
  const focusField = () => textareaRef.current?.focus();

  const canSend = !disabled && !sendBlocked && (Boolean(value.trim()) || Boolean(attachment));

  const submit = () => {
    const text = value.trim();
    if (!canSend) return;
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
      {attachment}
      <div css={fieldPill(disabled)} onMouseDown={focusField}>
        <textarea
          ref={textareaRef}
          css={field(isMobile)}
          rows={1}
          placeholder={
            disabled
              ? "Conversation ended"
              : attachment
                ? "Add a message about this photo (optional)…"
                : "Type a message…"
          }
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div css={iconTray}>
          {attachControl}
          {voiceControl}
          {isStreaming ? (
            <button type="button" aria-label="Stop" onClick={onStop} css={sendBtn(brandColor, true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={submit}
              disabled={!canSend}
              css={sendBtn(brandColor, canSend)}
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
      </div>
    </div>
  );
}
