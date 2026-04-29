/**
 * Zanderio Widget — Root Component
 *
 * Thin composition layer that wires every hook together and renders the
 * ChatWidget shell.  This file contains zero business logic — all state
 * management lives in the hooks, all presentation in the components.
 *
 * Hook wiring
 * -----------
 *   useResponsive   → isMobile
 *   useSocket       → socket, storeId, visitorId, sessionId, remoteConfig
 *   useWidgetConfig → widgetConfig  (merges local + remote)
 *   useChat         → messages, sendMessage, isLoading, isTyping
 *   useCart         → cart preview state + toast-backed cart mutation
 *
 * The welcome message is synced into the message list via a `useEffect`
 * that fires when `widgetConfig.welcomeMessage` or `remoteConfig` changes.
 *
 * @param {{ settings: object }} props — resolved config from `resolveConfig()`
 *
 * @module App
 */

import { useEffect } from "react";
import { useSocket } from "./hooks/use-socket";
import { useChat } from "./hooks/use-chat";
import { useWidgetConfig } from "./hooks/use-widget-config";
import { useCart } from "./hooks/use-cart";
import { useResponsive } from "./hooks/use-responsive";
import ChatWidget from "./components/chat-widget/chat-widget";

export default function App({ settings }) {
  const { isMobile } = useResponsive();
  const { socket, storeId, visitorId, sessionId, remoteConfig, token } =
    useSocket(settings);
  const { widgetConfig, isConfigReady } = useWidgetConfig(
    settings,
    remoteConfig,
  );
  const {
    messages,
    sendMessage,
    isLoading,
    isTyping,
    thinkingStatus,
    conversationEnded,
    remainingMessages,
    startNewChat,
    updateWelcomeMessage,
  } = useChat(storeId, visitorId, sessionId, settings, { socket, token });
  const {
    requestAddToCart,
    cartPreview,
    updateCartPreviewQuantity,
    closeCartPreview,
    confirmCartPreview,
    isCartPreviewSubmitting,
    toast,
    showToast,
  } = useCart(settings, remoteConfig);

  useEffect(() => {
    if (widgetConfig.welcomeMessage) {
      updateWelcomeMessage(widgetConfig.welcomeMessage);
    }
  }, [widgetConfig.welcomeMessage, updateWelcomeMessage]);

  return (
    <ChatWidget
      widgetConfig={widgetConfig}
      isConfigReady={isConfigReady}
      messages={messages}
      sendMessage={sendMessage}
      isLoading={isLoading}
      isTyping={isTyping}
      thinkingStatus={thinkingStatus}
      conversationEnded={conversationEnded}
      remainingMessages={remainingMessages}
      startNewChat={startNewChat}
      isMobile={isMobile}
      onAddToCart={requestAddToCart}
      cartPreview={cartPreview}
      onUpdateCartPreviewQty={updateCartPreviewQuantity}
      onCloseCartPreview={closeCartPreview}
      onConfirmCartPreview={confirmCartPreview}
      isCartPreviewSubmitting={isCartPreviewSubmitting}
      toast={toast}
      onShowToast={showToast}
    />
  );
}
