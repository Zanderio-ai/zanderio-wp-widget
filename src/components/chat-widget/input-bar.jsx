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
      <textarea
        ref={textareaRef}
        rows="1"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        style={{
          borderRadius: "8px",
          padding: "10px",
          border: "1px solid #e1e3e5",
          outline: "none",
          width: "100%",
          resize: "none",
          fontSize: "14px",
          lineHeight: "1.4",
          maxHeight: "80px",
          overflowY: "auto",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      />
      <button
        type="submit"
        className="send-btn"
        disabled={disabled || !input.trim()}
        style={{
          opacity: disabled ? 0.5 : 1,
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <IoSend size={20} color={color} />
      </button>
    </form>
  );
}
