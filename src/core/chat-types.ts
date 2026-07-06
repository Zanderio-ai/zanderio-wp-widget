/**
 * @module core/chat-types
 * @description Typed chat messages over the Vercel AI SDK UI Message Stream.
 *
 * Mirrors client/app `src/shared/chat/history.ts`. The AI service streams
 * `data-artifact` and `data-interrupt` custom data parts alongside text; these
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
  interrupt: { id: string | null; value: unknown };
};

export type ChatUIMessage = UIMessage<never, ChatDataTypes>;
