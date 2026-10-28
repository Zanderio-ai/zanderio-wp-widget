/**
 * @module ui/ChatWindow
 * @description The chat panel — header, scrolling message list, input bar.
 *
 * Owns the panel-scoped overlays (cart bottom sheet) and the chat status
 * surface (stream errors, closed banner). The pending booking interrupt is
 * rendered inline by `MessageList`, not as an overlay here. The fixed panel
 * is the containing block for absolutely-positioned overlays, so nothing
 * escapes the shadow root.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { PoweredBy } from "./PoweredBy";
import { ImageAttachButton } from "./ImageAttachButton";
import { ImagePreview } from "./ImagePreview";
import { useImageAttachment } from "@/core/use-image-attachment";
import { CartSheetProvider } from "@zanderio/core/artifacts";
import { classifyChatError } from "@zanderio/core/chat";
import {
  SuggestedQuestions,
  VoiceErrorBanner,
  VoiceInputButton,
  VoicePanel,
  useVoiceInput,
  voicePlayer,
} from "@zanderio/core/chat-ui";
import { getCartAdapter } from "@/platform/cart";
import { fetchVoiceAudio, voiceUploader } from "@/core/voice-audio";
import type { Storefront, WidgetConfig } from "@/config/types";
import type { useWidgetChat } from "@/core/use-widget-chat";

export type WidgetChat = ReturnType<typeof useWidgetChat>;

interface ChatWindowProps {
  isOpen: boolean;
  isMobile: boolean;
  config: WidgetConfig;
  brandColor: string;
  chat: WidgetChat;
  /** Detected once in App (with the settings hint) and shared with the nudge engine. */
  storefront: Storefront;
  /** Server-decided starter questions; empty when the toggle is off. */
  suggestedQuestions?: string[];
  onClose: () => void;
  onStartNewChat: () => void;
}

/**
 * Desktop panel size mode — the two expand controls persist across all states:
 *   - `default`  — the standard 400×600 corner panel
 *   - `expanded` — a larger corner panel (still docked to the chosen side)
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

// Where the shared voice cards sit in this composer — the cards themselves
// carry no outer spacing, so each host places them in its own layout.
const voiceDock = css`
  padding: 12px;
  border-top: 1px solid var(--z-border);
  background: var(--z-bg);
  flex-shrink: 0;
`;

const voiceErrorDock = css`
  padding: 12px 12px 0;
  flex-shrink: 0;
`;

const panel = (
  isMobile: boolean,
  isOpen: boolean,
  size: PanelSize,
  position: WidgetConfig["position"],
) => {
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
    ${
      isMobile
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
              /* Dock the panel on the same side as the launcher. */
              ${position === "left" ? "left: 20px;" : "right: 20px;"}
              width: ${expanded ? "min(560px, calc(100vw - 40px))" : "400px"};
              height: ${expanded ? "min(820px, calc(100vh - 120px))" : "600px"};
              max-height: calc(100vh - 120px);
              border-radius: ${tokens.radius.xl};
              border: 1px solid var(--z-border);
              box-shadow: var(--z-shadow-md);
            `
    }
  `;
};

export function ChatWindow({
  isOpen,
  isMobile,
  config,
  brandColor,
  chat,
  storefront,
  suggestedQuestions = [],
  onClose,
  onStartNewChat,
}: ChatWindowProps) {
  // Desktop panel size — the two expand controls are mutually exclusive, so a
  // single enum keeps them from both being active at once.
  const [size, setSize] = useState<PanelSize>("default");
  const toggleExpand = () => setSize((s) => (s === "expanded" ? "default" : "expanded"));
  const toggleModal = () => setSize((s) => (s === "modal" ? "default" : "modal"));
  const handleClose = () => {
    setSize("default"); // reset so the panel reopens at its default size
    voicePlayer.stop(); // a closed widget must not keep talking
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
  const voiceToVoice = config.voiceMode === "voice_to_voice";
  const upload = useMemo(() => voiceUploader(chat.token), [chat.token]);
  const voice = useVoiceInput({
    upload,
    onTranscript: (text) => {
      const typed = draftRef.current.trim();
      const combined = typed ? `${typed} ${text}` : text;
      setDraft("");
      chat.send(combined);
    },
    // Voice-to-voice sends the recording itself as a voice message; anything
    // typed stays in the composer for the visitor to send separately.
    mode: voiceToVoice ? "voice" : "text",
    conversationId: chat.conversationId,
    onVoiceMessage: chat.sendVoice,
  });

  const startRecording = () => {
    if (voiceToVoice) {
      // Inside the tap: lets the reply autoplay later (iOS needs the gesture).
      voicePlayer.unlock();
    }
    voicePlayer.stop();
    void voice.start();
  };

  // The shared player knows nothing about this host's auth — it takes a
  // loader. Declared before the autoplay effect so a reply never plays with a
  // stale token.
  useEffect(() => {
    voicePlayer.setLoader((audioId) => fetchVoiceAudio(audioId, chat.token));
  }, [chat.token]);

  // Play the spoken reply as it arrives — only while the visitor is looking
  // at the chat. If the browser refuses, the bubble is there to tap.
  const voiceReplyId = chat.voiceReply?.audio_id;
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    if (voiceReplyId && isOpenRef.current) void voicePlayer.play(voiceReplyId);
  }, [voiceReplyId]);

  // Leaving the conversation (closed, or a new chat started) ends playback.
  useEffect(() => () => voicePlayer.stop(), [chat.conversationId, chat.isClosed]);

  // Photo search: the chosen photo is checked by the AI service when the
  // visitor sends, and only an accepted one becomes a chat turn.
  const photo = useImageAttachment({ conversationId: chat.conversationId, token: chat.token });
  const photoSearch = config.imageSearchEnabled;

  const send = async (text: string) => {
    if (!photoSearch || !photo.pending) {
      chat.send(text);
      return;
    }
    const accepted = await photo.send(text);
    if (accepted) {
      chat.sendImage(accepted);
    } else if (text) {
      // Not sent — give the visitor their words back, unless they typed more.
      setDraft((current) => current || text);
    }
  };

  const errorState = useMemo(
    () => (chat.error ? classifyChatError(chat.error) : null),
    [chat.error],
  );

  // The shared cart sheet has no notion of a storefront — it takes a port. This
  // is where the widget hands it the real WooCommerce/Shopify adapter.
  const cart = useMemo(() => getCartAdapter(storefront), [storefront]);

  const inputDisabled = errorState?.kind === "UNAUTHORIZED" || Boolean(chat.interrupt);

  return (
    <>
      {showBackdrop && <div css={backdrop} aria-hidden="true" onClick={() => setSize("default")} />}
      <div
        css={panel(isMobile, isOpen, size, config.position)}
        role="dialog"
        aria-label={`${config.name} chat`}
      >
        <CartSheetProvider cart={cart}>
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
            brandColor={brandColor}
            errorState={errorState}
            onStartNewChat={onStartNewChat}
          />
          {/* Starter questions — only on an empty chat (first open, "start new
              chat", or a new chat after a closed one), before the visitor's
              first message. Hidden while history loads so a returning visitor
              never sees them flash, and until the conversation can accept a
              send so a tap is never swallowed. The list is empty when the
              merchant's toggle is off (server decides). */}
          {!chat.isClosed &&
            chat.isReady &&
            !chat.isHistoryLoading &&
            !inputDisabled &&
            !chat.messages.some((m) => m.role === "user") && (
              <SuggestedQuestions
                questions={suggestedQuestions}
                brandColor={brandColor}
                compact={isMobile}
                onSelect={chat.send}
                disabled={chat.isStreaming}
              />
            )}
          {!chat.isClosed &&
            (voice.state === "recording" || voice.state === "transcribing" ? (
              <div css={voiceDock}>
                <VoicePanel
                  mode={voice.state}
                  brandColor={brandColor}
                  compact={isMobile}
                  onStop={voice.stop}
                  onCancel={voice.cancel}
                  voiceMessage={voiceToVoice}
                  levels={voice.levels}
                />
              </div>
            ) : (
              <>
                {voice.state === "error" && voice.errorMessage && (
                  <div css={voiceErrorDock}>
                    <VoiceErrorBanner message={voice.errorMessage} />
                  </div>
                )}
                {photoSearch && photo.error && (
                  <div css={voiceErrorDock}>
                    <VoiceErrorBanner message={photo.error} />
                  </div>
                )}
                <InputBar
                  brandColor={brandColor}
                  disabled={inputDisabled}
                  isMobile={isMobile}
                  isStreaming={chat.isStreaming}
                  onSend={(text) => void send(text)}
                  onStop={chat.stop}
                  value={draft}
                  onValueChange={(v) => {
                    setDraft(v);
                    // Clear a prior voice or photo error the moment the user types.
                    if (voice.state === "error") voice.reset();
                    if (photo.error) photo.dismissError();
                  }}
                  attachment={
                    photoSearch && photo.pending ? (
                      <ImagePreview
                        previewUrl={photo.pending.previewUrl}
                        uploading={photo.uploading}
                        onRemove={photo.clear}
                      />
                    ) : undefined
                  }
                  attachControl={
                    photoSearch ? (
                      <ImageAttachButton
                        brandColor={brandColor}
                        disabled={inputDisabled || photo.uploading}
                        onSelect={(file) => void photo.select(file)}
                      />
                    ) : undefined
                  }
                  sendBlocked={photo.uploading}
                  voiceControl={
                    config.voiceMode !== "off" && voice.supported ? (
                      <VoiceInputButton
                        brandColor={brandColor}
                        disabled={inputDisabled || chat.isStreaming || chat.voiceReplyPending}
                        onStart={startRecording}
                      />
                    ) : undefined
                  }
                />
              </>
            ))}
          <PoweredBy />
        </CartSheetProvider>
      </div>
    </>
  );
}
