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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
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
          />
        </div>
      ))}
      {isLoading &&
        !messages.some((m) => m.isStreaming) &&
        (thinkingStatus ? (
          <ThinkingStatus status={thinkingStatus} />
        ) : (
          <TypingIndicator />
        ))}
      <div ref={bottomRef} />
    </div>
  );
}
