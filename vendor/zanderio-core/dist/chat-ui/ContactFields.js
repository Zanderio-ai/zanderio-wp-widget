import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/ContactFields
 * @description The labelled text inputs of the contact-style interrupt cards.
 *
 * Shared by `CrmCollectCard` and `MarketingConsentCard`, so both ask for an
 * address the same way: one input per field, a required mark, and the email
 * hint from `chat/contact-form` once the visitor leaves the field.
 */
import { useId, useState } from "react";
import { css } from "@emotion/react";
import { fieldGroup, fieldLabel, input } from "./form.js";
import { contactFieldError } from "../chat/contact-form.js";
function inputTypeFor(field) {
    if (field.type === "email")
        return "email";
    if (field.type === "phone")
        return "tel";
    return "text";
}
const requiredMark = css `
  margin-left: 2px;
  opacity: 0.7;
`;
const errorText = css `
  display: block;
  font-size: 12px;
  /* Darker than tokens.color.error: small text needs 4.5:1 contrast on white. */
  color: #b91c1c;
  margin-top: 4px;
`;
const requiredNote = css `
  display: block;
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
`;
export function ContactFields({ fields, values, onChange }) {
    // Validation hints wait until the visitor leaves a field, so they aren't
    // told off for an email they're still typing.
    const [touched, setTouched] = useState({});
    // Unique per card: the playground can show past forms from the history, and
    // two cards on a page must not share input ids.
    const idPrefix = useId();
    const hasRequired = fields.some((field) => field.required);
    return (_jsxs("div", { css: fieldGroup, children: [fields.map((field) => {
                const inputId = `${idPrefix}-field-${field.id}`;
                const error = touched[field.id] ? contactFieldError(field, values[field.id]) : null;
                return (_jsxs("div", { children: [_jsxs("label", { css: fieldLabel, htmlFor: inputId, children: [field.label, field.required && (_jsx("span", { css: requiredMark, "aria-hidden": "true", children: "*" }))] }), _jsx("input", { id: inputId, css: input, type: inputTypeFor(field), required: field.required, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${inputId}-error` : undefined, value: values[field.id] ?? "", onChange: (e) => onChange(field.id, e.target.value), onBlur: () => setTouched((t) => ({ ...t, [field.id]: true })) }), error && (_jsx("span", { id: `${inputId}-error`, css: errorText, role: "alert", children: error }))] }, field.id));
            }), hasRequired && (_jsx("span", { css: requiredNote, "aria-hidden": "true", children: "* Required" }))] }));
}
//# sourceMappingURL=ContactFields.js.map