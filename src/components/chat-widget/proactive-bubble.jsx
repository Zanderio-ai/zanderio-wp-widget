/**
 * Zanderio Widget — ProactiveBubble
 *
 * Floating message bubble that appears next to the launcher button
 * to proactively engage visitors. Includes a dismiss (×) button.
 *
 * @param {{ message: string, onDismiss: Function, color: string }} props
 *
 * @module components/chat-widget/proactive-bubble
 */

export default function ProactiveBubble({ message, onDismiss, color }) {
  if (!message) return null;

  return (
    <div className="proactive-bubble" role="status" aria-live="polite">
      <p className="proactive-bubble__text">{message}</p>
      <button
        className="proactive-bubble__close"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
      <div
        className="proactive-bubble__tail"
        style={{ borderTopColor: "#fff" }}
      />
    </div>
  );
}
