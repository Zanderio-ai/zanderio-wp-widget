/**
 * @module hooks/use-chat
 * @description Shared-runtime wrapper for the widget conversation state.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  CHAT_UI_V2_VERSION,
  createChatRuntimeState,
  hydrateChatRuntime,
  readChatUiV2EventStream,
  reduceChatRuntimeEvent,
  selectConversationEnded,
  selectRemainingMessages,
  selectThinkingPhase,
  selectWidgetMessages,
  startLocalTurn,
  stopActiveTurn,
} from "@chat-runtime";
import { normalizeProduct } from "../utils/content-blocks";
import {
  createApiClient,
  getConversations,
  getConversationMessages,
} from "../services/api.service";

const THREAD_KEY_PREFIX = "zanderio_thread_";
const CONVERSATION_KEY_PREFIX = "zanderio_conversation_";

function getStorageScope(storeId, visitorId) {
  if (!storeId || !visitorId) {
    return null;
  }

  return `${storeId}_${visitorId}`;
}

function getPersistedThreadId(storeId, visitorId) {
  const scope = getStorageScope(storeId, visitorId);
  if (!scope) {
    return null;
  }

  return localStorage.getItem(`${THREAD_KEY_PREFIX}${scope}`) || null;
}

function getPersistedConversationId(storeId, visitorId) {
  const scope = getStorageScope(storeId, visitorId);
  if (!scope) {
    return null;
  }

  return localStorage.getItem(`${CONVERSATION_KEY_PREFIX}${scope}`) || null;
}

function persistThreadId(storeId, visitorId, threadId) {
  const scope = getStorageScope(storeId, visitorId);
  if (scope && threadId) {
    localStorage.setItem(`${THREAD_KEY_PREFIX}${scope}`, threadId);
  }
}

function persistConversationId(storeId, visitorId, conversationId) {
  const scope = getStorageScope(storeId, visitorId);
  if (scope && conversationId) {
    localStorage.setItem(`${CONVERSATION_KEY_PREFIX}${scope}`, conversationId);
  }
}

function clearThreadId(storeId, visitorId) {
  const scope = getStorageScope(storeId, visitorId);
  if (scope) {
    localStorage.removeItem(`${THREAD_KEY_PREFIX}${scope}`);
  }
}

function clearConversationId(storeId, visitorId) {
  const scope = getStorageScope(storeId, visitorId);
  if (scope) {
    localStorage.removeItem(`${CONVERSATION_KEY_PREFIX}${scope}`);
  }
}

function generateThreadId(storeId) {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `wg_${storeId}_${randomSuffix}`;
}

function getResponsePayload(response) {
  return response?.data?.data || response?.data || {};
}

function buildInitialRuntimeState(welcomeMessage) {
  return hydrateChatRuntime([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage || "Hi there!",
      ts: new Date().toISOString(),
      products: [],
      actions: [],
    },
  ]);
}

function mapHistoryMessage(message, index) {
  const senderType = message?.sender?.type;
  const role =
    senderType === "agent" || senderType === "ai" ? "assistant" : "user";

  return {
    id: String(message?.id || message?._id || `history_${index}`),
    role,
    content: message?.content || "",
    ts: message?.createdAt || Date.now(),
    products:
      role === "assistant" && Array.isArray(message?.products)
        ? message.products
        : [],
    actions:
      role === "assistant" && Array.isArray(message?.actions)
        ? message.actions
        : [],
  };
}

function buildLocalTurnError(message, code = "client_error") {
  return {
    version: CHAT_UI_V2_VERSION,
    event: "turn.error",
    data: {
      turn_id: null,
      code,
      message,
      retryable: false,
      ts: new Date().toISOString(),
    },
  };
}

function getRequestErrorMessage(status) {
  if (status === 429) {
    return "Daily conversation limit reached. Please try again tomorrow.";
  }

  if (status === 401) {
    return "Session expired. Please refresh the page.";
  }

  if (status === 403) {
    return "This store is not authorized for AI chat.";
  }

  if (status >= 500) {
    return "AI assistant is temporarily unavailable. Please try again shortly.";
  }

  return `Request failed (${status}).`;
}

function normalizeWidgetMessages(messages) {
  return messages.map((message) => {
    if (message.type === "products") {
      return {
        ...message,
        items: (message.items || []).map(normalizeProduct),
      };
    }

    if (message.type === "product_card") {
      return {
        ...message,
        product: message.product ? normalizeProduct(message.product) : null,
      };
    }

    return message;
  });
}

export function useChat(storeId, visitorId, sessionId, settings, deps = {}) {
  const { socket, token } = deps;
  const [runtimeState, setRuntimeState] = useState(() =>
    buildInitialRuntimeState(settings.welcomeMessage),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const threadIdRef = useRef(null);
  const conversationIdRef = useRef(null);
  const abortRef = useRef(null);
  const historyLoadedRef = useRef(false);
  const historyScopeRef = useRef(null);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const aiUrl =
    import.meta.env.VITE_AI_URL ||
    settings.aiUrl ||
    "https://dev-agent.zanderio.ai";
  const apiUrl =
    settings.apiRoot ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://dev-api.zanderio.ai";

  const messages = useMemo(
    () =>
      normalizeWidgetMessages(
        selectWidgetMessages(runtimeState, {
          aiUrl,
          token,
        }),
      ),
    [aiUrl, runtimeState, token],
  );

  const thinkingStatus = selectThinkingPhase(runtimeState);
  const conversationEnded = selectConversationEnded(runtimeState);
  const remainingMessages = selectRemainingMessages(runtimeState);

  useEffect(() => {
    const scope = getStorageScope(storeId, visitorId);
    if (historyScopeRef.current === scope) {
      return;
    }

    historyScopeRef.current = scope;
    historyLoadedRef.current = false;

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    threadIdRef.current = getPersistedThreadId(storeId, visitorId);
    conversationIdRef.current = getPersistedConversationId(storeId, visitorId);

    setRuntimeState(buildInitialRuntimeState(settings.welcomeMessage));
    setIsLoading(false);
    setIsTyping(false);
  }, [settings.welcomeMessage, storeId, visitorId]);

  useEffect(() => {
    if (!runtimeState.conversationId || !storeId || !visitorId) {
      return;
    }

    conversationIdRef.current = runtimeState.conversationId;
    persistConversationId(storeId, visitorId, runtimeState.conversationId);
  }, [runtimeState.conversationId, storeId, visitorId]);

  useEffect(() => {
    if (!storeId || !visitorId || historyLoadedRef.current || !token) {
      return;
    }

    historyLoadedRef.current = true;

    const existingThreadId = getPersistedThreadId(storeId, visitorId);
    threadIdRef.current = existingThreadId;
    conversationIdRef.current = getPersistedConversationId(storeId, visitorId);

    const controller = new AbortController();

    (async () => {
      try {
        const client = createApiClient(apiUrl);
        const requestConfig = {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
          signal: controller.signal,
        };

        let restoredMessages = [];
        const persistedConversationId = conversationIdRef.current;

        const restoreLatestConversation = async () => {
          const response = await getConversations(
            client,
            { storeId, visitorId },
            requestConfig,
          );
          const payload = getResponsePayload(response);
          const latestConversationId = payload?.conversations?.[0]?.id || null;

          if (latestConversationId) {
            conversationIdRef.current = latestConversationId;
            persistConversationId(storeId, visitorId, latestConversationId);
          }

          return (payload?.messages || []).map(mapHistoryMessage);
        };

        if (persistedConversationId) {
          try {
            const response = await getConversationMessages(
              client,
              { conversationId: persistedConversationId },
              requestConfig,
            );
            restoredMessages = (
              getResponsePayload(response)?.messages || []
            ).map(mapHistoryMessage);
          } catch (error) {
            if (error?.response?.status === 404) {
              clearConversationId(storeId, visitorId);
              conversationIdRef.current = null;
              restoredMessages = await restoreLatestConversation();
            }
          }
        } else {
          restoredMessages = await restoreLatestConversation();
        }

        if (restoredMessages.length > 0) {
          setRuntimeState(
            hydrateChatRuntime([
              {
                id: "welcome",
                role: "assistant",
                content: settings.welcomeMessage || "Hi there!",
                ts: new Date().toISOString(),
                products: [],
                actions: [],
              },
              ...restoredMessages,
            ]),
          );
        }
      } catch {
        // History load failures remain silent in the widget.
      }
    })();

    return () => controller.abort();
  }, [apiUrl, settings.welcomeMessage, storeId, token, visitorId]);

  const requestTokenRefresh = useCallback(() => {
    const currentSocket = socket?.current;
    if (currentSocket?.connected) {
      currentSocket.emit("widget:token:request");
    }
  }, [socket]);

  const applyRuntimeEvent = useCallback((event) => {
    setRuntimeState((previousState) =>
      reduceChatRuntimeEvent(previousState, event),
    );
  }, []);

  const updateWelcomeMessage = useCallback((message) => {
    setRuntimeState((previousState) => {
      const onlyWelcomeMessage =
        previousState.messageOrder.length === 1 &&
        previousState.messageOrder[0] === "welcome" &&
        previousState.artifactOrder.length === 0;

      if (!onlyWelcomeMessage) {
        return previousState;
      }

      return buildInitialRuntimeState(message);
    });
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading || !storeId) {
        return;
      }

      if (!threadIdRef.current) {
        threadIdRef.current = generateThreadId(storeId);
        persistThreadId(storeId, visitorId, threadIdRef.current);
      }

      const turnSeed = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const userMessageId = `widget_user_${turnSeed}`;
      const assistantMessageId = `widget_assistant_${turnSeed}`;

      setRuntimeState((previousState) =>
        startLocalTurn(previousState, {
          userMessageId,
          userContent: text,
          assistantMessageId,
          userCreatedAt: new Date().toISOString(),
          assistantCreatedAt: new Date().toISOString(),
        }),
      );

      setIsLoading(true);
      setIsTyping(true);
      abortRef.current = new AbortController();

      const streamUrl = `${aiUrl}/threads/${threadIdRef.current}/stream`;

      const doStream = async (retried) => {
        const jwt = tokenRef.current;
        const response = await fetch(streamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          },
          body: JSON.stringify({
            store_id: storeId,
            message: text,
            source: "widget",
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          if (response.status === 401 && !retried) {
            requestTokenRefresh();
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return doStream(true);
          }

          applyRuntimeEvent(
            buildLocalTurnError(
              getRequestErrorMessage(response.status),
              `http_${response.status}`,
            ),
          );
          return;
        }

        if (!response.body) {
          applyRuntimeEvent(
            buildLocalTurnError(
              "AI service returned an empty stream.",
              "empty_stream",
            ),
          );
          return;
        }

        await readChatUiV2EventStream(response.body, (event) => {
          applyRuntimeEvent(event);
        });
      };

      try {
        await doStream(false);
      } catch (caughtError) {
        if (caughtError.name !== "AbortError") {
          applyRuntimeEvent(
            buildLocalTurnError(
              "Connection lost. Please try again.",
              "network_error",
            ),
          );
        }
      } finally {
        setIsLoading(false);
        setIsTyping(false);
        abortRef.current = null;
        setRuntimeState((previousState) => stopActiveTurn(previousState));
      }
    },
    [
      aiUrl,
      applyRuntimeEvent,
      isLoading,
      requestTokenRefresh,
      storeId,
      visitorId,
    ],
  );

  const startNewChat = useCallback(() => {
    clearThreadId(storeId, visitorId);
    clearConversationId(storeId, visitorId);
    threadIdRef.current = null;
    conversationIdRef.current = null;
    setRuntimeState(buildInitialRuntimeState(settings.welcomeMessage));
    setIsLoading(false);
    setIsTyping(false);
  }, [settings.welcomeMessage, storeId, visitorId]);

  return {
    messages,
    sendMessage,
    isLoading,
    isTyping,
    thinkingStatus,
    conversationEnded,
    remainingMessages,
    startNewChat,
    updateWelcomeMessage,
  };
}
