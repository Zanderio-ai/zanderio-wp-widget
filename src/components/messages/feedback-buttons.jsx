/**
 * Zanderio Widget — FeedbackButtons
 *
 * Renders thumbs-up / thumbs-down buttons after a bot response.
 * Clicking sends the score to the AI service POST /feedback endpoint.
 *
 * @param {{ traceId: string, aiUrl: string, token: string|null }} props
 * @module components/messages/feedback-buttons
 */

import { useState } from "react";

export default function FeedbackButtons({ traceId, aiUrl, token }) {
  const [selected, setSelected] = useState(null); // "up" | "down" | null

  if (!traceId) return null;

  const send = async (score) => {
    const key = score === 1 ? "up" : "down";
    if (selected === key) return;
    setSelected(key);
    try {
      await fetch(`${aiUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ trace_id: traceId, score }),
      });
    } catch {
      // Feedback is best-effort — don't break the UI
    }
  };

  return (
    <div className="feedback-buttons">
      <button
        className={`feedback-btn${selected === "up" ? " feedback-btn--active" : ""}`}
        onClick={() => send(1)}
        aria-label="Helpful"
        title="Helpful"
      >
        👍
      </button>
      <button
        className={`feedback-btn${selected === "down" ? " feedback-btn--active" : ""}`}
        onClick={() => send(0)}
        aria-label="Not helpful"
        title="Not helpful"
      >
        👎
      </button>
    </div>
  );
}
