/**
 * Zanderio Widget — MessageBubble
 *
 * Routes each message to the correct renderer based on `msg.type`:
 *
 *   | msg.type        | Renderer                          |
 *   |-----------------|-----------------------------------|
 *   | "artifact"      | ArtifactMessage (kind-specific)   |
 *   | "feedback_request" | FeedbackArtifact              |
 *   | "products"      | ProductCarouselLegacy (history)   |
 *   | "product_card"  | ProductCardLegacy (history)       |
 *   | "action"        | (hidden — legacy, not rendered)   |
 *   | *(default)*     | TextMessage                       |
 *
 * New 10-kind artifacts arrive with `msg.type === "artifact"` and are
 * dispatched to inline renderers inside `ArtifactMessage`.
 *
 * @param {{ msg, widgetConfig, onSendMessage, onShowToast, onRetry }} props
 *
 * @module components/messages/message-bubble
 */

import { useState } from "react";
import TextMessage from "./text-message";

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeExternalUrl(url) {
  const value = url?.trim();
  if (!value) return null;
  if (/^(https?:|mailto:|tel:|sms:|whatsapp:)/i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(value)) return `https://${value}`;
  return value;
}

function openUrl(url) {
  const href = normalizeExternalUrl(url);
  if (!href) return;
  const w = window.open(href, "_blank", "noopener,noreferrer");
  if (!w) window.location.assign(href);
}

// ── Product card (used by "card" artifact + legacy history messages) ──────────

function ProductCardItem({ item, compact = false, onAddToCart }) {
  const price =
    item.price != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: item.currency || "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(item.price)
      : null;

  const comparePrice =
    item.compare_at_price != null && item.compare_at_price > item.price
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: item.currency || "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(item.compare_at_price)
      : null;

  const hasDiscount = comparePrice != null;

  return (
    <div
      className={`artifact-product-card${compact ? " artifact-product-card--compact" : ""}`}
    >
      {item.image && (
        <div className="artifact-product-card__image-wrap">
          <img
            src={item.image}
            alt={item.title}
            className="artifact-product-card__image"
            loading="lazy"
          />
          {!item.in_stock && (
            <span className="artifact-product-card__badge artifact-product-card__badge--oos">
              Out of stock
            </span>
          )}
          {hasDiscount && item.in_stock && (
            <span className="artifact-product-card__badge artifact-product-card__badge--sale">
              Sale
            </span>
          )}
        </div>
      )}
      <div className="artifact-product-card__body">
        {item.brand && (
          <p className="artifact-product-card__brand">{item.brand}</p>
        )}
        <p className="artifact-product-card__title">{item.title}</p>
        {price && (
          <p className="artifact-product-card__price">
            <span
              className={
                hasDiscount ? "artifact-product-card__price--sale" : ""
              }
            >
              {price}
            </span>
            {comparePrice && (
              <span className="artifact-product-card__price--compare">
                {comparePrice}
              </span>
            )}
          </p>
        )}
        {item.variant_summary && (
          <p className="artifact-product-card__variant">
            {item.variant_summary}
          </p>
        )}
        {(item.url || onAddToCart) && (
          <div className="artifact-product-card__footer">
            {item.url && (
              <button
                type="button"
                className="artifact-product-card__cta"
                onClick={() => openUrl(item.url)}
              >
                View product
              </button>
            )}
            {onAddToCart && (
              <button
                type="button"
                className="artifact-product-card__cart-btn"
                disabled={!item.in_stock}
                title={item.in_stock === false ? "Out of stock" : "Add to cart"}
                onClick={() => onAddToCart(item)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card artifact (product carousel / featured) ───────────────────────────────

function CardArtifact({ artifact, onAddToCart }) {
  const { items = [], mode } = artifact.payload;
  const [offset, setOffset] = useState(0);
  const PAGE = 2;
  const total = items.length;
  const canPrev = offset > 0;
  const canNext = offset + PAGE < total;

  if (total === 0) return null;

  if (mode === "featured" || total === 1) {
    return (
      <div className="artifact-card artifact-card--featured">
        <ProductCardItem item={items[0]} onAddToCart={onAddToCart} />
      </div>
    );
  }

  return (
    <div className="artifact-card artifact-card--carousel">
      <div className="artifact-card__toolbar">
        <span className="artifact-card__count">{total} products</span>
        <div className="artifact-card__controls">
          <button
            type="button"
            className="artifact-card__nav"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE))}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            className="artifact-card__nav"
            disabled={!canNext}
            onClick={() => setOffset((o) => Math.min(total - 1, o + PAGE))}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
      <div className="artifact-card__viewport">
        {items.slice(offset, offset + PAGE + 1).map((item) => (
          <ProductCardItem
            key={item.id}
            item={item}
            compact
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

// ── Select artifact (chips / datetime picker) ─────────────────────────────────

function SelectArtifact({ artifact, onSendMessage }) {
  const { options = [], mode, sentinel_prefix = "" } = artifact.payload;
  const [chosen, setChosen] = useState(null);

  if (options.length === 0) return null;

  const handlePick = (option) => {
    if (chosen) return; // already picked
    setChosen(option.value);
    const sentinel = sentinel_prefix
      ? `${sentinel_prefix}${option.value}`
      : option.label;
    onSendMessage(sentinel);
  };

  if (mode === "datetime") {
    // Datetime slot picker — grouped by date prefix if present
    return (
      <div className="artifact-select artifact-select--datetime">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={[
              "artifact-select__slot",
              chosen === opt.value && "artifact-select__slot--chosen",
              opt.available === false && "artifact-select__slot--unavailable",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={chosen !== null || opt.available === false}
            onClick={() => handlePick(opt)}
          >
            <span className="artifact-select__slot-label">{opt.label}</span>
            {opt.subtitle && (
              <span className="artifact-select__slot-sub">{opt.subtitle}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default: chips (event types, categories, quick replies)
  return (
    <div className="artifact-select artifact-select--chips">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[
            "artifact-select__chip",
            chosen === opt.value && "artifact-select__chip--chosen",
            opt.available === false && "artifact-select__chip--unavailable",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={chosen !== null || opt.available === false}
          onClick={() => handlePick(opt)}
        >
          {opt.icon && (
            <span className="artifact-select__chip-icon">{opt.icon}</span>
          )}
          <span>{opt.label}</span>
          {opt.subtitle && (
            <span className="artifact-select__chip-sub">{opt.subtitle}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Confirm artifact (booking summary, generic confirmation) ──────────────────

function ConfirmArtifact({ artifact, onSendMessage }) {
  const {
    title,
    description,
    summary_fields,
    primary_action,
    secondary_action,
  } = artifact.payload;
  const actions = [primary_action, secondary_action].filter(Boolean);
  const [done, setDone] = useState(false);

  return (
    <div className="artifact-confirm">
      {title && <p className="artifact-confirm__title">{title}</p>}
      {description && (
        <p className="artifact-confirm__summary">{description}</p>
      )}
      {summary_fields && summary_fields.length > 0 && (
        <dl className="artifact-confirm__fields">
          {summary_fields.map((f) => (
            <div key={f.label} className="artifact-confirm__field-row">
              <dt className="artifact-confirm__field-label">{f.label}</dt>
              <dd className="artifact-confirm__field-value">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions.length > 0 && !done && (
        <div className="artifact-confirm__actions">
          {actions.map((action, i) => {
            const isPrimary = i === 0;
            const handleClick = () => {
              if (action.url) {
                openUrl(action.url);
              } else {
                setDone(true);
                onSendMessage(action.label);
              }
            };
            return (
              <button
                key={`${action.label}-${i}`}
                type="button"
                className={[
                  "artifact-confirm__btn",
                  isPrimary
                    ? "artifact-confirm__btn--primary"
                    : "artifact-confirm__btn--secondary",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={handleClick}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Notice artifact ───────────────────────────────────────────────────────────

function NoticeArtifact({ artifact }) {
  const { level = "info", title, message } = artifact.payload;
  return (
    <div className={`artifact-notice artifact-notice--${level}`}>
      {title && <p className="artifact-notice__title">{title}</p>}
      <p className="artifact-notice__message">{message}</p>
    </div>
  );
}

// ── Feedback artifact ─────────────────────────────────────────────────────────

function FeedbackArtifact({ artifact, aiUrl, token }) {
  const { trace_id } = artifact.payload;
  const [selected, setSelected] = useState(null);

  if (!trace_id) return null;

  const send = async (score) => {
    const key = score === 1 ? "up" : "down";
    if (selected === key) return;
    setSelected(key);
    try {
      await fetch(`${aiUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ trace_id, score }),
      });
    } catch {
      // best-effort
    }
  };

  return (
    <div className="feedback-buttons">
      <button
        className={`feedback-btn${selected === "up" ? " feedback-btn--active" : ""}`}
        onClick={() => send(1)}
        aria-label="Helpful"
        title="Helpful"
      >
        👍
      </button>
      <button
        className={`feedback-btn${selected === "down" ? " feedback-btn--active" : ""}`}
        onClick={() => send(0)}
        aria-label="Not helpful"
        title="Not helpful"
      >
        👎
      </button>
    </div>
  );
}

// ── List artifact ─────────────────────────────────────────────────────────────

function ListArtifact({ artifact }) {
  const { items = [], style = "bullets" } = artifact.payload;
  if (items.length === 0) return null;

  const Tag = style === "numbered" ? "ol" : "ul";
  const className = `artifact-list artifact-list--${style}`;

  return (
    <Tag className={className}>
      {items.map((item, i) => (
        <li key={i} className="artifact-list__item">
          {item.icon && (
            <span className="artifact-list__icon">{item.icon}</span>
          )}
          <span className="artifact-list__label">{item.label}</span>
          {item.value && (
            <span className="artifact-list__value">{item.value}</span>
          )}
        </li>
      ))}
    </Tag>
  );
}

// ── Table artifact ────────────────────────────────────────────────────────────

function TableArtifact({ artifact }) {
  const { columns = [], rows = [] } = artifact.payload;
  if (columns.length === 0) return null;

  return (
    <div className="artifact-table-wrap">
      <table className="artifact-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className="artifact-table__th">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="artifact-table__tr">
              {row.map((cell, j) => (
                <td key={j} className="artifact-table__td">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Wizard artifact ───────────────────────────────────────────────────────────

function WizardArtifact({ artifact, onSendMessage }) {
  const { steps = [], current_step = 0, domain } = artifact.payload;

  // Add form state for booking domain wizards (must be before any conditional return)
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (steps.length === 0) return null;

  const idx = Math.min(Math.max(current_step, 0), steps.length - 1);
  const step = steps[idx];
  const fields = step.fields || [];
  const isBookingWizard = domain === "booking";

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (isBookingWizard) {
      // Build JSON payload with field values keyed by field ID
      const answers = {};
      fields.forEach((f) => {
        answers[f.key] = values[f.key] || "";
      });
      // Send proper sentinel format for booking
      const payload = JSON.stringify(answers);
      const timezone = artifact.payload.timezone || "UTC";
      onSendMessage(`__booking_answers__${payload}|timezone=${timezone}`);
    }
  };

  return (
    <div className="artifact-wizard">
      <div className="artifact-wizard__progress">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={[
              "artifact-wizard__dot",
              i < idx && "artifact-wizard__dot--done",
              i === idx && "artifact-wizard__dot--active",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={s.title}
          />
        ))}
      </div>
      <p className="artifact-wizard__step-title">{step.title}</p>
      {step.description && (
        <p className="artifact-wizard__step-content">{step.description}</p>
      )}

      {/* Render form fields if present and not yet submitted */}
      {fields.length > 0 && !submitted && isBookingWizard && (
        <form className="artifact-form" onSubmit={handleFieldSubmit}>
          {fields.map((field) => (
            <div key={field.key} className="artifact-form__field">
              <label
                className="artifact-form__label"
                htmlFor={`awf-${field.key}`}
              >
                {field.label}
                {field.required && (
                  <span className="artifact-form__required"> *</span>
                )}
              </label>
              <input
                id={`awf-${field.key}`}
                type={field.type || "text"}
                className="artifact-form__input"
                placeholder={field.placeholder || ""}
                required={field.required}
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
              />
            </div>
          ))}
          <button type="submit" className="artifact-form__submit">
            {artifact.payload.submit_label || "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Text artifact (supplemental inline text) ──────────────────────────────────

function TextArtifact({ artifact }) {
  const { content } = artifact.payload;
  return <p className="artifact-text">{content}</p>;
}

// ── Form artifact (basic field list — no submission logic in widget) ───────────

function FormArtifact({ artifact, onSendMessage }) {
  const { fields = [], submit_label = "Submit" } = artifact.payload;
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (fields.length === 0 || submitted) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const summary = fields
      .map((f) => `${f.label}: ${values[f.id] || ""}`)
      .join(", ");
    onSendMessage(summary);
  };

  return (
    <form className="artifact-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.id} className="artifact-form__field">
          <label className="artifact-form__label" htmlFor={`af-${field.id}`}>
            {field.label}
            {field.required && (
              <span className="artifact-form__required"> *</span>
            )}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={`af-${field.id}`}
              className="artifact-form__input artifact-form__input--textarea"
              placeholder={field.placeholder || ""}
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.id]: e.target.value }))
              }
            />
          ) : field.type === "select" ? (
            <select
              id={`af-${field.id}`}
              className="artifact-form__input artifact-form__input--select"
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.id]: e.target.value }))
              }
            >
              <option value="">Select…</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`af-${field.id}`}
              type={field.type || "text"}
              className="artifact-form__input"
              placeholder={field.placeholder || ""}
              required={field.required}
              value={values[field.id] || ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.id]: e.target.value }))
              }
            />
          )}
        </div>
      ))}
      <button type="submit" className="artifact-form__submit">
        {submit_label}
      </button>
    </form>
  );
}

// ── Legacy feedback_request (from old feedback_prompt artifact) ────────────────

function LegacyFeedbackRequest({ msg }) {
  const [selected, setSelected] = useState(null);

  if (!msg.traceId) return null;

  const send = async (score) => {
    const key = score === 1 ? "up" : "down";
    if (selected === key) return;
    setSelected(key);
    try {
      await fetch(`${msg.aiUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(msg.token ? { Authorization: `Bearer ${msg.token}` } : {}),
        },
        body: JSON.stringify({ trace_id: msg.traceId, score }),
      });
    } catch {
      // best-effort
    }
  };

  return (
    <div className="feedback-buttons">
      <button
        className={`feedback-btn${selected === "up" ? " feedback-btn--active" : ""}`}
        onClick={() => send(1)}
        aria-label="Helpful"
        title="Helpful"
      >
        👍
      </button>
      <button
        className={`feedback-btn${selected === "down" ? " feedback-btn--active" : ""}`}
        onClick={() => send(0)}
        aria-label="Not helpful"
        title="Not helpful"
      >
        👎
      </button>
    </div>
  );
}

// ── ArtifactMessage dispatcher ────────────────────────────────────────────────

function ArtifactMessage({
  artifact,
  onSendMessage,
  aiUrl,
  token,
  onAddToCart,
}) {
  switch (artifact.kind) {
    case "card":
      return <CardArtifact artifact={artifact} onAddToCart={onAddToCart} />;

    case "select":
      // Overlay selects are rendered as a bottom sheet by ChatWindow.
      // Suppress inline rendering entirely while they are active;
      // for historical items (a user response already followed) render
      // a compact "offered N slots" label — same as Playground:1367-1409.
      if (artifact.placement === "overlay") {
        const { mode, options = [] } = artifact.payload;
        if (mode === "datetime") {
          return (
            <p className="booking-history-label">
              Offered {options.length} time slot
              {options.length !== 1 ? "s" : ""}
            </p>
          );
        }
        return (
          <ul className="booking-history-options">
            {options.map((opt) => (
              <li key={opt.value} className="booking-history-options__item">
                {opt.label}
                {opt.subtitle ? ` · ${opt.subtitle}` : ""}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <SelectArtifact artifact={artifact} onSendMessage={onSendMessage} />
      );

    case "confirm":
      return (
        <ConfirmArtifact artifact={artifact} onSendMessage={onSendMessage} />
      );

    case "notice":
      return <NoticeArtifact artifact={artifact} />;

    case "feedback":
      return (
        <FeedbackArtifact artifact={artifact} aiUrl={aiUrl} token={token} />
      );

    case "list":
      return <ListArtifact artifact={artifact} />;

    case "table":
      return <TableArtifact artifact={artifact} />;

    case "wizard":
      return (
        <WizardArtifact artifact={artifact} onSendMessage={onSendMessage} />
      );

    case "form":
      return <FormArtifact artifact={artifact} onSendMessage={onSendMessage} />;

    case "text":
      return <TextArtifact artifact={artifact} />;

    default:
      return null;
  }
}

// ── Legacy history renderers (product_list / product_card from hydration) ──────

function LegacyProductCard({ product }) {
  if (!product) return null;
  return (
    <div className="single-product-wrapper">
      <ProductCardItem item={product} />
    </div>
  );
}

function LegacyProductCarousel({ items = [] }) {
  const [offset, setOffset] = useState(0);
  const PAGE = 2;
  const total = items.length;
  if (total === 0) return null;
  return (
    <div className="artifact-card artifact-card--carousel">
      <div className="artifact-card__toolbar">
        <span className="artifact-card__count">{total} products</span>
        <div className="artifact-card__controls">
          <button
            type="button"
            className="artifact-card__nav"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE))}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            className="artifact-card__nav"
            disabled={offset + PAGE >= total}
            onClick={() => setOffset((o) => Math.min(total - 1, o + PAGE))}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
      <div className="artifact-card__viewport">
        {items.slice(offset, offset + PAGE + 1).map((item) => (
          <ProductCardItem key={item.id} item={item} compact />
        ))}
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export default function MessageBubble({
  msg,
  widgetConfig,
  onSendMessage,
  // onShowToast,
  onRetry,
  onAddToCart,
}) {
  // New 10-kind artifact taxonomy
  if (msg.type === "artifact") {
    return (
      <ArtifactMessage
        artifact={msg.artifact}
        onSendMessage={onSendMessage}
        aiUrl={msg.aiUrl}
        token={msg.token}
        onAddToCart={onAddToCart}
      />
    );
  }

  // Legacy feedback_request (from old feedback_prompt synthetic artifact)
  if (msg.type === "feedback_request") {
    return <LegacyFeedbackRequest msg={msg} />;
  }

  // Legacy product_card / products (from hydrated conversation history)
  if (msg.type === "product_card") {
    return <LegacyProductCard product={msg.product} />;
  }

  if (msg.type === "products") {
    return <LegacyProductCarousel items={msg.items || []} />;
  }

  // Legacy "action" type — no longer rendered (was handled by ChatWindow's
  // cart preview sheet; cart is now a "confirm" artifact with domain=cart)
  if (msg.type === "action") {
    return null;
  }

  // Default: text / streaming / error message
  return <TextMessage msg={msg} color={widgetConfig.color} onRetry={onRetry} />;
}
