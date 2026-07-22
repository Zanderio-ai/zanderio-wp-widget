/**
 * @module core/nudges/booking-context
 * @description Detects an *abandoned* booking in the conversation — the
 * shopper engaged with booking (asked about it, was shown slots or a
 * paused mid-booking flow) but no booking was
 * confirmed. Used by the nudge engine to give the booking nudge priority
 * over `inactivity_has_messages` when the chat closes.
 *
 * Signals, strongest first:
 *   - a pending HITL interrupt (only the booking skill uses interrupts —
 *     the shopper closed the chat mid select-slot/collect-info)
 *   - any `data-interrupt` part in history (booking flow was engaged)
 *   - a `booking` artifact (slot card was shown)
 * A confirmed booking ("You're booked for ...", the booking skill's
 * confirmation line) clears the context — nothing left to nudge about.
 */

import type { ChatUIMessage } from "@/core/chat-types";

const BOOKING_CONFIRMED_RE = /you're booked for/i;

export function hasAbandonedBookingContext(
  messages: ChatUIMessage[],
  pendingInterrupt: unknown,
): boolean {
  let sawBookingSignal = pendingInterrupt != null;

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text") {
        if (BOOKING_CONFIRMED_RE.test(part.text)) return false;
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
