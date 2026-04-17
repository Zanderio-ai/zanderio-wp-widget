/**
 * Zanderio Widget — SuggestedReplies
 *
 * Renders a horizontal row of suggestion chips below the last bot message.
 * Clicking a chip sends its text as a new user message.
 *
 * @param {{ items: string[], onSend: (text: string) => void }} props
 * @module components/messages/suggested-replies
 */

export default function SuggestedReplies({ items, onSend }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="suggestions-container">
      {items.map((text, i) => (
        <button
          key={i}
          className="suggestion-chip"
          onClick={() => onSend(text)}
          title={text}
        >
          {text.length > 40 ? text.slice(0, 37) + "…" : text}
        </button>
      ))}
    </div>
  );
}
