/**
 * @module core/chat-types
 * @description Typed chat messages over the Vercel AI SDK UI Message Stream.
 *
 * Mirrors client/app `src/shared/chat/history.ts`. The AI service streams
 * `data-artifact`, `data-suggestions`, and `data-interrupt` parts alongside text; these
 * generics make `useChat<ChatUIMessage>` aware of them.
 */

import type { UIMessage } from "ai";

/** A rich content block rendered below an assistant turn (product cards, etc.). */
export interface Artifact {
  type: string;
  title?: string;
  subtitle?: string;
  media?: unknown;
  target?: unknown;
  data?: unknown;
}

/** Custom data-part payloads carried in the stream. */
export type ChatDataTypes = {
  artifact: Artifact;
  suggestions: string[];
  interrupt: { id: string | null; value: unknown };
};

export type ChatUIMessage = UIMessage<never, ChatDataTypes>;

// ── Booking (HITL scheduling flow) ──────────────────────────────────────────
// Mirrors `ai/app/agent/skills/booking/schemas.py::InterruptEnvelope` and the
// `Artifact(type="booking", data=BookingData(...))` confirmation card. The
// `interrupt` data part above stays loosely typed (`value: unknown`) since it
// is a generic HITL channel; components narrow to `BookingInterrupt` when
// `phase` is one of these four values.

export type BookingPhase = "select_event_type" | "select_slot" | "collect_info" | "review";

export interface BookingOption {
  id?: string;
  name?: string;
  description?: string | null;
  duration?: string | null;
  start_time?: string;
  label?: string;
}

export interface BookingInterrupt {
  phase: BookingPhase;
  provider: string;
  timezone: string;
  options?: BookingOption[];
  event_type?: { id: string; name: string } | null;
  start_time?: string;
  start_label?: string;
  required?: string[];
  contact?: { name: string; email: string; notes?: string | null } | null;
  notice?: string | null;
}

/** Sent back via `sendMessage({ text: "" }, { body: { resume } })`. */
export type BookingResume = { action: "cancel" | "back" } | Record<string, unknown>;

/** The durable `data-artifact` payload emitted once `book()` succeeds. */
export interface BookingConfirmation {
  provider: string;
  event_type_name: string;
  start_time: string;
  start_label: string;
  timezone: string;
  duration_label?: string | null;
  status: "confirmed" | "canceled";
  reschedule_url?: string | null;
  cancel_url?: string | null;
}
