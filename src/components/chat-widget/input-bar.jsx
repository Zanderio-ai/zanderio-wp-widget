/**
 * Zanderio Widget — InputBar
 *
 * Chat input area with an auto-resizing `<textarea>` and a send button.
 *
 * The textarea grows vertically as the user types (up to 80 px max)
 * by resetting `height` to `auto` and then to `scrollHeight` on every
 * keystroke via a `useEffect` keyed on `input`.
 *
 * Submission occurs on form submit or when the user presses Enter
 * without Shift held.  Shift+Enter inserts a newline.
 *
 * @param {{ onSend: Function, disabled?: boolean, color: string }} props
 *
 * @module components/chat-widget/input-bar
 */

import { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";

export default function InputBar({ onSend, disabled, color }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-area">
      <div className="chat-input-pill">
        <textarea
          ref={textareaRef}
          rows="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          style={{
            border: "none",
            padding: "8px 0",
            outline: "none",
            width: "100%",
            resize: "none",
            fontSize: "14px",
            lineHeight: "1.4",
            maxHeight: "96px",
            overflowY: "auto",
            fontFamily: "inherit",
            boxSizing: "border-box",
            background: "transparent",
            display: "block",
          }}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={disabled || !input.trim()}
          style={{
            opacity: disabled || !input.trim() ? 0.4 : 1,
            background: color || "var(--widget-accent, #7e3ff2)",
          }}
        >
          <IoSend size={14} color="var(--widget-accent-contrast, #fff)" />
        </button>
      </div>
    </form>
  );
}
