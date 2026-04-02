/**
 * Zanderio Widget — ChatWidget (Shell)
 *
 * Top-level presentational component that owns the open/close toggle
 * state and positions everything based on the active widget config.
 *
 * Renders three children:
 *   1. `ChatWindow` — the conversation panel (visible when open).
 *   2. `ToggleButton` — the floating action button.
 *   3. `Toast` — transient cart confirmation.
 *
 * Position is resolved per-render from `widgetConfig.desktopPosition`
 * or `widgetConfig.mobilePosition` (selected by `isMobile`) and
 * translated into CSS via `getPositionStyle()` / `getChatWindowStyle()`.
 *
 * @param {{ widgetConfig, messages, sendMessage, isLoading, isTyping,
 *           isMobile, onAddToCart, toast, onShowToast }} props
 *
 * @module components/chat-widget/chat-widget
 */

import { useState } from "react";
import { getPositionStyle, getChatWindowStyle } from "../../utils/position";
import { useProactiveEngagement } from "../../hooks/use-proactive-engagement";
import ChatWindow from "./chat-window";
import ToggleButton from "./toggle-button";
import ProactiveBubble from "./proactive-bubble";
import Toast from "../toast/toast";

export default function ChatWidget({
  widgetConfig,
  isConfigReady,
  messages,
  sendMessage,
  isLoading,
  isTyping,
  thinkingStatus,
  conversationEnded,
  startNewChat,
  isMobile,
  onAddToCart,
  toast,
  onShowToast,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { bubbleMessage, dismissBubble } = useProactiveEngagement(
    widgetConfig.proactive,
    isOpen,
  );

  const currentPosition = isMobile
    ? widgetConfig.mobilePosition || "bottom-center"
    : widgetConfig.desktopPosition || "bottom-right";

  const wrapperStyle = getPositionStyle(currentPosition);
  const windowStyle = getChatWindowStyle(currentPosition);

  return (
    <div className="chat-widget-wrapper" style={wrapperStyle}>
      {isOpen && (
        <ChatWindow
          widgetConfig={widgetConfig}
          isConfigReady={isConfigReady}
          messages={messages}
          isLoading={isLoading}
          isTyping={isTyping}
          thinkingStatus={thinkingStatus}
          conversationEnded={conversationEnded}
          startNewChat={startNewChat}
          onSend={sendMessage}
          onClose={() => setIsOpen(false)}
          onAddToCart={onAddToCart}
          onShowToast={onShowToast}
          style={windowStyle}
        />
      )}

      {!isOpen && bubbleMessage && (
        <ProactiveBubble
          message={bubbleMessage}
          onDismiss={dismissBubble}
          color={widgetConfig.color}
        />
      )}

      <ToggleButton
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        color={isConfigReady ? widgetConfig.color : "transparent"}
        iconUrl={widgetConfig.icon}
        isLoading={!isConfigReady}
      />

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}
