/**
 * @module ui/MessageList
 * @description Scrolling transcript — welcome bubble, message bubbles with
 * markdown + artifacts, and the streaming thinking indicator.
 */

import { useEffect, useRef } from "react";
import { css } from "@emotion/react";
import { MessageContent } from "./MessageContent";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { StatusBanner } from "./StatusBanner";
import { ConversationEndedScreen } from "./ConversationEndedScreen";
import { ArtifactCard } from "@/artifacts/ArtifactCard";
import type { WidgetConfig } from "@/config/types";
import type { ChatUIMessage } from "@/core/chat-types";
import type { WidgetErrorState } from "@/core/error-classifier";
import type { WidgetChat } from "./ChatWindow";

interface MessageListProps {
  config: WidgetConfig;
  chat: WidgetChat;
  errorState: WidgetErrorState | null;
  onStartNewChat: () => void;
}

const scroller = css`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--z-bg);
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--z-border);
    border-radius: 5px;
  }
`;

const row = (isBot: boolean) => css`
  display: flex;
  flex-direction: column;
  align-items: ${isBot ? "flex-start" : "flex-end"};
  animation: z-msg-in 0.3s ease-out;
`;

const bubble = (isBot: boolean, brandColor: string) => css`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: ${isBot ? "4px 14px 14px 14px" : "14px 14px 4px 14px"};
  background: ${isBot ? "var(--z-bg-muted)" : brandColor};
  color: ${isBot ? "var(--z-text)" : "#fff"};
  font-size: 14px;
`;


function hasRenderableContent(message: ChatUIMessage): boolean {
  return message.parts.some(
    (p) =>
      (p.type === "text" && p.text.trim().length > 0) ||
      p.type === "file" ||
      p.type === "data-artifact",
  );
}

export function MessageList({ config, chat, errorState, onStartNewChat }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.isStreaming]);

  const visible = chat.messages.filter(
    (m) => m.role === "user" || hasRenderableContent(m),
  );

  return (
    <div css={scroller}>
      {/* Welcome bubble — shown before any real turn exists. */}
      {visible.length === 0 && !chat.isClosed && (
        <div css={row(true)}>
          <div css={bubble(true, config.color)}>{config.welcomeMessage}</div>
        </div>
      )}

      {visible.map((message) => {
        const isBot = message.role === "assistant";
        const artifacts = message.parts.filter(
          (p): p is Extract<typeof p, { type: "data-artifact" }> => p.type === "data-artifact",
        );

        return (
          <div key={message.id} css={row(isBot)}>
            <div css={bubble(isBot, config.color)}>
              <MessageContent message={message} />
            </div>
            {isBot && artifacts.length > 0 && (
              <div
                css={css`
                  margin-top: 10px;
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                `}
              >
                {artifacts.map((a, i) => (
                  <ArtifactCard key={i} artifact={a.data} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {chat.isStreaming && <ThinkingIndicator brandColor={config.color} />}

      {chat.isClosed && (
        <ConversationEndedScreen brandColor={config.color} onStartNewChat={onStartNewChat} />
      )}

      {errorState && errorState.kind !== "CONVERSATION_CLOSED" && (
        <StatusBanner
          severity={errorState.severity}
          title={errorState.title}
          message={errorState.message}
          action={
            errorState.kind === "UNAUTHORIZED"
              ? { label: "Refresh page", onClick: () => window.location.reload() }
              : errorState.kind === "NETWORK"
                ? { label: "Try again", onClick: () => chat.regenerate() }
                : undefined
          }
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
