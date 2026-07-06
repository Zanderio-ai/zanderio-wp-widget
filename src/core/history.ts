/**
 * @module core/history
 * @description Hydrate prior conversation turns from the AI service.
 *
 * Mirrors client/app `src/shared/chat/history.ts`, but uses `fetch` (no axios)
 * and the widget's anonymous AI-service token. Calls
 * `GET {AI}/v1/threads/{id}/state` and maps LangGraph messages → UI messages.
 */

import { env } from "@/config/env";
import type { ChatUIMessage } from "./chat-types";

interface LangGraphMessage {
  id?: string;
  type?: string;
  role?: string;
  content?: string | Array<{ type?: string; text?: string }>;
}

export interface ThreadState {
  status?: "open" | "closed";
  values?: { messages?: LangGraphMessage[] };
}

function extractText(content: LangGraphMessage["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: "text"; text: string } => b?.type === "text")
    .map((b) => b.text)
    .join("");
}

export function langGraphToUIMessages(messages: LangGraphMessage[]): ChatUIMessage[] {
  const out: ChatUIMessage[] = [];

  for (const msg of messages) {
    const role =
      msg.type === "human" || msg.role === "human"
        ? "user"
        : msg.type === "ai" || msg.role === "ai"
          ? "assistant"
          : null;
    if (!role) continue;

    const text = extractText(msg.content).trim();
    if (!text) continue;

    out.push({
      id: msg.id ?? crypto.randomUUID(),
      role,
      parts: [{ type: "text", text }],
    });
  }

  return out;
}

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
