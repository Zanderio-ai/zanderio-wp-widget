/**
 * @module ui/MessageList
 * @description Scrolling transcript — welcome bubble, message bubbles with
 * markdown + artifacts, and the streaming thinking indicator.
 */

import { useEffect, useRef } from "react";
import { css } from "@emotion/react";
import {
  InterruptCard,
  MessageContent,
  VoiceMessageBubble,
  VoiceReplyFailed,
} from "@zanderio/core/chat-ui";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { StatusBanner } from "./StatusBanner";
import { ConversationEndedScreen } from "./ConversationEndedScreen";
import { ImageMessageBubble } from "./ImageMessageBubble";
import { ArtifactCard } from "@zanderio/core/artifacts";
import type { WidgetConfig } from "@/config/types";
import {
  followUpSuggestions,
  messageArtifacts,
  messageImage,
  messageVoice,
  visibleMessages,
  voiceReplyProgress,
} from "@zanderio/core/chat";
import type { ChatErrorState, ChatUIMessage } from "@zanderio/core/chat";
import type { WidgetChat } from "./ChatWindow";

function hasText(message: ChatUIMessage): boolean {
  return message.parts.some((p) => p.type === "text" && p.text.trim().length > 0);
}

interface MessageListProps {
  config: WidgetConfig;
  chat: WidgetChat;
  brandColor: string;
  errorState: ChatErrorState | null;
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

export function MessageList({
  config,
  chat,
  brandColor,
  errorState,
  onStartNewChat,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.isStreaming, chat.voiceReplyPending, chat.voiceReplyStatus]);

  // Which messages show, what each offers next, and how voice replies are
  // waited on are shared rules (@zanderio/core/chat); this file only draws them.
  const visible = visibleMessages(chat.messages);

  // Voice-to-voice answers a voice message with a voice message, never with
  // text: while one is on its way the written reply stays hidden, and if it
  // cannot be created the visitor gets a retry, not the text.
  const { awaitingId: awaitingVoiceId, onItsWay: voiceOnItsWay } = voiceReplyProgress(
    chat.messages,
    chat.voiceReplyPending,
    chat.voiceReplyStatus,
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
        const artifacts = messageArtifacts(message);
        const suggestions = followUpSuggestions(message);
        const audio = messageVoice(message);
        const image = messageImage(message);
        const voiceStatus = chat.voiceReplyStatus[message.id];
        const awaitingVoice = message.id === awaitingVoiceId || voiceStatus === "pending";

        return (
          <div key={message.id} css={row(isBot)}>
            {image && <ImageMessageBubble image={image} token={chat.token} />}
            {audio ? (
              <VoiceMessageBubble audio={audio} isBot={isBot} brandColor={config.color} />
            ) : voiceStatus === "failed" ? (
              <VoiceReplyFailed
                brandColor={config.color}
                onRetry={() => chat.retryVoiceReply(message.id)}
              />
            ) : awaitingVoice || (image && !hasText(message)) ? null : (
              <div
                css={[
                  bubble(isBot, config.color),
                  image &&
                    css`
                      margin-top: 6px;
                    `,
                ]}
              >
                <MessageContent message={message} />
              </div>
            )}
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
                {artifacts.map((artifact, i) => (
                  <ArtifactCard key={i} artifact={artifact} />
                ))}
              </div>
            )}
            {isBot && suggestions.length > 0 && (
              <div
                css={css`
                  margin-top: 8px;
                  display: flex;
                  flex-wrap: wrap;
                  gap: 5px;
                `}
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={chat.isStreaming || chat.isClosed}
                    onClick={() => chat.send(suggestion)}
                    css={css`
                      border: 1px solid color-mix(in srgb, ${brandColor} 28%, transparent);
                      border-radius: 999px;
                      background: color-mix(in srgb, ${brandColor} 5%, transparent);
                      color: ${brandColor};
                      padding: 4px 8px;
                      font: inherit;
                      font-size: 11px;
                      font-weight: 500;
                      line-height: 1.25;
                      cursor: pointer;
                      transition:
                        background-color 150ms ease,
                        border-color 150ms ease;
                      &:hover:not(:disabled) {
                        background: color-mix(in srgb, ${brandColor} 10%, transparent);
                        border-color: color-mix(in srgb, ${brandColor} 45%, transparent);
                      }
                      &:disabled {
                        cursor: default;
                        opacity: 0.55;
                      }
                    `}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {chat.interrupt && !chat.isStreaming && (
        <div css={row(true)}>
          <InterruptCard
            interrupt={chat.interrupt}
            brandColor={brandColor}
            brandName={config.name}
            onRespond={chat.respondToInterrupt}
          />
        </div>
      )}

      {chat.isStreaming ? (
        <ThinkingIndicator brandColor={config.color} label={chat.statusLabel} />
      ) : (
        voiceOnItsWay && (
          <ThinkingIndicator brandColor={config.color} label="Recording a voice message…" />
        )
      )}

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
