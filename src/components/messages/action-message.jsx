/**
 * Zanderio Widget - ActionMessage
 *
 * Renders interactive action-type messages returned by the AI backend.
 *
 * Action types:
 *   cart      - Shopify cart add or fallback link
 *   book      - Opens booking URL in new tab
 *   call      - Phone tel: link
 *   email     - Email mailto: link
 *   whatsapp  - Opens WhatsApp chat URL
 *   form      - Opens form / contact page URL
 *   pay       - Opens payment link
 *   review    - Opens review page
 *   map       - Opens directions / location
 *   social    - Opens social profile
 *   link      - Opens any URL in new tab
 *
 * Legacy action types (still supported for backward compat):
 *   add-to-cart, add_to_cart, view-product, book-appointment, contact-us,
 *   browse-category, visit-link, calendly, lead_form, contact, phone
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
  IoLogoWhatsapp,
  IoDocumentTextOutline,
  IoCardOutline,
  IoStarOutline,
  IoLocationOutline,
  IoShareSocialOutline,
} from "react-icons/io5";
import LeadForm from "./lead-form";

const ICON_SIZE = 14;
const ICON_STYLE = { marginRight: "6px" };

function OpenButton({ url, label, icon, onSendMessage }) {
  if (url) {
    return (
      <button
        className="action-button"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        {icon}
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

function LinkButton({ url, label, icon, onSendMessage }) {
  if (url) {
    return (
      <a className="action-button action-button--link" href={url}>
        {icon}
        {label}
      </a>
    );
  }
  return (
    <button className="action-button" onClick={() => onSendMessage(label)}>
      {label}
    </button>
  );
}

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
      <OpenButton
        url={url}
        label={label}
        icon={<IoCalendarOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "call" || action_type === "phone") {
    return (
      <LinkButton
        url={url}
        label={label}
        icon={<IoCallOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "email") {
    return (
      <LinkButton
        url={url || (email ? `mailto:${email}` : null)}
        label={label}
        icon={<IoMailOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "whatsapp") {
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoLogoWhatsapp size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "form" || action_type === "lead_form") {
    if (action_type === "lead_form" || (!url && action_type === "form")) {
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
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoDocumentTextOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "pay") {
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoCardOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "review") {
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoStarOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "map") {
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoLocationOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "social") {
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoShareSocialOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (action_type === "contact" || action_type === "contact-us") {
    if (url && url.startsWith("tel:")) {
      return (
        <LinkButton
          url={url}
          label={label}
          icon={<IoCallOutline size={ICON_SIZE} style={ICON_STYLE} />}
          onSendMessage={onSendMessage}
        />
      );
    }
    if (url && url.startsWith("mailto:")) {
      return (
        <LinkButton
          url={url}
          label={label}
          icon={<IoMailOutline size={ICON_SIZE} style={ICON_STYLE} />}
          onSendMessage={onSendMessage}
        />
      );
    }
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoMailOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  if (
    action_type === "link" ||
    action_type === "visit-link" ||
    action_type === "view-product" ||
    action_type === "browse-category"
  ) {
    return (
      <OpenButton
        url={url}
        label={label}
        icon={<IoOpenOutline size={ICON_SIZE} style={ICON_STYLE} />}
        onSendMessage={onSendMessage}
      />
    );
  }

  // Fallback
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
