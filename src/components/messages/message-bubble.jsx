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
import SuggestedReplies from "./suggested-replies";
import FeedbackButtons from "./feedback-buttons";
import ProductCard from "../products/product-card";
import ProductCarousel from "../products/product-carousel";

const CART_ACTION_TYPES = new Set(["cart", "add_to_cart", "add-to-cart"]);

const isCartAction = (actionType) => CART_ACTION_TYPES.has(actionType);

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
      return isCartAction(msg.action_type) ? (
        <ActionMessage
          msg={msg}
          onSendMessage={onSendMessage}
          onShowToast={onShowToast}
        />
      ) : null;

    case "suggestions":
      return <SuggestedReplies items={msg.items} onSend={onSendMessage} />;

    case "feedback_request":
      return (
        <FeedbackButtons
          traceId={msg.traceId}
          aiUrl={msg.aiUrl}
          token={msg.token}
        />
      );

    default:
      return <TextMessage msg={msg} color={widgetConfig.color} />;
  }
}
