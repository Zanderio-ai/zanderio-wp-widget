/**
 * Zanderio Widget - ActionMessage
 *
 * Renders interactive action-type messages returned by the AI backend.
 *
 * Current action types:
 *   cart     - Shopify cart add or fallback link
 *   link     - Opens any URL in new tab
 *   book     - Opens booking URL in new tab
 *   contact  - Email mailto or phone tel link
 *
 * Legacy action types (still supported for backward compat):
 *   add-to-cart, view-product, book-appointment, contact-us,
 *   browse-category, visit-link, calendly, lead_form,
 *   add_to_cart, email, phone
 *
 * @param {{ msg, onSendMessage, onShowToast }} props
 * @module components/messages/action-message
 */

import {
  IoCart,
  IoOpenOutline,
  IoCallOutline,
  IoMailOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import LeadForm from "./lead-form";

export default function ActionMessage({ msg, onSendMessage, onShowToast }) {
  const { action_type, label, url, email, product_id, metadata = {} } = msg;

  if (
    action_type === "cart" ||
    action_type === "add-to-cart" ||
    action_type === "add_to_cart"
  ) {
    return (
      <button
        className="action-button"
        onClick={() => {
          const variantId = metadata.variant_id || product_id;

          if (window.Shopify?.routes && variantId) {
            fetch(`${window.Shopify.routes.root}cart/add.js`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: variantId, quantity: 1 }),
            })
              .then(() => onShowToast?.(`${label} - added to cart!`))
              .catch(() => onSendMessage(label));
          } else if (url) {
            const separator = url.includes("?") ? "&" : "?";
            const cartUrl = variantId
              ? `${url}${separator}add-to-cart=${variantId}`
              : url;
            window.open(cartUrl, "_blank", "noopener,noreferrer");
          } else {
            onSendMessage(label);
          }
        }}
      >
        <IoCart size={14} style={{ marginRight: "6px" }} />
        {label}
      </button>
    );
  }

  if (
    action_type === "book" ||
    action_type === "book-appointment" ||
    action_type === "calendly"
  ) {
    return (
      <button
        className="action-button"
        onClick={() => {
          if (url) window.open(url, "_blank", "noopener,noreferrer");
          else onSendMessage(label);
        }}
      >
        <IoCalendarOutline size={14} style={{ marginRight: "6px" }} />
        {label}
      </button>
    );
  }

  if (action_type === "contact" || action_type === "contact-us") {
    if (url && url.startsWith("tel:")) {
      return (
        <a className="action-button action-button--link" href={url}>
          <IoCallOutline size={14} style={{ marginRight: "6px" }} />
          {label}
        </a>
      );
    }

    if (url && url.startsWith("mailto:")) {
      return (
        <a className="action-button action-button--link" href={url}>
          <IoMailOutline size={14} style={{ marginRight: "6px" }} />
          {label}
        </a>
      );
    }

    if (url) {
      return (
        <button
          className="action-button"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          {label}
        </button>
      );
    }

    return (
      <button className="action-button" onClick={() => onSendMessage(label)}>
        {label}
      </button>
    );
  }

  if (
    action_type === "link" ||
    action_type === "visit-link" ||
    action_type === "view-product" ||
    action_type === "browse-category"
  ) {
    if (url) {
      return (
        <button
          className="action-button"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <IoOpenOutline size={14} style={{ marginRight: "6px" }} />
          {label}
        </button>
      );
    }
    return (
      <button className="action-button" onClick={() => onSendMessage(label)}>
        {label}
      </button>
    );
  }

  if (action_type === "lead_form") {
    return (
      <LeadForm
        label={label}
        metadata={metadata}
        onSubmit={(data) => {
          onSendMessage(
            `Quote request submitted: ${data.name} <${data.email}>${data.message ? " - " + data.message : ""}`,
          );
        }}
      />
    );
  }

  if (action_type === "email") {
    return (
      <a
        className="action-button action-button--link"
        href={url || `mailto:${email}`}
      >
        <IoMailOutline size={14} style={{ marginRight: "6px" }} />
        {label}
      </a>
    );
  }

  if (action_type === "phone") {
    return (
      <a className="action-button action-button--link" href={url}>
        <IoCallOutline size={14} style={{ marginRight: "6px" }} />
        {label}
      </a>
    );
  }

  return (
    <button
      className="action-button"
      onClick={() =>
        url
          ? window.open(url, "_blank", "noopener,noreferrer")
          : onSendMessage(label)
      }
    >
      {label}
    </button>
  );
}
