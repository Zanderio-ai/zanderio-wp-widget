/**
 * Zanderio Widget — useProactiveEngagement Hook
 *
 * Shows a proactive bubble message next to the launcher button after
 * a configurable delay, encouraging visitors to start a conversation.
 *
 * Respects:
 *   - `proactive.enabled` — globally toggles the feature
 *   - `proactive.delaySeconds` — wait time before showing (default 15)
 *   - `proactive.maxPerSession` — max bubbles per session (default 2)
 *   - Bubble is hidden once the chat is opened or dismissed
 *
 * @param {{ enabled, message, delaySeconds, maxPerSession }} proactiveConfig
 * @param {boolean} isChatOpen — whether the chat window is currently open
 * @returns {{ bubbleMessage: string|null, dismissBubble: Function }}
 *
 * @module hooks/use-proactive-engagement
 */

import { useState, useEffect, useCallback, useRef } from "react";

const SESSION_KEY = "zanderio_proactive_count";

function getSessionCount() {
  try {
    return parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementSessionCount() {
  try {
    const count = getSessionCount() + 1;
    sessionStorage.setItem(SESSION_KEY, String(count));
    return count;
  } catch {
    return 1;
  }
}

export function useProactiveEngagement(proactiveConfig, isChatOpen) {
  const [bubbleMessage, setBubbleMessage] = useState(null);
  const timerRef = useRef(null);
  const hasShownRef = useRef(false);

  const { enabled, message, delaySeconds, maxPerSession } =
    proactiveConfig || {};

  const dismissBubble = useCallback(() => {
    setBubbleMessage(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Hide bubble when chat opens
  useEffect(() => {
    if (isChatOpen) {
      dismissBubble();
    }
  }, [isChatOpen, dismissBubble]);

  // Start the delay timer
  useEffect(() => {
    if (!enabled || isChatOpen || hasShownRef.current) return;

    const count = getSessionCount();
    if (count >= (maxPerSession || 2)) return;

    timerRef.current = setTimeout(
      () => {
        // Re-check — chat may have opened during the delay
        if (!isChatOpen) {
          setBubbleMessage(message || "Hi! Need help finding anything?");
          incrementSessionCount();
          hasShownRef.current = true;
        }
      },
      (delaySeconds || 15) * 1000,
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, message, delaySeconds, maxPerSession, isChatOpen]);

  return { bubbleMessage, dismissBubble };
}
