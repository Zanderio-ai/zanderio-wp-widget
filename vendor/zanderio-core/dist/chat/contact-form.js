/**
 * When the contact card (`crm_collect_info`) can be sent.
 *
 * Two forms share the card. The CRM lead form marks nothing required and only
 * needs some way to reach the visitor, so any filled field will do. The AI's
 * "talk to a person" handoff form (provider `handoff`) marks the fields the
 * team needs as `required`, and the card waits for all of them. Either way, an
 * email field with text in it must look like an address: the team would only
 * fail to reach a typo.
 *
 * Pure, like the rest of this entry point. Both the widget and the dashboard
 * use these through `CrmCollectCard`.
 */
/** Loose on purpose: catches typos, never rejects a real address. */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** The handoff form's provider tag, used to give it its own heading. */
export const HANDOFF_PROVIDER = "handoff";
const filled = (value) => (value ?? "").trim() !== "";
/** Why a field's current value can't be sent, or null when it's fine. */
export function contactFieldError(field, value) {
    if (field.type === "email" && filled(value) && !EMAIL_PATTERN.test((value ?? "").trim())) {
        return "Enter a valid email address";
    }
    return null;
}
/** Whether the card's Continue button may send these values. */
export function canSubmitContactForm(fields, values) {
    if (fields.some((field) => contactFieldError(field, values[field.id])))
        return false;
    const required = fields.filter((field) => field.required);
    if (required.length > 0)
        return required.every((field) => filled(values[field.id]));
    return fields.some((field) => filled(values[field.id]));
}
//# sourceMappingURL=contact-form.js.map