/**
 * @module ui/ChatWindow
 * @description The chat panel — header, scrolling message list, input bar.
 *
 * Owns the panel-scoped overlays (cart bottom sheet, HITL interrupt dialog) and
 * the chat status surface (stream errors, closed banner). The fixed panel is the
 * containing block for those absolutely-positioned overlays, so nothing escapes
 * the shadow root.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { VoiceInputButton } from "./VoiceInputButton";
import { VoicePanel } from "./VoicePanel";
import { VoiceErrorBanner } from "./VoiceErrorBanner";
import { useVoiceInput } from "@/core/use-voice-input";
import { InterruptDialog } from "./InterruptDialog";
import { CartSheetProvider } from "@/artifacts/commerce/CartSheet";
import { ChatActionsProvider } from "@/artifacts/chat-actions";
import { classifyWidgetError } from "@/core/error-classifier";
import type { WidgetConfig } from "@/config/types";
import type { useWidgetChat } from "@/core/use-widget-chat";

export type WidgetChat = ReturnType<typeof useWidgetChat>;

interface ChatWindowProps {
  isOpen: boolean;
  isMobile: boolean;
  config: WidgetConfig;
  brandColor: string;
  chat: WidgetChat;
  onClose: () => void;
  onStartNewChat: () => void;
}

/**
 * Desktop panel size mode — the two expand controls persist across all states:
 *   - `default`  — the standard 400×600 corner panel
 *   - `expanded` — a larger corner panel (still docked bottom-right)
 *   - `modal`    — a large centered modal over a dimmed backdrop. Deliberately
 *                  capped (not edge-to-edge) so it reads as a "big screen"
 *                  overlay, not a full takeover.
 * The two toggles are mutually exclusive (see ChatWindow). On mobile the panel
 * is always full-bleed, so the size mode is ignored.
 */
export type PanelSize = "default" | "expanded" | "modal";

const backdrop = css`
  position: fixed;
  inset: 0;
  z-index: ${tokens.z.host};
  background: rgba(17, 12, 32, 0.45);
  pointer-events: auto;
  animation: z-fade-in 0.2s ease-out;
`;

const panel = (isMobile: boolean, isOpen: boolean, size: PanelSize) => {
  const modal = !isMobile && size === "modal";
  const expanded = !isMobile && size === "expanded";
  return css`
    position: fixed;
    z-index: ${tokens.z.host};
    display: ${isOpen ? "flex" : "none"};
    flex-direction: column;
    overflow: hidden;
    background: var(--z-bg);
    pointer-events: auto;
    transition:
      width 0.2s ease,
      height 0.2s ease;
    ${isMobile
      ? css`
          inset: 0;
          border-radius: 0;
        `
      : modal
        ? css`
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(640px, 92vw);
            height: min(85vh, 900px);
            border-radius: ${tokens.radius.xl};
            border: 1px solid var(--z-border);
            box-shadow: var(--z-shadow-md);
          `
        : css`
            bottom: 90px;
            right: 20px;
            width: ${expanded ? "min(560px, calc(100vw - 40px))" : "400px"};
            height: ${expanded ? "min(820px, calc(100vh - 120px))" : "600px"};
            max-height: calc(100vh - 120px);
            border-radius: ${tokens.radius.xl};
            border: 1px solid var(--z-border);
            box-shadow: var(--z-shadow-md);
          `}
  `;
};

export function ChatWindow({
  isOpen,
  isMobile,
  config,
  brandColor,
  chat,
  onClose,
  onStartNewChat,
}: ChatWindowProps) {
  // Desktop panel size — the two expand controls are mutually exclusive, so a
  // single enum keeps them from both being active at once.
  const [size, setSize] = useState<PanelSize>("default");
  const toggleExpand = () =>
    setSize((s) => (s === "expanded" ? "default" : "expanded"));
  const toggleModal = () => setSize((s) => (s === "modal" ? "default" : "modal"));
  const handleClose = () => {
    setSize("default"); // reset so the panel reopens at its default size
    onClose();
  };

  const showBackdrop = isOpen && !isMobile && size === "modal";

  // Lifted so voice input (transcript) and typing share the same textarea value.
  const [draft, setDraft] = useState("");
  // Mirror of `draft` for the voice auto-send path: a recording's onstop
  // callback is bound when recording starts, so reading `draft` from its
  // closure would miss anything typed *during* the recording. The ref always
  // holds the latest value.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Voice input state drives the composer: recording/transcribing replace the
  // input bar with a VoicePanel; errors surface as a banner above it. On a
  // finished transcript we auto-send (combined with anything already typed).
  const voice = useVoiceInput({
    token: chat.token,
    onTranscript: (text) => {
      const typed = draftRef.current.trim();
      const combined = typed ? `${typed} ${text}` : text;
      setDraft("");
      chat.send(combined);
    },
  });

  // A cancelled interrupt is hidden until a new one arrives (keyed by payload).
  const [dismissedInterrupt, setDismissedInterrupt] = useState<string | null>(null);
  const interruptKey = chat.interrupt ? JSON.stringify(chat.interrupt) : null;
  const showInterrupt = Boolean(chat.interrupt) && interruptKey !== dismissedInterrupt;

  const errorState = useMemo(
    () => (chat.error ? classifyWidgetError(chat.error) : null),
    [chat.error],
  );

  const inputDisabled = errorState?.kind === "UNAUTHORIZED";

  const chatActions = useMemo(
    () => ({
      hasPendingInterrupt: showInterrupt,
      respondToInterrupt: chat.respondToInterrupt,
    }),
    [showInterrupt, chat.respondToInterrupt],
  );

  return (
    <>
      {showBackdrop && (
        <div css={backdrop} aria-hidden="true" onClick={() => setSize("default")} />
      )}
      <div css={panel(isMobile, isOpen, size)} role="dialog" aria-label={`${config.name} chat`}>
        <ChatActionsProvider value={chatActions}>
          <CartSheetProvider>
            <ChatHeader
              config={config}
              isMobile={isMobile}
              size={size}
              onToggleExpand={toggleExpand}
              onToggleModal={toggleModal}
              onClose={handleClose}
            />
          <MessageList
            config={config}
            chat={chat}
            errorState={errorState}
            onStartNewChat={onStartNewChat}
          />
          {!chat.isClosed &&
            (voice.state === "recording" || voice.state === "transcribing" ? (
              <VoicePanel
                mode={voice.state}
                brandColor={brandColor}
                isMobile={isMobile}
                onStop={voice.stop}
                onCancel={voice.cancel}
              />
            ) : (
              <>
                {voice.state === "error" && voice.errorMessage && (
                  <VoiceErrorBanner message={voice.errorMessage} />
                )}
                <InputBar
                  brandColor={brandColor}
                  disabled={inputDisabled}
                  isMobile={isMobile}
                  isStreaming={chat.isStreaming}
                  onSend={chat.send}
                  onStop={chat.stop}
                  value={draft}
                  onValueChange={(v) => {
                    setDraft(v);
                    // Clear a prior voice error the moment the user types.
                    if (voice.state === "error") voice.reset();
                  }}
                  voiceControl={
                    config.voiceAssistantEnabled && voice.supported ? (
                      <VoiceInputButton
                        brandColor={brandColor}
                        disabled={inputDisabled || chat.isStreaming}
                        onStart={voice.start}
                      />
                    ) : undefined
                  }
                />
              </>
            ))}

          {showInterrupt && (
              <InterruptDialog
                interrupt={chat.interrupt}
                brandColor={brandColor}
                onRespond={(response) => {
                  setDismissedInterrupt(null);
                  chat.respondToInterrupt(response);
                }}
                onCancel={() => setDismissedInterrupt(interruptKey)}
              />
            )}
          </CartSheetProvider>
        </ChatActionsProvider>
      </div>
    </>
  );
}
