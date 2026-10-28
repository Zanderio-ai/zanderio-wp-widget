import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/CrmCollectCard
 * @description Inline card for the LangGraph HITL CRM lead-capture flow.
 *
 * Renders the `crm_collect_info` interrupt: the board fields `crm_start`
 * selected off the merchant's own CRM board, or the name/email/reason fields
 * of the AI's "talk to a person" handoff (provider `handoff`), which gets its
 * own heading and marks the fields the team needs as required. When it can be
 * sent lives in `chat/contact-form`. A sibling of `BookingStepCard` rather
 * than another branch on it: the two flows have unrelated shapes (flat
 * `fields[]` here vs booking's event-type/location/slot state machine).
 */
import { useState } from "react";
import { css } from "@emotion/react";
import { panel } from "../ui/shell.js";
import { actionsRow, confirmButton, ghostButton, spacer, subtitle } from "./form.js";
import { ContactFields } from "./ContactFields.js";
import { unwrapInterrupt } from "../chat/envelope.js";
import { HANDOFF_PROVIDER, canSubmitContactForm } from "../chat/contact-form.js";
function extractPayload(interrupt) {
    const inner = unwrapInterrupt(interrupt);
    return inner && inner.phase === "crm_collect_info" ? inner : null;
}
// Local: this card's heading sits tighter to its subtitle than the shared one.
const title = css `
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
`;
export function CrmCollectCard({ interrupt, brandColor, brandName, onRespond, }) {
    const payload = extractPayload(interrupt);
    if (!payload)
        return null;
    // Remount whenever the field set changes, so `values` below always starts
    // fresh — the same "reset all state when an input changes" pattern
    // BookingStepCard uses.
    const resetKey = payload.fields.map((f) => f.id).join(",");
    return (_jsx(CrmCollectBody, { payload: payload, brandColor: brandColor, brandName: brandName, onRespond: onRespond }, resetKey));
}
function CrmCollectBody({ payload, brandColor, brandName, onRespond, }) {
    const [values, setValues] = useState({});
    const confirmDisabled = !canSubmitContactForm(payload.fields, values);
    const isHandoff = payload.provider === HANDOFF_PROVIDER;
    const team = brandName || "our team";
    return (_jsxs("div", { css: panel, children: [_jsx("span", { css: title, children: isHandoff ? `Talk to someone from ${team}` : _jsx(_Fragment, { children: "Let\u2019s get you connected" }) }), _jsx("span", { css: subtitle, children: isHandoff
                    ? "Leave your details and they’ll get back to you."
                    : `Share a couple details and someone from ${team} will reach out.` }), _jsx(ContactFields, { fields: payload.fields, values: values, onChange: (id, value) => setValues((p) => ({ ...p, [id]: value })) }), _jsxs("div", { css: actionsRow, children: [_jsx("button", { type: "button", css: ghostButton, onClick: () => onRespond({ action: "cancel" }), children: "Cancel" }), _jsx("div", { css: spacer }), _jsx("button", { type: "button", css: confirmButton(brandColor), disabled: confirmDisabled, onClick: () => onRespond({ values }), children: "Continue" })] })] }));
}
//# sourceMappingURL=CrmCollectCard.js.map