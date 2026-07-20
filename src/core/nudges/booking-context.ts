/**
 * @module core/nudges/booking-context
 * @description Detects an *abandoned* booking in the conversation — the
 * shopper engaged with booking (asked about it, was shown slots or a
 * scheduling link, or paused mid booking flow) but no booking was
 * confirmed. Used by the nudge engine to give the booking nudge priority
 * over `inactivity_has_messages` when the chat closes.
 *
 * Signals, strongest first:
 *   - a pending HITL interrupt (only the booking skill uses interrupts —
 *     the shopper closed the chat mid select-slot/collect-info)
 *   - any `data-interrupt` part in history (booking flow was engaged)
 *   - a `booking` artifact (slot card was shown)
 *   - a scheduling-provider link in message text
 * A confirmed booking ("You're booked for ...", the booking skill's
 * confirmation line) clears the context — nothing left to nudge about.
 */

import type { ChatUIMessage } from "@/core/chat-types";

const BOOKING_LINK_RE = /(calendly\.com|cal\.com|acuityscheduling\.com)/i;
const BOOKING_CONFIRMED_RE = /you're booked for/i;
const BOOKING_LINK_EXTRACT_RE =
  /https?:\/\/[^\s)\]"'<>]*(?:calendly\.com|cal\.com|acuityscheduling\.com)[^\s)\]"'<>]*/i;

/**
 * First scheduling link in the conversation, or null. Booking capability
 * has two sources: a connected scheduling integration, or a booking link
 * the AI surfaced from knowledge-base content — this feeds the second
 * path, so the fire request can carry the link for the AI to compose the
 * nudge around even when no integration is resolvable.
 */
export function extractBookingLink(messages: ChatUIMessage[]): string | null {
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text") {
        const match = part.text.match(BOOKING_LINK_EXTRACT_RE);
        // Links in prose often end at sentence punctuation ("...30min. During
        // the demo...") — trim it so the nudge doesn't echo a dotted URL.
        if (match) return match[0].replace(/[.,!?;:]+$/, "");
      }
    }
  }
  return null;
}

export function hasAbandonedBookingContext(
  messages: ChatUIMessage[],
  pendingInterrupt: unknown,
): boolean {
  let sawBookingSignal = pendingInterrupt != null;

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text") {
        if (BOOKING_CONFIRMED_RE.test(part.text)) return false;
        if (BOOKING_LINK_RE.test(part.text)) sawBookingSignal = true;
      } else if (part.type === "data-interrupt") {
        sawBookingSignal = true;
      } else if (part.type === "data-artifact" && "data" in part) {
        const artifact = part.data as { type?: string } | null;
        if (artifact?.type === "booking") sawBookingSignal = true;
      }
    }
  }

  return sawBookingSignal;
}
