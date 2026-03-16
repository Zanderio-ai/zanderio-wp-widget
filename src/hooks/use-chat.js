/**
 * Zanderio Widget - useChat Hook
 *
 * Central orchestrator for the conversation state. Owns the `messages`
 * array and provides every operation the UI needs to drive a chat session.
 *
 * Responsibilities:
 *   - sendMessage(text) - POST to REST API, handle 200/202 responses
 *   - processContentBlocks(blocks, actions) - parse blocks + actions, render sequentially
 *   - updateWelcomeMessage(msg) - replace initial welcome bubble
 *   - loadConversationHistory - fetch prior messages on mount via GET /stores/widget/conversations
 *
 * Socket integration: listens for `widget:agent:response` to receive
 * async bot replies including blocks and actions arrays.
 *
 * @param {React.MutableRefObject} socketRef
 * @param {string|null} storeId
 * @param {string} shopperId
 * @param {string|null} sessionId
 * @param {object} settings
 * @returns {{ messages, sendMessage, isLoading, isTyping, updateWelcomeMessage }}
 * @module hooks/use-chat
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  createApiClient,
  sendChatMessage,
  getConversations,
} from "../services/api.service";
import { parseContentBlocks, parseActions } from "../utils/content-blocks";
import { useTypingAnimation } from "./use-typing-animation";

export function useChat(socketRef, storeId, shopperId, sessionId, settings) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: settings.welcomeMessage || "Hi there!",
      sender: "bot",
      type: "text",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const historyLoadedRef = useRef(false);

  const apiRoot =
    import.meta.env.VITE_API_BASE_URL ||
    settings.apiRoot ||
    "https://dev-api.zanderio.ai";
  const apiRef = useRef(createApiClient(apiRoot));

  const { isTyping, typeText } = useTypingAnimation(setMessages);

  const updateWelcomeMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [{ ...prev[0], text: msg }];
      }
      return prev;
    });
  }, []);

  const processContentBlocks = useCallback(
    async (contentBlocks, actions) => {
      if (!contentBlocks || !Array.isArray(contentBlocks)) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            type: "text",
            text: "Sorry, I didn't get that.",
          },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(false);
        const parsed = parseContentBlocks(contentBlocks);
        const parsedActions = parseActions(actions);

        for (const item of parsed) {
          if (item.type === "text") {
            await new Promise((resolve) => typeText(item.content, resolve));
          } else {
            await new Promise((resolve) => {
              setTimeout(
                () => {
                  setMessages((prev) => [
                    ...prev,
                    { id: Date.now(), sender: "bot", ...item },
                  ]);
                  resolve();
                },
                item.type === "action" ? 100 : 300,
              );
            });
          }
        }

        for (const action of parsedActions) {
          await new Promise((resolve) => {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                { id: Date.now(), sender: "bot", ...action },
              ]);
              resolve();
            }, 100);
          });
        }
      } catch (error) {
        console.error(
          "Zanderio Widget: Error processing content blocks:",
          error,
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            type: "text",
            text: "Oops! Something went wrong while showing the response.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [typeText],
  );

  useEffect(() => {
    if (!storeId || !shopperId || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    getConversations(apiRef.current, { storeId, shopperId })
      .then((response) => {
        const conversations = response?.data?.data;
        if (!conversations || !Array.isArray(conversations) || conversations.length === 0) return;

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
            if (msg.blocks && Array.isArray(msg.blocks)) {
              const parsed = parseContentBlocks(msg.blocks);
              for (const item of parsed) {
                if (item.type === "text") {
                  historyMessages.push({
                    id: Date.now() + Math.random(),
                    sender: "bot",
                    type: "text",
                    text: item.content,
                  });
                } else {
                  historyMessages.push({
                    id: Date.now() + Math.random(),
                    sender: "bot",
                    ...item,
                  });
                }
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
            } else if (msg.content) {
              historyMessages.push({
                id: Date.now() + Math.random(),
                sender: "bot",
                type: "text",
                text: msg.content,
              });
            }
          }
        }

        if (historyMessages.length > 0) {
          setMessages((prev) => [...prev, ...historyMessages]);
        }
      })
      .catch((err) => {
        console.error("Zanderio Widget: Failed to load conversation history:", err);
      });
  }, [storeId, shopperId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleAgentResponse = (response) => {
      console.log("Zanderio Widget: Agent response received:", response);

      const data = response?.data?.[0] || response?.data || response;
      const contentBlocks = data?.blocks;
      const actions = data?.actions;

      if (contentBlocks) {
        setIsLoading(false);
        processContentBlocks(contentBlocks, actions);
      } else {
        const textContent = data?.text || data?.message;
        if (textContent) {
          setIsLoading(false);
          typeText(textContent);
        } else {
          setIsLoading(false);
        }
      }
    };

    socket.on("widget:agent:response", handleAgentResponse);
    return () => socket.off("widget:agent:response", handleAgentResponse);
  }, [socketRef, processContentBlocks, typeText]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim()) return;

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text, sender: "user", type: "text" },
      ]);
      setIsLoading(true);

      try {
        const socket = socketRef.current;
        const response = await sendChatMessage(apiRef.current, {
          storeId,
          message: text,
          shopperId,
          socketId: socket?.id,
          sessionId,
        });

        console.log(
          "Zanderio Widget: API response:",
          response.status,
          response.data,
        );

        if (response.status === 202) return;

        const responseData =
          response?.data?.data?.[0] || response?.data?.data || response?.data;
        const contentBlocks = responseData?.blocks;
        const actions = responseData?.actions;

        if (contentBlocks && Array.isArray(contentBlocks)) {
          setIsLoading(false);
          await processContentBlocks(contentBlocks, actions);
        } else {
          const textContent = responseData?.text || responseData?.message;
          if (textContent) {
            setIsLoading(false);
            typeText(textContent);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                sender: "bot",
                type: "text",
                text: "Sorry, I didn't get that.",
              },
            ]);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Zanderio Widget: Error sending message:", error);

        const is429 = error?.response?.status === 429;
        const errorText = is429
          ? "You've reached the conversation limit. Please try again later."
          : "Oops! Something went wrong.";

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "bot",
            type: "text",
            text: errorText,
          },
        ]);
        setIsLoading(false);
      }
    },
    [storeId, shopperId, sessionId, socketRef, processContentBlocks, typeText],
  );

  return { messages, sendMessage, isLoading, isTyping, updateWelcomeMessage };
}
