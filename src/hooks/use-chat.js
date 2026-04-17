/**
 * @module hooks/use-chat
 * @description Central orchestrator for the conversation state. Streams AI
 * responses via native fetch + ReadableStream SSE. Owns the `messages` array
 * and provides every operation the UI needs to drive a chat session.
 *
 * @param {string|null} storeId
 * @param {string} visitorId
 * @param {string|null} sessionId
 * @param {object} settings
 * @param {{ socket: React.MutableRefObject, token: string|null }} deps
 * @returns {{ messages, sendMessage, isLoading, isTyping, updateWelcomeMessage }}
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { parseActions, normalizeProduct } from "../utils/content-blocks";
import {
  createApiClient,
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
  if (!scope) return null;
  return localStorage.getItem(`${THREAD_KEY_PREFIX}${scope}`) || null;
}

function getPersistedConversationId(storeId, visitorId) {
  const scope = getStorageScope(storeId, visitorId);
  if (!scope) return null;
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
  const rand = Math.random().toString(36).slice(2, 10);
  return `wg_${storeId}_${rand}`;
}

/**
 * Parse SSE text into structured events.
 */
function parseSSE(text) {
  const events = [];
  const blocks = text.split("\n\n");
  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventType = "message";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data += line.slice(6);
      }
    }
    if (data) {
      try {
        events.push({ event: eventType, data: JSON.parse(data) });
      } catch {
        events.push({ event: eventType, data });
      }
    }
  }
  return events;
}

function normalizeHistoryMessages(history = []) {
  const restored = [];

  for (const message of history) {
    const senderType = message?.sender?.type;
    const sender =
      senderType === "agent" || senderType === "ai" ? "bot" : "user";

    if (message?.content) {
      restored.push({
        id: Date.now() + Math.random(),
        text: message.content,
        sender,
        type: "text",
      });
    }

    if (sender !== "bot") {
      continue;
    }

    if (Array.isArray(message?.products) && message.products.length > 0) {
      restored.push({
        id: Date.now() + Math.random(),
        sender: "bot",
        type: "products",
        items: message.products.map(normalizeProduct),
      });
    }

    if (Array.isArray(message?.actions) && message.actions.length > 0) {
      const parsedActions = parseActions(message.actions);
      restored.push(
        ...parsedActions.map((action) => ({
          id: Date.now() + Math.random(),
          sender: "bot",
          ...action,
        })),
      );
    }

    if (Array.isArray(message?.suggestions) && message.suggestions.length > 0) {
      restored.push({
        id: Date.now() + Math.random(),
        sender: "bot",
        type: "suggestions",
        items: message.suggestions,
      });
    }
  }

  return restored;
}

export function useChat(storeId, visitorId, sessionId, settings, deps = {}) {
  const { socket, token } = deps;
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: settings.welcomeMessage || "Hi there!",
      sender: "bot",
      type: "text",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState(null);
  const [conversationEnded, setConversationEnded] = useState(null); // { reason, message }
  const [remainingMessages, setRemainingMessages] = useState(null);
  const threadIdRef = useRef(null);
  const conversationIdRef = useRef(null);
  const abortRef = useRef(null);
  const historyLoadedRef = useRef(false);
  const historyScopeRef = useRef(null);
  const tokenRef = useRef(token);
  const lastTraceIdRef = useRef(null);

  // Keep tokenRef in sync so the streaming closure always has the latest JWT
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

  const updateWelcomeMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [{ ...prev[0], text: msg }];
      }
      return prev;
    });
  }, []);

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
    lastTraceIdRef.current = null;

    setMessages([
      {
        id: 1,
        text: settings.welcomeMessage || "Hi there!",
        sender: "bot",
        type: "text",
      },
    ]);
    setIsLoading(false);
    setIsTyping(false);
    setThinkingStatus(null);
    setConversationEnded(null);
    setRemainingMessages(null);
  }, [storeId, visitorId, settings.welcomeMessage]);

  // ── Restore thread + message history on mount ──
  useEffect(() => {
    if (!storeId || !visitorId || historyLoadedRef.current || !token) return;
    historyLoadedRef.current = true;

    const existing = getPersistedThreadId(storeId, visitorId);
    threadIdRef.current = existing;
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

        if (persistedConversationId) {
          try {
            const response = await getConversationMessages(
              client,
              { conversationId: persistedConversationId },
              requestConfig,
            );
            restoredMessages = normalizeHistoryMessages(
              response?.data?.data?.messages || [],
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              clearConversationId(storeId, visitorId);
              conversationIdRef.current = null;
            }
          }
        }

        if (restoredMessages.length > 0) {
          setMessages((prev) => [...prev, ...restoredMessages]);
        }
      } catch {
        /* history load failed silently */
      }
    })();

    return () => controller.abort();
  }, [apiUrl, storeId, token, visitorId]);

  // ── Request a fresh token via Socket.IO ──
  const requestTokenRefresh = useCallback(() => {
    const s = socket?.current;
    if (s?.connected) {
      s.emit("widget:token:request");
    }
  }, [socket]);

  // ── Send message + stream response ──
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading || !storeId) return;

      // Ensure thread ID
      if (!threadIdRef.current) {
        threadIdRef.current = generateThreadId(storeId);
        persistThreadId(storeId, visitorId, threadIdRef.current);
      }

      // Append user message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          text,
          sender: "user",
          type: "text",
        },
      ]);

      // Create bot placeholder
      const botMsgId = Date.now() + Math.random();
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          text: "",
          sender: "bot",
          type: "text",
          isStreaming: true,
        },
      ]);

      setIsLoading(true);
      setIsTyping(true);
      abortRef.current = new AbortController();

      const url = `${aiUrl}/threads/${threadIdRef.current}/stream`;
      let accumulatedText = "";
      let accumulatedProducts = [];
      let accumulatedActions = [];
      let accumulatedSuggestions = [];
      let sseBuffer = "";

      const doStream = async (retried) => {
        try {
          const jwt = tokenRef.current;
          const response = await fetch(url, {
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
            const status = response.status;

            // On 401, request a token refresh and retry once
            if (status === 401 && !retried) {
              requestTokenRefresh();
              // Wait briefly for the refreshed token to arrive
              await new Promise((r) => setTimeout(r, 1500));
              return doStream(true);
            }

            let errorText;
            if (status === 429) {
              errorText =
                "Daily conversation limit reached. Please try again tomorrow.";
            } else if (status === 401) {
              errorText = "Session expired. Please refresh the page.";
            } else if (status === 403) {
              errorText = "This store is not authorized for AI chat.";
            } else if (status >= 500) {
              errorText =
                "AI assistant is temporarily unavailable. Please try again shortly.";
            } else {
              errorText = `Request failed (${status}).`;
            }

            // Replace bot placeholder with error
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, text: errorText, isStreaming: false, isError: true }
                  : m,
              ),
            );
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const parts = sseBuffer.split("\n\n");
            sseBuffer = parts.pop() || "";

            const events = parseSSE(parts.join("\n\n"));

            for (const evt of events) {
              if (evt.event === "messages/partial") {
                const chunks = Array.isArray(evt.data) ? evt.data : [evt.data];
                for (const chunk of chunks) {
                  if (chunk?.content) {
                    accumulatedText += chunk.content;
                  }
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId ? { ...m, text: accumulatedText } : m,
                  ),
                );
              } else if (evt.event === "messages/replace") {
                if (evt.data?.content) {
                  accumulatedText = evt.data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, text: accumulatedText } : m,
                    ),
                  );
                }
              } else if (evt.event === "thinking") {
                const status = evt.data?.status;
                if (status) setThinkingStatus(status);
              } else if (evt.event === "cards") {
                if (evt.data?.cards?.length)
                  accumulatedProducts = evt.data.cards;
              } else if (evt.event === "suggestions") {
                if (evt.data?.suggestions?.length)
                  accumulatedSuggestions = evt.data.suggestions;
              } else if (evt.event === "updates") {
                if (evt.data && typeof evt.data === "object") {
                  for (const nodeData of Object.values(evt.data)) {
                    const prods = nodeData?.products || nodeData?.cards;
                    if (prods?.length) {
                      accumulatedProducts = prods;
                    }
                    if (nodeData?.actions?.length) {
                      accumulatedActions = nodeData.actions;
                    }
                    if (nodeData?.suggestions?.length) {
                      accumulatedSuggestions = nodeData.suggestions;
                    }
                  }
                }
              } else if (evt.event === "end") {
                // Capture trace_id for feedback
                if (evt.data?.trace_id) {
                  lastTraceIdRef.current = evt.data.trace_id;
                }
                if (evt.data?.conversation_id) {
                  conversationIdRef.current = evt.data.conversation_id;
                  persistConversationId(
                    storeId,
                    visitorId,
                    evt.data.conversation_id,
                  );
                }
                if (evt.data?.remaining_messages != null) {
                  setRemainingMessages(evt.data.remaining_messages);
                }

                setThinkingStatus(null);

                // Finalize the bot text message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, text: accumulatedText, isStreaming: false }
                      : m,
                  ),
                );

                // Append product carousel if any
                if (accumulatedProducts.length > 0) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      sender: "bot",
                      type: "products",
                      items: accumulatedProducts.map(normalizeProduct),
                    },
                  ]);
                }

                // Append action buttons if any
                if (accumulatedActions.length > 0) {
                  const parsed = parseActions(accumulatedActions);
                  setMessages((prev) => [
                    ...prev,
                    ...parsed.map((action) => ({
                      id: Date.now() + Math.random(),
                      sender: "bot",
                      ...action,
                    })),
                  ]);
                }

                // Append suggestion chips if any
                if (accumulatedSuggestions.length > 0) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      sender: "bot",
                      type: "suggestions",
                      items: accumulatedSuggestions,
                    },
                  ]);
                }

                // Append feedback buttons if we have a trace_id
                if (lastTraceIdRef.current) {
                  const traceId = lastTraceIdRef.current;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now() + Math.random(),
                      sender: "bot",
                      type: "feedback_request",
                      traceId,
                      aiUrl,
                      token: tokenRef.current,
                    },
                  ]);
                }
              } else if (evt.event === "conversation_ended") {
                const reason = evt.data?.reason || "message_limit";
                const endMsg =
                  evt.data?.message ||
                  "This conversation has ended. Start a new chat!";
                // Show the end message as a bot text message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, text: endMsg, isStreaming: false }
                      : m,
                  ),
                );
                // Append any end actions
                if (evt.data?.actions?.length) {
                  const parsed = parseActions(evt.data.actions);
                  setMessages((prev) => [
                    ...prev,
                    ...parsed.map((action) => ({
                      id: Date.now() + Math.random(),
                      sender: "bot",
                      ...action,
                    })),
                  ]);
                }
                setConversationEnded({ reason, message: endMsg });
              } else if (evt.event === "error") {
                const errMsg =
                  evt.data?.error || "An error occurred. Please try again.";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? {
                          ...m,
                          text: errMsg,
                          isStreaming: false,
                          isError: true,
                        }
                      : m,
                  ),
                );
              }
            }
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            if (!accumulatedText) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? {
                        ...m,
                        text: "Connection lost. Please try again.",
                        isStreaming: false,
                        isError: true,
                      }
                    : m,
                ),
              );
            } else {
              // Keep partial text, just stop streaming
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, isStreaming: false } : m,
                ),
              );
            }
          }
        }
      };

      try {
        await doStream(false);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
        setThinkingStatus(null);
        abortRef.current = null;
      }
    },
    [storeId, aiUrl, isLoading, requestTokenRefresh],
  );

  const startNewChat = useCallback(() => {
    clearThreadId(storeId, visitorId);
    clearConversationId(storeId, visitorId);
    threadIdRef.current = null;
    conversationIdRef.current = null;
    setMessages([
      {
        id: 1,
        text: settings.welcomeMessage || "Hi there!",
        sender: "bot",
        type: "text",
      },
    ]);
    setConversationEnded(null);
    setRemainingMessages(null);
  }, [storeId, visitorId, settings.welcomeMessage]);

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
