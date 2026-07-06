/**
 * @module artifacts/chat-actions
 * @description Bridges interactive artifacts to the live chat controller.
 *
 * Some artifacts (booking) need to push a structured response back into the
 * conversation — a chosen time slot resumes the paused LangGraph booking flow via
 * the HITL interrupt. Rather than thread callbacks through every renderer, the
 * chat window provides them here; artifacts read what they need with
 * {@link useChatActions}. Absent a provider the hooks degrade to no-ops, so cards
 * stay renderable in isolation (tests, storybook).
 */

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export interface ChatActions {
  /** True when the graph is paused awaiting a HITL response. */
  hasPendingInterrupt: boolean;
  /** Resume the paused graph with a structured payload (JSON-resume pattern). */
  respondToInterrupt: (response: Record<string, unknown>) => void;
}

const noop: ChatActions = {
  hasPendingInterrupt: false,
  respondToInterrupt: () => {},
};

const ChatActionsContext = createContext<ChatActions>(noop);

export function ChatActionsProvider({
  value,
  children,
}: {
  value: ChatActions;
  children: ReactNode;
}) {
  return <ChatActionsContext.Provider value={value}>{children}</ChatActionsContext.Provider>;
}

export function useChatActions(): ChatActions {
  return useContext(ChatActionsContext);
}
