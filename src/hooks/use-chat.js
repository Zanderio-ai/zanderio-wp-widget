/**
 * @module hooks/use-chat
 * @description Central orchestrator for the conversation state. Owns the
 * `messages` array and provides every operation the UI needs to drive a
 * chat session.
 *
 * @param {string|null} storeId
 * @param {string} visitorId
 * @param {string|null} sessionId
 * @param {object} settings
 * @returns {{ messages, sendMessage, isLoading, isTyping, updateWelcomeMessage }}
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createApiClient, getConversations } from "../services/api.service";
import { parseActions } from "../utils/content-blocks";

export function useChat(storeId, visitorId, sessionId, settings) {
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
  const historyLoadedRef = useRef(false);

  const apiRoot =
    import.meta.env.VITE_API_BASE_URL ||
    settings.apiRoot ||
    "https://dev-api.zanderio.ai";
  const apiRef = useRef(createApiClient(apiRoot));

  const updateWelcomeMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [{ ...prev[0], text: msg }];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!storeId || !visitorId || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    getConversations(apiRef.current, { storeId, visitorId })
      .then((response) => {
        const conversations = response?.data?.data;
        if (
          !conversations ||
          !Array.isArray(conversations) ||
          conversations.length === 0
        )
          return;

        const historyMessages = [];
        for (const msg of conversations) {
          if (msg.role === "user" && msg.content) {
            historyMessages.push({
              id: Date.now() + Math.random(),
              text: msg.content,
              sender: "user",
              type: "text",
            });
          } else if (msg.role === "assistant") {
            if (msg.content) {
              historyMessages.push({
                id: Date.now() + Math.random(),
                sender: "bot",
                type: "text",
                text: msg.content,
              });
            }

            if (
              msg.products &&
              Array.isArray(msg.products) &&
              msg.products.length > 0
            ) {
              historyMessages.push({
                id: Date.now() + Math.random(),
                sender: "bot",
                type: "products",
                items: msg.products,
              });
            }

            if (msg.actions && Array.isArray(msg.actions)) {
              const parsedActions = parseActions(msg.actions);
              for (const action of parsedActions) {
                historyMessages.push({
                  id: Date.now() + Math.random(),
                  sender: "bot",
                  ...action,
                });
              }
            }
          }
        }

        if (historyMessages.length > 0) {
          setMessages((prev) => [...prev, ...historyMessages]);
        }
      })
      .catch(() => {
        /* history load failed silently */
      });
  }, [storeId, visitorId]);

  const sendMessage = useCallback(async (_text) => {
    void _text;
  }, []);

  return { messages, sendMessage, isLoading, isTyping, updateWelcomeMessage };
}
