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

import ChatHeader from "./chat-header";
import MessageList from "./message-list";
import InputBar from "./input-bar";
import poweredByIcon from "../../assets/powered-by-icon.svg?raw";

export default function ChatWindow({
  widgetConfig,
  isConfigReady,
  messages,
  isLoading,
  isTyping,
  onSend,
  onClose,
  onAddToCart,
  onShowToast,
  style,
}) {
  return (
    <div className="chat-window" style={style}>
      <ChatHeader
        name={widgetConfig.name}
        icon={widgetConfig.icon}
        color={widgetConfig.color}
        onClose={onClose}
        isConfigReady={isConfigReady}
      />

      <MessageList
        messages={messages}
        isLoading={isLoading}
        widgetConfig={widgetConfig}
        onAddToCart={onAddToCart}
        onSendMessage={onSend}
        onShowToast={onShowToast}
      />

      <InputBar
        onSend={onSend}
        disabled={isLoading || isTyping}
        color={widgetConfig.color}
      />

      <div className="powered-by">
        <div
          className="powered-by-logo"
          dangerouslySetInnerHTML={{ __html: poweredByIcon }}
        />
      </div>
    </div>
  );
}
