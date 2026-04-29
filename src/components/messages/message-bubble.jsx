/**
 * Zanderio WordPress Widget — MessageBubble
 *
 * All AI responses arrive via the `@chat-runtime` selector as typed messages.
 * `normalizeWidgetMessages` in use-chat.js converts every legacy message type
 * (products, product_card, feedback_request) into the new `type: "artifact"`
 * form before this component sees them.
 *
 * Dispatch table:
 *
 *   | msg.type    | Handler                                              |
 *   |-------------|------------------------------------------------------|
 *   | "artifact"  | ArtifactMessage (10-kind + WooCommerce card)         |
 *   | *(default)* | TextMessage (text, streaming, error)                 |
 *
 * The "card" artifact kind uses WooCommerce-aware ProductCarousel / ProductCard
 * so the cart button is visible and functional.  All other artifact kinds share
 * the same inline renderers as the general CDN widget.
 *
 * @param {{ msg, widgetConfig, onAddToCart, onSendMessage, onShowToast, onRetry }} props
 *
 * @module components/messages/message-bubble
 */

import { useState } from "react";
import TextMessage from "./text-message";
import ProductCard from "../products/product-card";
import ProductCarousel from "../products/product-carousel";

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

// ── Card artifact — WooCommerce-aware product display ─────────────────────────
// Items are pre-normalized by use-chat.js's normalizeWidgetMessages so
// ProductCard / ProductCarousel receive the shape they expect.

function CardArtifact({ artifact, onAddToCart }) {
  const { items = [], mode } = artifact.payload;
  if (items.length === 0) return null;

  if (mode === "featured" || items.length === 1) {
    return (
      <div className="single-product-wrapper">
        <ProductCard product={items[0]} isSingle onAddToCart={onAddToCart} />
      </div>
    );
  }

  return <ProductCarousel products={items} onAddToCart={onAddToCart} />;
}

// ── Select artifact (chips / datetime picker) ─────────────────────────────────

function SelectArtifact({ artifact, onSendMessage }) {
  const { options = [], mode, sentinel_prefix = "" } = artifact.payload;
  const [chosen, setChosen] = useState(null);

  if (options.length === 0) return null;

  const handlePick = (option) => {
    if (chosen) return;
    setChosen(option.value);
    const sentinel = sentinel_prefix ? `${sentinel_prefix}${option.value}` : option.label;
    onSendMessage(sentinel);
  };

  if (mode === "datetime") {
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
          {opt.icon && <span className="artifact-select__chip-icon">{opt.icon}</span>}
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
  const { title, summary, actions = [] } = artifact.payload;
  const [done, setDone] = useState(false);

  return (
    <div className="artifact-confirm">
      {title && <p className="artifact-confirm__title">{title}</p>}
      {summary && <p className="artifact-confirm__summary">{summary}</p>}
      {actions.length > 0 && !done && (
        <div className="artifact-confirm__actions">
          {actions.map((action, i) => {
            const handleClick = () => {
              if (action.sentinel_value) {
                setDone(true);
                onSendMessage(action.sentinel_value);
              } else if (action.url) {
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
                  i === 0
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

  return (
    <Tag className={`artifact-list artifact-list--${style}`}>
      {items.map((item, i) => (
        <li key={i} className="artifact-list__item">
          {item.icon && <span className="artifact-list__icon">{item.icon}</span>}
          <span className="artifact-list__label">{item.label}</span>
          {item.value && <span className="artifact-list__value">{item.value}</span>}
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
              <th key={col} className="artifact-table__th">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="artifact-table__tr">
              {row.map((cell, j) => (
                <td key={j} className="artifact-table__td">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Wizard artifact ───────────────────────────────────────────────────────────

function WizardArtifact({ artifact }) {
  const { steps = [], current_step = 0 } = artifact.payload;
  if (steps.length === 0) return null;

  const idx = Math.min(Math.max(current_step, 0), steps.length - 1);
  const step = steps[idx];

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
      {step.content && (
        <p className="artifact-wizard__step-content">{step.content}</p>
      )}
    </div>
  );
}

// ── Text artifact (supplemental inline text) ──────────────────────────────────

function TextArtifact({ artifact }) {
  const { content } = artifact.payload;
  return <p className="artifact-text">{content}</p>;
}

// ── Form artifact ─────────────────────────────────────────────────────────────

function FormArtifact({ artifact, onSendMessage }) {
  const { fields = [], submit_label = "Submit" } = artifact.payload;
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (fields.length === 0 || submitted) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    onSendMessage(
      fields.map((f) => `${f.label}: ${values[f.id] || ""}`).join(", "),
    );
  };

  return (
    <form className="artifact-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.id} className="artifact-form__field">
          <label className="artifact-form__label" htmlFor={`af-${field.id}`}>
            {field.label}
            {field.required && <span className="artifact-form__required"> *</span>}
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
                <option key={opt} value={opt}>{opt}</option>
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

// ── ArtifactMessage dispatcher ────────────────────────────────────────────────

function ArtifactMessage({ artifact, onAddToCart, onSendMessage, aiUrl, token }) {
  switch (artifact.kind) {
    case "card":
      return <CardArtifact artifact={artifact} onAddToCart={onAddToCart} />;

    case "select":
      return <SelectArtifact artifact={artifact} onSendMessage={onSendMessage} />;

    case "confirm":
      return <ConfirmArtifact artifact={artifact} onSendMessage={onSendMessage} />;

    case "notice":
      return <NoticeArtifact artifact={artifact} />;

    case "feedback":
      return <FeedbackArtifact artifact={artifact} aiUrl={aiUrl} token={token} />;

    case "list":
      return <ListArtifact artifact={artifact} />;

    case "table":
      return <TableArtifact artifact={artifact} />;

    case "wizard":
      return <WizardArtifact artifact={artifact} />;

    case "form":
      return <FormArtifact artifact={artifact} onSendMessage={onSendMessage} />;

    case "text":
      return <TextArtifact artifact={artifact} />;

    default:
      return null;
  }
}

// ── Public component ──────────────────────────────────────────────────────────

export default function MessageBubble({
  msg,
  widgetConfig,
  onAddToCart,
  onSendMessage,
  onShowToast,
  onRetry,
}) {
  if (msg.type === "artifact") {
    return (
      <ArtifactMessage
        artifact={msg.artifact}
        onAddToCart={onAddToCart}
        onSendMessage={onSendMessage}
        aiUrl={msg.aiUrl}
        token={msg.token}
      />
    );
  }

  return (
    <TextMessage msg={msg} color={widgetConfig.color} onRetry={onRetry} />
  );
}
