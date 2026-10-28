/**
 * @module core/history
 * @description Hydrate prior conversation turns from the AI service.
 *
 * Only the transport lives here now. The LangGraph→UIMessage mapping moved to
 * `@zanderio/core/chat`, shared with the dashboard — it was duplicated, and it
 * is the half that has to agree. Fetching stays local because the two hosts
 * authenticate differently: the widget uses `fetch` with an anonymous
 * AI-service token, the dashboard an axios instance with the user's JWT.
 */

import { env } from "@/config/env";
import type { ThreadState } from "@zanderio/core/chat";

export async function fetchThreadState(
  conversationId: string,
  token: string,
  signal?: AbortSignal,
): Promise<ThreadState | null> {
  try {
    const res = await fetch(`${env.AI_URL}/v1/threads/${conversationId}/state`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as ThreadState;
  } catch {
    return null;
  }
}
