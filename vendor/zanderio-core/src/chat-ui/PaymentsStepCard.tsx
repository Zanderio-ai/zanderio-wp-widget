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
import type { CodePhase, PaymentsInterrupt, PaymentsResume } from "../chat/types.js";
import {
  actionsRow,
  confirmButton,
  fieldLabel,
  ghostButton,
  input,
  spacer,
  subtitle,
  title,
} from "./form.js";
import { unwrapInterrupt } from "../chat/envelope.js";

export interface PaymentsStepCardProps {
  interrupt: unknown;
  brandColor: string;
  onRespond: (response: PaymentsResume) => void;
}

const CODE_LENGTH = 6;

const CODE_PHASES: readonly string[] = [
  "payments_collect_code",
  "marketing_collect_code",
] satisfies CodePhase[];

/** Whether this phase asks for the emailed one-time code. */
export function isCodePhase(phase: unknown): boolean {
  return typeof phase === "string" && CODE_PHASES.includes(phase);
}

function extractPayload(interrupt: unknown): PaymentsInterrupt | null {
  const inner = unwrapInterrupt(interrupt);
  if (!inner) return null;
  return inner.phase === "payments_collect_email" || isCodePhase(inner.phase)
    ? (inner as unknown as PaymentsInterrupt)
    : null;
}

const errorLine = css`
  display: block;
  font-size: 12px;
  color: ${tokens.color.error};
  margin-top: 6px;
`;

export function PaymentsStepCard({ interrupt, brandColor, onRespond }: PaymentsStepCardProps) {
  const payload = extractPayload(interrupt);
  if (!payload) return null;

  // Remount on every phase change and on every retry, so a rejected code is
  // cleared rather than left in the field for the visitor to resubmit.
  return (
    <PaymentsStepBody
      key={`${payload.phase}-${payload.attempts_left ?? ""}`}
      payload={payload}
      brandColor={brandColor}
      onRespond={onRespond}
    />
  );
}

function PaymentsStepBody({
  payload,
  brandColor,
  onRespond,
}: {
  payload: PaymentsInterrupt;
  brandColor: string;
  onRespond: (response: PaymentsResume) => void;
}) {
  const [value, setValue] = useState("");
  const isEmailStep = payload.phase === "payments_collect_email";
  const trimmed = value.trim();

  // Deliberately loose: the backend validates properly and owns the rejection
  // message. This only stops an obviously empty submit.
  const canSubmit = isEmailStep ? trimmed.includes("@") : trimmed.length === CODE_LENGTH;

  const submit = () => {
    if (!canSubmit) return;
    onRespond(isEmailStep ? { email: trimmed } : { code: trimmed });
  };

  return (
    <div css={panel}>
      <span css={title}>{isEmailStep ? "Confirm it’s you" : "Enter your code"}</span>
      <span css={subtitle}>
        {isEmailStep
          ? "Before I look up any payments, tell me the email on your account and I’ll send a code."
          : `I sent a ${CODE_LENGTH}-digit code to ${payload.sent_to ?? "your inbox"}.`}
      </span>

      <label css={fieldLabel}>{isEmailStep ? "Email address" : `${CODE_LENGTH}-digit code`}</label>
      <input
        css={input}
        autoFocus
        type={isEmailStep ? "email" : "text"}
        value={value}
        onChange={(e) =>
          setValue(
            isEmailStep ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
          )
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        autoComplete={isEmailStep ? "email" : "one-time-code"}
        inputMode={isEmailStep ? undefined : "numeric"}
        maxLength={isEmailStep ? undefined : CODE_LENGTH}
      />

      {payload.attempts_left !== undefined && (
        <span css={errorLine}>
          That code didn&rsquo;t match. {payload.attempts_left}{" "}
          {payload.attempts_left === 1 ? "try" : "tries"} left.
        </span>
      )}

      <div css={actionsRow}>
        <button type="button" css={ghostButton} onClick={() => onRespond({ action: "cancel" })}>
          Cancel
        </button>
        <div css={spacer} />
        <button
          type="button"
          css={confirmButton(brandColor)}
          disabled={!canSubmit}
          onClick={submit}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
