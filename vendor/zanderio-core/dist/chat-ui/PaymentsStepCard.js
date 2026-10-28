import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/PaymentsStepCard
 * @description Inline card for the LangGraph HITL payment-verification flow.
 *
 * Renders `payments_collect_email` and the emailed-code step of every flow
 * (`CodePhase`: payments and marketing send the same prompt). A sibling of
 * BookingStepCard and CrmCollectCard rather than another branch on either —
 * this flow asks one short thing at a time and carries its own retry state
 * (`attempts_left`), which neither of the others has a shape for.
 */
import { useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel } from "../ui/shell.js";
import { actionsRow, confirmButton, fieldLabel, ghostButton, input, spacer, subtitle, title, } from "./form.js";
import { unwrapInterrupt } from "../chat/envelope.js";
const CODE_LENGTH = 6;
const CODE_PHASES = [
    "payments_collect_code",
    "marketing_collect_code",
];
/** Whether this phase asks for the emailed one-time code. */
export function isCodePhase(phase) {
    return typeof phase === "string" && CODE_PHASES.includes(phase);
}
function extractPayload(interrupt) {
    const inner = unwrapInterrupt(interrupt);
    if (!inner)
        return null;
    return inner.phase === "payments_collect_email" || isCodePhase(inner.phase)
        ? inner
        : null;
}
const errorLine = css `
  display: block;
  font-size: 12px;
  color: ${tokens.color.error};
  margin-top: 6px;
`;
export function PaymentsStepCard({ interrupt, brandColor, onRespond }) {
    const payload = extractPayload(interrupt);
    if (!payload)
        return null;
    // Remount on every phase change and on every retry, so a rejected code is
    // cleared rather than left in the field for the visitor to resubmit.
    return (_jsx(PaymentsStepBody, { payload: payload, brandColor: brandColor, onRespond: onRespond }, `${payload.phase}-${payload.attempts_left ?? ""}`));
}
function PaymentsStepBody({ payload, brandColor, onRespond, }) {
    const [value, setValue] = useState("");
    const isEmailStep = payload.phase === "payments_collect_email";
    const trimmed = value.trim();
    // Deliberately loose: the backend validates properly and owns the rejection
    // message. This only stops an obviously empty submit.
    const canSubmit = isEmailStep ? trimmed.includes("@") : trimmed.length === CODE_LENGTH;
    const submit = () => {
        if (!canSubmit)
            return;
        onRespond(isEmailStep ? { email: trimmed } : { code: trimmed });
    };
    return (_jsxs("div", { css: panel, children: [_jsx("span", { css: title, children: isEmailStep ? "Confirm it’s you" : "Enter your code" }), _jsx("span", { css: subtitle, children: isEmailStep
                    ? "Before I look up any payments, tell me the email on your account and I’ll send a code."
                    : `I sent a ${CODE_LENGTH}-digit code to ${payload.sent_to ?? "your inbox"}.` }), _jsx("label", { css: fieldLabel, children: isEmailStep ? "Email address" : `${CODE_LENGTH}-digit code` }), _jsx("input", { css: input, autoFocus: true, type: isEmailStep ? "email" : "text", value: value, onChange: (e) => setValue(isEmailStep ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH)), onKeyDown: (e) => {
                    if (e.key === "Enter")
                        submit();
                }, autoComplete: isEmailStep ? "email" : "one-time-code", inputMode: isEmailStep ? undefined : "numeric", maxLength: isEmailStep ? undefined : CODE_LENGTH }), payload.attempts_left !== undefined && (_jsxs("span", { css: errorLine, children: ["That code didn\u2019t match. ", payload.attempts_left, " ", payload.attempts_left === 1 ? "try" : "tries", " left."] })), _jsxs("div", { css: actionsRow, children: [_jsx("button", { type: "button", css: ghostButton, onClick: () => onRespond({ action: "cancel" }), children: "Cancel" }), _jsx("div", { css: spacer }), _jsx("button", { type: "button", css: confirmButton(brandColor), disabled: !canSubmit, onClick: submit, children: "Continue" })] })] }));
}
//# sourceMappingURL=PaymentsStepCard.js.map