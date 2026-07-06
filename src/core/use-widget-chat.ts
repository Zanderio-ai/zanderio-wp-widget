/**
 * @module core/use-widget-chat
 * @description Storefront chat controller over the Vercel AI SDK.
 *
 * The anonymous-visitor twin of client/app `use-playground-chat.ts`. Swaps the
 * portal session token for the bootstrap-issued `aiServiceToken` and drops the
 * dashboard-only persistence store (the widget's conversation id comes from
 * bootstrap). Streams from `POST {AI}/v1/threads/{id}/chat`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { env } from "@/config/env";
import { fetchThreadState, langGraphToUIMessages } from "./history";
import type { ChatUIMessage } from "./chat-types";

interface UseWidgetChatArgs {
  conversationId: string | null;
  token: string | null;
}

function isInterruptPart(part: ChatUIMessage["parts"][number]) {
  return part.type === "data-interrupt";
}

export function useWidgetChat({ conversationId, token }: UseWidgetChatArgs) {
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  // conversationId and token arrive asynchronously from bootstrap, so they are
  // null on first render. useChat captures its transport once and does NOT swap
  // to a rebuilt one — so a transport baked with the initial null values would
  // forever POST to `/threads/null/chat` with no Authorization header (a 401,
  // and the reason /state worked while /chat didn't). Keep the live values in
  // refs and resolve the URL + auth header per request instead.
  const convIdRef = useRef(conversationId);
  const tokenRef = useRef(token);
  useEffect(() => {
    convIdRef.current = conversationId;
    tokenRef.current = token;
  }, [conversationId, token]);

  // Only the URL and auth header need to change per request. The body MUST be
  // rebuilt to the SDK's default shape (id/messages/trigger/messageId) — the
  // `body` argument here is only the extra body, so returning it alone would
  // drop the actual messages and send an empty turn.
  const prepareRequest = useCallback(
    ({
      id,
      messages,
      trigger,
      messageId,
      body,
      headers,
    }: {
      id: string;
      messages: ChatUIMessage[];
      trigger: "submit-message" | "regenerate-message";
      messageId: string | undefined;
      body?: Record<string, unknown>;
      headers?: HeadersInit;
    }) => {
      const merged: Record<string, string> = {};
      if (headers) new Headers(headers).forEach((value, key) => (merged[key] = value));
      if (tokenRef.current) merged.Authorization = `Bearer ${tokenRef.current}`;
      return {
        api: `${env.AI_URL}/v1/threads/${convIdRef.current}/chat`,
        headers: merged,
        body: { ...(body ?? {}), id, messages, trigger, messageId },
      };
    },
    [],
  );

  const transport = useMemo(
    () =>
      // prepareRequest reads the refs only when a request is sent, never during
      // render — so this is safe despite the refs heuristic.
      // eslint-disable-next-line react-hooks/refs
      new DefaultChatTransport<ChatUIMessage>({
        api: `${env.AI_URL}/v1/threads/pending/chat`,
        prepareSendMessagesRequest: prepareRequest,
      }),
    [prepareRequest],
  );

  const { messages, sendMessage, status, stop, setMessages, error, regenerate } =
    useChat<ChatUIMessage>({ transport });

  // Hydrate prior turns when the conversation/token becomes available.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setIsHistoryLoading(true);
    setIsClosed(false);

    if (!conversationId || !token) {
      setMessages([]);
      setIsHistoryLoading(false);
      return;
    }

    fetchThreadState(conversationId, token, controller.signal).then((state) => {
      if (cancelled) return;
      if (state?.status === "closed") setIsClosed(true);
      setMessages(langGraphToUIMessages(state?.values?.messages ?? []));
      setIsHistoryLoading(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [conversationId, token, setMessages]);

  // Latest human-in-the-loop interrupt awaiting a response (booking, etc.).
  const interrupt = useMemo(() => {
    const assistant = [...messages].reverse().find((m) => m.role === "assistant");
    const part = assistant?.parts.find(isInterruptPart);
    return part && "data" in part ? part.data : null;
  }, [messages]);

  const send = useCallback(
    (text: string) => {
      if (!conversationId || !text.trim()) return;
      sendMessage({ text: text.trim() });
    },
    [conversationId, sendMessage],
  );

  const respondToInterrupt = useCallback(
    (response: Record<string, unknown>) => {
      if (!conversationId) return;
      sendMessage({ text: "" }, { body: { resume: response } });
    },
    [conversationId, sendMessage],
  );

  const isStreaming = status === "submitted" || status === "streaming";

  return {
    messages,
    isStreaming,
    isLoading: isHistoryLoading || isStreaming,
    isClosed,
    error,
    interrupt,
    send,
    respondToInterrupt,
    stop,
    regenerate,
    token,
  };
}
