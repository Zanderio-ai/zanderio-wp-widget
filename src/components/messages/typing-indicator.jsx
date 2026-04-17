/**
 * Zanderio Widget — TypingIndicator
 *
 * Placeholder bubble shown in the message list while the AI backend is
 * processing a user message (`isLoading === true`).  Displays the text
 * “Thinking…” styled as a bot message.
 *
 * @module components/messages/typing-indicator
 */

export default function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        marginBottom: "1rem",
        justifyContent: "flex-start",
      }}
    >
      <div className="message bot typing-indicator-bubble">
        <span className="typing-dots">
          <span />
          <span />
          <span />
        </span>
        <span className="typing-label">Thinking</span>
      </div>
    </div>
  );
}
