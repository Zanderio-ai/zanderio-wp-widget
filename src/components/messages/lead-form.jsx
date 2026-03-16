/**
 * Zanderio Widget — LeadForm
 *
 * Inline lead-capture form rendered as a bot message.  Collects name,
 * email, and an optional message.  On submission the component:
 *
 *   1. Calls `onSubmit({ name, email, message, ...metadata })`.
 *   2. Swaps itself out for a green “Thanks!” confirmation.
 *
 * The `metadata` prop is merged into the submitted payload so the
 * backend receives contextual data (e.g. which product or conversation
 * triggered the lead form).
 *
 * @param {{ label?: string, metadata?: object, onSubmit: Function }} props
 *
 * @module components/messages/lead-form
 */

import { useState } from "react";

export default function LeadForm({ label, metadata = {}, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (onSubmit) onSubmit({ ...formData, ...metadata });
  };

  if (submitted) {
    return (
      <div className="lead-form-success">
        ✅ Thanks! We&apos;ll be in touch soon.
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      {label && <p className="lead-form-title">{label}</p>}
      <input
        type="text"
        placeholder="Your name"
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        required
        className="lead-form-input"
      />
      <input
        type="email"
        placeholder="Your email"
        value={formData.email}
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
        required
        className="lead-form-input"
      />
      <textarea
        placeholder="Your message (optional)"
        value={formData.message}
        onChange={(e) =>
          setFormData((p) => ({ ...p, message: e.target.value }))
        }
        rows={3}
        className="lead-form-textarea"
      />
      <button type="submit" className="lead-form-submit">
        Submit
      </button>
    </form>
  );
}
