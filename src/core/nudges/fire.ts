/**
 * @module core/nudges/fire
 * @description POST /v1/widget/nudges/fire — ask Platform whether a tripped
 * trigger may actually be shown. The server re-checks effective-state and
 * cooldown regardless of what the widget believes tripped (see
 * Zanderio-Backend-Platform `nudge.service.js::fireNudge`).
 */

import { env } from "@/config/env";
import type { FireNudgeResult } from "./types";

interface FireNudgeArgs {
  storeId: string;
  shopperId: string;
  key: string;
  conversationId?: string | null;
  /** Booking link found in the chat (knowledge-base path) — booking key only. */
  bookingUrl?: string | null;
}

export async function fireNudge({
  storeId,
  shopperId,
  key,
  conversationId,
  bookingUrl,
}: FireNudgeArgs): Promise<FireNudgeResult> {
  try {
    const res = await fetch(`${env.API_URL}/v1/widget/nudges/fire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_id: storeId,
        shopper_id: shopperId,
        key,
        conversation_id: conversationId ?? undefined,
        booking_url: bookingUrl ?? undefined,
      }),
    });

    if (!res.ok) return { allow: false, reason: "request_failed" };

    const body = (await res.json()) as { data?: Record<string, unknown> };
    const data = body?.data ?? {};

    return {
      allow: Boolean(data.allow),
      message: typeof data.message === "string" ? data.message : undefined,
      clickPrompt: typeof data.click_prompt === "string" ? data.click_prompt : undefined,
      reason: typeof data.reason === "string" ? data.reason : undefined,
    };
  } catch {
    return { allow: false, reason: "network_error" };
  }
}
