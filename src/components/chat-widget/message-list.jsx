/**
 * Zanderio Widget — MessageList
 *
 * Scrollable container that renders the conversation.  Each message is
 * wrapped in a flex row aligned left (bot) or right (user) and delegated
 * to `MessageBubble` for type-specific rendering.
 *
 * Auto-scrolls to the bottom whenever `messages` or `isLoading` changes
 * via a sentinel `<div ref={bottomRef} />` at the end of the list.
 *
 * When `isLoading` is true a `TypingIndicator` (“Thinking…”) is
 * appended after the last message.
 *
 * @param {{ messages, isLoading, widgetConfig, onAddToCart,
 *           onSendMessage, onShowToast }} props
 *
 * @module components/chat-widget/message-list
 */

import { useEffect, useRef } from "react";
import MessageBubble from "../messages/message-bubble";
import TypingIndicator from "../messages/typing-indicator";
import ThinkingStatus from "../messages/thinking-status";

export default function MessageList({
  messages,
  isLoading,
  thinkingStatus,
  widgetConfig,
  onAddToCart,
  onSendMessage,
  onShowToast,
}) {
  const messagesRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const updateAutoScrollState = () => {
    const container = messagesRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= 120;
  };

  useEffect(() => {
    const container = messagesRef.current;
    if (!container || !shouldAutoScrollRef.current) return undefined;

    const frameId = requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });

    return () => cancelAnimationFrame(frameId);
  }, [messages, isLoading, thinkingStatus]);

  return (
    <div
      className="chat-messages"
      ref={messagesRef}
      onScroll={updateAutoScrollState}
    >
      {messages.map((msg, idx) => {
        if (msg.type === "action") {
          return null;
        }

        // Don't render an empty streaming bubble — the thinking indicator handles this
        if (msg.isStreaming && !msg.text?.length) {
          return null;
        }

        return (
          <div
            key={msg.id}
            style={{
              display: "flex",
              marginBottom: "1rem",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <MessageBubble
              msg={msg}
              widgetConfig={widgetConfig}
              onAddToCart={onAddToCart}
              onSendMessage={onSendMessage}
              onShowToast={onShowToast}
              onRetry={
                msg.isError
                  ? () => {
                      const lastUserMsg = messages
                        .slice(0, idx)
                        .reverse()
                        .find((m) => m.sender === "user");
                      if (lastUserMsg) onSendMessage(lastUserMsg.text);
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
      {isLoading &&
        !messages.some((m) => m.isStreaming && m.text?.length > 0) &&
        (thinkingStatus ? (
          <>
            <ThinkingStatus status={thinkingStatus} />
            {thinkingStatus === "searching_products" && (
              <div className="product-skeleton-row">
                <div className="product-card-skeleton" />
                <div className="product-card-skeleton" />
                <div className="product-card-skeleton" />
              </div>
            )}
          </>
        ) : (
          <TypingIndicator />
        ))}
    </div>
  );
}
