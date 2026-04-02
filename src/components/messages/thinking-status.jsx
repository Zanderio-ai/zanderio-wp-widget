/**
 * Zanderio Widget — ThinkingIndicator
 *
 * Contextual status message shown while the AI is processing.
 * Displays a human-readable status with animated dots.
 *
 * @param {{ status: string }} props
 * @module components/messages/thinking-indicator
 */

const STATUS_LABELS = {
  searching_products: "Searching products",
  searching_knowledge: "Looking that up",
  checking_availability: "Checking availability",
  preparing_response: "Preparing response",
  connecting_agent: "Connecting to an agent",
  analyzing: "Analyzing your question",
};

export default function ThinkingStatus({ status }) {
  const label = STATUS_LABELS[status] || "Thinking";

  return (
    <div className="thinking-indicator">
      <span>{label}</span>
      <span className="thinking-dots">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
