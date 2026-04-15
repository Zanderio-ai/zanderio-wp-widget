/**
 * Zanderio Widget — ThinkingStatus (collapsible pill)
 *
 * Compact pill that shows animated dots. Clicking it toggles the
 * status label — collapsed by default so it takes minimal space.
 *
 * @param {{ status: string }} props
 * @module components/messages/thinking-status
 */

import { useState } from "react";

const STATUS_LABELS = {
  searching_products: "Searching products",
  searching_knowledge: "Looking that up",
  checking_availability: "Checking availability",
  preparing_response: "Preparing response",
  connecting_agent: "Connecting to an agent",
  analyzing: "Analyzing your question",
};

export default function ThinkingStatus({ status }) {
  const [expanded, setExpanded] = useState(false);
  const label = STATUS_LABELS[status] || "Thinking";

  return (
    <button
      type="button"
      className={`thinking-pill${expanded ? " thinking-pill--expanded" : ""}`}
      onClick={() => setExpanded((v) => !v)}
      aria-label={label}
    >
      <span className="thinking-pill__icon">
        <span />
        <span />
        <span />
      </span>
      <span className="thinking-pill__label">{label}</span>
    </button>
  );
}
