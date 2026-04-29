/**
 * Zanderio Widget — TextMessage
 *
 * Renders a single text message bubble.  The message body is passed
 * through `renderMarkdown()` which converts headings, bold, and image
 * tokens into React elements.  User messages receive the widget’s
 * primary `color` as their background; bot messages use the default
 * CSS styling.
 *
 * @param {{ msg: object, color: string }} props
 *
 * @module components/messages/text-message
 */

import { renderMarkdown } from "../../utils/markdown.jsx";

export default function TextMessage({ msg, onRetry }) {
  const classes = [
    "message",
    msg.sender,
    msg.isStreaming && "streaming",
    msg.isError && "error-message",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {renderMarkdown(msg.text, msg.isTyping)}
      {msg.isError && onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          ↻ Try again
        </button>
      )}
    </div>
  );
}
