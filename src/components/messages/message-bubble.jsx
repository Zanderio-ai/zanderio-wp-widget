/**
 * Zanderio Widget — MessageBubble
 *
 * Routing component that inspects `msg.type` and delegates to the
 * correct specialised renderer:
 *
 *   | msg.type       | Component        |
 *   |----------------|------------------|
 *   | product_card   | ProductCard      |
 *   | products       | ProductCarousel  |
 *   | action         | ActionMessage    |
 *   | *(default)*    | TextMessage      |
 *
 * This keeps the MessageList agnostic of message types — it just maps
 * over the array and renders a MessageBubble for each entry.
 *
 * @param {{ msg, widgetConfig, onAddToCart, onSendMessage, onShowToast }} props
 *
 * @module components/messages/message-bubble
 */

import TextMessage from "./text-message";
import ActionMessage from "./action-message";
import ProductCard from "../products/product-card";
import ProductCarousel from "../products/product-carousel";

export default function MessageBubble({
  msg,
  widgetConfig,
  onAddToCart,
  onSendMessage,
  onShowToast,
}) {
  switch (msg.type) {
    case "product_card":
      return (
        <div className="single-product-wrapper">
          <ProductCard
            product={msg.product}
            isSingle
            onAddToCart={onAddToCart}
          />
        </div>
      );

    case "products":
      return <ProductCarousel products={msg.items} onAddToCart={onAddToCart} />;

    case "action":
      return (
        <ActionMessage
          msg={msg}
          onSendMessage={onSendMessage}
          onShowToast={onShowToast}
        />
      );

    default:
      return <TextMessage msg={msg} color={widgetConfig.color} />;
  }
}
