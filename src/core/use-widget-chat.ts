/**
 * @module core/use-widget-chat
 * @description Storefront chat controller over the Vercel AI SDK.
 *
 * The anonymous-visitor twin of client/app `use-playground-chat.ts`. Swaps the
 * portal session token for the bootstrap-issued `aiServiceToken` and drops the
 * dashboard-only persistence store (the widget's conversation id comes from
 * bootstrap). Streams from `POST {AI}/v1/threads/{id}/chat`.
 *
 * Voice-to-voice rides on the same turn, through `useVoiceReplies` from
 * `@zanderio/core/chat-ui` (shared with the dashboard playground); this hook
 * only hands it the widget's transport. A photo search rides on it the same
 * way: the photo is uploaded first, and the turn carries its id.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { env } from "@/config/env";
import {
  hydratedInterruptMessage,
  langGraphToUIMessages,
  pendingInterrupt,
  streamStatusLabel,
} from "@zanderio/core/chat";
import type { ChatUIMessage } from "@zanderio/core/chat";
import { useVoiceReplies } from "@zanderio/core/chat-ui";
import type { InterruptResume, VoiceTurnFinish } from "@zanderio/core/chat-ui";
import { fetchThreadState } from "./history";
import type { AcceptedImage } from "./use-image-attachment";
import { primeVisitorImage } from "./visitor-image";
import { voiceReplyRequester } from "./voice-audio";

interface UseWidgetChatArgs {
  conversationId: string | null;
  token: string | null;
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

  // `onFinish` is wired through a ref: useChat needs it before
  // useVoiceReplies (which needs useChat's setMessages) exists.
  const voiceFinishRef = useRef<VoiceTurnFinish | null>(null);
  const { messages, sendMessage, status, stop, setMessages, error, regenerate } =
    useChat<ChatUIMessage>({
      transport,
      onFinish: (event) => voiceFinishRef.current?.(event),
    });

  // Reads the token when a reply is requested, not when this is built.
  // eslint-disable-next-line react-hooks/refs
  const requestReply = useMemo(() => voiceReplyRequester(() => tokenRef.current), []);
  const voice = useVoiceReplies({
    conversationId,
    setMessages,
    sendMessage,
    status,
    requestReply,
  });
  useEffect(() => {
    voiceFinishRef.current = voice.onFinish;
  }, [voice.onFinish]);
  const { endVoiceTurn, speakMissingReplies } = voice;

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
      const history = langGraphToUIMessages(state?.values?.messages ?? []);
      const pending = hydratedInterruptMessage(state?.interrupt);
      setMessages(pending ? [...history, pending] : history);
      setIsHistoryLoading(false);
      // A voice reply that never arrived (failed, or the page was reloaded
      // first) is spoken now rather than left as text.
      void speakMissingReplies(history);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [conversationId, token, setMessages, speakMissingReplies]);

  const isStreaming = status === "submitted" || status === "streaming";
  // Latest human-in-the-loop interrupt awaiting a response (booking, etc.).
  const interrupt = useMemo(() => pendingInterrupt(messages), [messages]);
  const statusLabel = useMemo(
    () => streamStatusLabel(messages, isStreaming),
    [messages, isStreaming],
  );

  const send = useCallback(
    (text: string) => {
      if (!conversationId || !text.trim()) return;
      endVoiceTurn();
      sendMessage({ text: text.trim() });
    },
    [conversationId, sendMessage, endVoiceTurn],
  );

  // Send a photo the AI service accepted, with any words typed alongside it.
  // `image.image_id` tells the AI service which photo to search the catalog with.
  const sendImage = useCallback(
    ({ image, blob, text }: AcceptedImage) => {
      if (!conversationId) return;
      primeVisitorImage(image.image_id, blob);
      endVoiceTurn();
      const words = text.trim();
      sendMessage(
        {
          role: "user",
          parts: [
            { type: "data-image", data: image },
            ...(words ? [{ type: "text" as const, text: words }] : []),
          ],
        },
        { body: { image: { image_id: image.image_id } } },
      );
    },
    [conversationId, sendMessage, endVoiceTurn],
  );

  const respondToInterrupt = useCallback(
    (response: InterruptResume) => {
      if (!conversationId) return;
      sendMessage({ text: "" }, { body: { resume: response } });
    },
    [conversationId, sendMessage],
  );

  return {
    messages,
    isStreaming,
    isLoading: isHistoryLoading || isStreaming,
    isHistoryLoading,
    /** True once there's a conversation + token, i.e. `send` will actually send. */
    isReady: Boolean(conversationId && token),
    isClosed,
    error,
    statusLabel,
    interrupt,
    send,
    sendVoice: voice.sendVoice,
    sendImage,
    voiceReplyPending: voice.voiceReplyPending,
    voiceReply: voice.voiceReply,
    voiceReplyStatus: voice.voiceReplyStatus,
    retryVoiceReply: voice.retryVoiceReply,
    conversationId,
    respondToInterrupt,
    stop,
    regenerate,
    token,
  };
}
