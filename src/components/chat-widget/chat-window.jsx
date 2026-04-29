/**
 * Zanderio Widget — ChatWindow
 *
 * Vertical layout container for the open chat panel.  Composes:
 *
 *   • `ChatHeader`  — coloured title bar with store name, icon, close button.
 *   • `MessageList`  — scrollable area for conversation bubbles.
 *   • `InputBar`     — auto-resizing textarea + send button.
 *   • Powered-by     — inline SVG logo in the footer.
 *
 * Receives its absolute position via the `style` prop, which is
 * computed by `getChatWindowStyle()` in the parent ChatWidget.
 *
 * @param {{ widgetConfig, messages, isLoading, isTyping,
 *           onSend, onClose, onAddToCart, onShowToast, style }} props
 *
 * @module components/chat-widget/chat-window
 */

import { useState, useMemo } from "react";
import ChatHeader from "./chat-header";
import MessageList from "./message-list";
import InputBar from "./input-bar";
import BookingSheet from "./booking-sheet";
import CartPreviewSheet from "./cart-preview-sheet";
import poweredByIcon from "../../assets/powered-by-icon.svg?raw";

function hexToRgb(color) {
  if (typeof color !== "string") {
    return null;
  }

  const value = color.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)) {
    return null;
  }

  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value;

  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function colorWithAlpha(color, alphaValue, fallback) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return fallback;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaValue})`;
}

function getContrastText(color) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "#FFFFFF";
  }

  const toChannel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * toChannel(rgb.r) +
    0.7152 * toChannel(rgb.g) +
    0.0722 * toChannel(rgb.b);

  const darkContrast = (luminance + 0.05) / (0.0 + 0.05);
  const lightContrast = (1.0 + 0.05) / (luminance + 0.05);

  return darkContrast >= lightContrast ? "#111827" : "#FFFFFF";
}

export default function ChatWindow({
  widgetConfig,
  isConfigReady,
  messages,
  isLoading,
  isTyping,
  thinkingStatus,
  conversationEnded,
  remainingMessages,
  startNewChat,
  onSend,
  onClose,
  onAddToCart,
  cartPreview,
  onUpdateCartPreviewQty,
  onCloseCartPreview,
  onConfirmCartPreview,
  isCartPreviewSubmitting,
  onShowToast,
  style,
}) {
  const accentColor = widgetConfig.color || "#7E3FF2";
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derive the active overlay artifact — mirrors Playground.jsx:894-910.
  // It's "active" when it's the last non-streaming agent turn and no user
  // message has followed it yet.
  const activeOverlayArtifact = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sender === "user") return null;
      if (
        msg.type === "artifact" &&
        msg.artifact?.kind === "select" &&
        msg.artifact?.placement === "overlay"
      ) {
        return msg.artifact;
      }
    }
    return null;
  }, [messages]);

  const windowStyle = {
    ...(!isFullscreen && !isExpanded ? style : {}),
    "--widget-accent": accentColor,
    "--widget-accent-contrast": getContrastText(accentColor),
    "--widget-accent-soft": colorWithAlpha(
      accentColor,
      0.08,
      "rgba(126, 63, 242, 0.08)",
    ),
    "--widget-accent-border": colorWithAlpha(
      accentColor,
      0.18,
      "rgba(126, 63, 242, 0.18)",
    ),
    "--widget-accent-shadow": colorWithAlpha(
      accentColor,
      0.26,
      "rgba(126, 63, 242, 0.26)",
    ),
  };

  return (
    <div
      className={[
        "chat-window",
        isExpanded && "chat-window--expanded",
        isFullscreen && "chat-window--fullscreen",
      ]
        .filter(Boolean)
        .join(" ")}
      style={windowStyle}
    >
      <ChatHeader
        name={widgetConfig.name}
        icon={widgetConfig.icon}
        color={widgetConfig.color}
        onClose={onClose}
        isConfigReady={isConfigReady}
        isExpanded={isExpanded || isFullscreen}
        isFullscreen={isFullscreen}
        onToggleExpand={() => {
          setIsFullscreen(false);
          setIsExpanded((v) => !v);
        }}
        onToggleFullscreen={() => {
          setIsExpanded(false);
          setIsFullscreen((v) => !v);
        }}
      />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        thinkingStatus={thinkingStatus}
        widgetConfig={widgetConfig}
        onSendMessage={onSend}
        onAddToCart={onAddToCart}
        onShowToast={onShowToast}
      />

      {/* Booking overlay sheet — rendered when an unanswered placement=overlay
          select artifact is the last agent turn. Matches Playground exactly. */}
      {activeOverlayArtifact && !isLoading && (
        <BookingSheet
          artifact={activeOverlayArtifact}
          accentColor={accentColor}
          onSend={onSend}
        />
      )}

      {/* Cart preview sheet — rendered when cartPreview state is set */}
      {cartPreview && (
        <CartPreviewSheet
          preview={cartPreview}
          onClose={onCloseCartPreview}
          onConfirm={onConfirmCartPreview}
          onUpdateQty={onUpdateCartPreviewQty}
          isSubmitting={isCartPreviewSubmitting}
          accentColor={accentColor}
        />
      )}

      <InputBar
        onSend={onSend}
        disabled={isLoading || isTyping || !!conversationEnded}
        color={widgetConfig.color}
      />

      {remainingMessages != null &&
        remainingMessages <= 6 &&
        !conversationEnded && (
          <div className="remaining-messages-hint">
            {remainingMessages} messages remaining
          </div>
        )}

      {conversationEnded && (
        <button
          className="new-chat-btn"
          onClick={startNewChat}
          style={{ backgroundColor: "var(--widget-accent)" }}
        >
          Start New Chat
        </button>
      )}

      <div className="powered-by">
        <div
          className="powered-by-logo"
          dangerouslySetInnerHTML={{ __html: poweredByIcon }}
        />
      </div>
    </div>
  );
}
