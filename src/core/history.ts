/**
 * @module core/history
 * @description Hydrate prior conversation turns from the AI service.
 *
 * Mirrors client/app `src/shared/chat/history.ts`, but uses `fetch` (no axios)
 * and the widget's anonymous AI-service token. Calls
 * `GET {AI}/v1/threads/{id}/state` and maps LangGraph messages → UI messages.
 */

import { env } from "@/config/env";
import type { Artifact, ChatUIMessage } from "./chat-types";

interface LangGraphMessage {
  id?: string;
  type?: string;
  role?: string;
  content?: string | Array<{ type?: string; text?: string }>;
  parts?: Array<{ type?: string; text?: string; data?: unknown }>;
}

export interface ThreadState {
  status?: "open" | "closed";
  values?: { messages?: LangGraphMessage[] };
  /** Pending HITL interrupt (booking, etc.) if the thread was left mid-flow. */
  interrupt?: { id: string | null; value: unknown } | null;
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

    const parts: ChatUIMessage["parts"] = [];
    for (const part of msg.parts ?? []) {
      if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "data-artifact" && part.data) {
        parts.push({ type: "data-artifact", data: part.data as Artifact });
      } else if (
        part.type === "data-suggestions" &&
        Array.isArray(part.data) &&
        part.data.every((item) => typeof item === "string")
      ) {
        parts.push({ type: "data-suggestions", data: part.data });
      }
    }

    if (parts.length === 0) {
      const text = extractText(msg.content).trim();
      if (text) parts.push({ type: "text", text });
    }
    if (parts.length === 0) continue;

    out.push({
      id: msg.id ?? crypto.randomUUID(),
      role,
      parts,
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

/**
 * Synthesize a trailing assistant message carrying the hydrated interrupt as
 * a `data-interrupt` part — the same shape the live SSE stream produces —
 * so a reopened thread re-renders its in-progress booking step card without
 * any change to how callers derive "the current interrupt" from `messages`.
 */
export function hydratedInterruptMessage(
  interrupt: ThreadState["interrupt"],
): ChatUIMessage | null {
  if (!interrupt) return null;
  const id = interrupt.id ?? "interrupt-hydrated";
  return {
    id: `hydrated-${id}`,
    role: "assistant",
    parts: [{ type: "data-interrupt", id, data: interrupt }],
  };
}
