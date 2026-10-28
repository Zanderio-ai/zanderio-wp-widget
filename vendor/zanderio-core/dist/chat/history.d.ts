/**
 * @module chat/history
 * @description Map LangGraph thread state onto UI messages.
 *
 * Pure transforms only — no transport. Fetching thread state stays with each
 * host, which owns its own HTTP client and auth: the widget uses `fetch` with
 * an anonymous AI-service token, the dashboard an axios instance with the
 * user's JWT. Only the mapping was ever duplicated, and it is the part that
 * has to agree.
 */
import type { ChatUIMessage, LangGraphMessage, ThreadState } from "./types.js";
/**
 * Convert stored LangGraph messages into the same `UIMessage` shape the live
 * SSE stream produces, so a rehydrated thread renders identically to one that
 * just streamed in.
 *
 * Messages that carry no renderable part are dropped rather than rendered
 * empty — a tool-only turn should leave no bubble behind.
 */
export declare function langGraphToUIMessages(messages: LangGraphMessage[]): ChatUIMessage[];
/**
 * Synthesize a trailing assistant message carrying the hydrated interrupt as
 * a `data-interrupt` part — the same shape the live SSE stream produces —
 * so a reopened thread re-renders its in-progress booking step card without
 * any change to how callers derive "the current interrupt" from `messages`.
 */
export declare function hydratedInterruptMessage(interrupt: ThreadState["interrupt"]): ChatUIMessage | null;
//# sourceMappingURL=history.d.ts.map