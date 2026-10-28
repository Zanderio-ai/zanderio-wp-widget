import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/MarketingConsentCard
 * @description Inline card for the marketing opt-in flow.
 *
 * Renders the `marketing_collect_consent` interrupt: an address and an
 * explicit agreement. The emailed code that follows is `PaymentsStepCard`'s
 * code step. A sibling of `CrmCollectCard` rather than a branch on it: the CRM
 * form collects whichever fields a merchant's board has, while this one asks a
 * fixed question that carries a legal obligation. Both draw their inputs with
 * `ContactFields`.
 *
 * Two things here are contract, not styling. The checkbox starts unticked,
 * because a pre-ticked box is not valid consent under GDPR. And `consent_text`
 * renders verbatim, because the service stores that exact string as the record
 * of what the visitor agreed to.
 */
import { useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel } from "../ui/shell.js";
import { actionsRow, confirmButton, ghostButton, spacer, title } from "./form.js";
import { ContactFields } from "./ContactFields.js";
import { unwrapInterrupt } from "../chat/envelope.js";
import { canSubmitContactForm } from "../chat/contact-form.js";
function extractPayload(interrupt) {
    const inner = unwrapInterrupt(interrupt);
    return inner && inner.phase === "marketing_collect_consent"
        ? inner
        : null;
}
const consentRow = css `
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  cursor: pointer;
`;
const checkbox = (brandColor) => css `
  margin: 2px 0 0;
  flex-shrink: 0;
  accent-color: ${brandColor};
`;
const consentText = css `
  font-size: 12px;
  line-height: 1.45;
  color: ${tokens.color.textSecondary};
`;
export function MarketingConsentCard({ interrupt, brandColor, onRespond }) {
    const payload = extractPayload(interrupt);
    if (!payload)
        return null;
    return (_jsx(MarketingConsentBody, { payload: payload, brandColor: brandColor, onRespond: onRespond }, payload.fields.map((f) => f.id).join(",")));
}
function MarketingConsentBody({ payload, brandColor, onRespond, }) {
    // The agreement arrives as a checkbox field; it is drawn below, on its own.
    const addressFields = payload.fields.filter((field) => field.type !== "checkbox");
    const [values, setValues] = useState({});
    // Never pre-ticked.
    const [consented, setConsented] = useState(false);
    return (_jsxs("div", { css: panel, children: [_jsx("span", { css: title, children: payload.list_name ? `Join ${payload.list_name}` : "Sign up for emails" }), _jsx(ContactFields, { fields: addressFields, values: values, onChange: (id, value) => setValues((p) => ({ ...p, [id]: value })) }), _jsxs("label", { css: consentRow, children: [_jsx("input", { type: "checkbox", css: checkbox(brandColor), checked: consented, onChange: (e) => setConsented(e.target.checked) }), _jsx("span", { css: consentText, children: payload.consent_text })] }), _jsxs("div", { css: actionsRow, children: [_jsx("button", { type: "button", css: ghostButton, onClick: () => onRespond({ action: "cancel" }), children: "Cancel" }), _jsx("div", { css: spacer }), _jsx("button", { type: "button", css: confirmButton(brandColor), disabled: !canSubmitContactForm(addressFields, values), 
                        // Enabled without the tick on purpose: "I read it and decided no"
                        // reaches the service as a refusal it answers, not as a dead end.
                        onClick: () => onRespond({ values: { ...values, consent: consented } }), children: "Continue" })] })] }));
}
//# sourceMappingURL=MarketingConsentCard.js.map