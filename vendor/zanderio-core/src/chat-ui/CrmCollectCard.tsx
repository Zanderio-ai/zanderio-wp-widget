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
import type { CrmInterrupt, CrmResume } from "../chat/types.js";
import { actionsRow, confirmButton, ghostButton, spacer, subtitle } from "./form.js";
import { ContactFields } from "./ContactFields.js";
import { unwrapInterrupt } from "../chat/envelope.js";
import { HANDOFF_PROVIDER, canSubmitContactForm } from "../chat/contact-form.js";

export interface CrmCollectCardProps {
  interrupt: unknown;
  brandColor: string;
  brandName?: string | null;
  onRespond: (response: CrmResume) => void;
}

function extractPayload(interrupt: unknown): CrmInterrupt | null {
  const inner = unwrapInterrupt(interrupt);
  return inner && inner.phase === "crm_collect_info" ? (inner as unknown as CrmInterrupt) : null;
}

// Local: this card's heading sits tighter to its subtitle than the shared one.
const title = css`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
`;

export function CrmCollectCard({
  interrupt,
  brandColor,
  brandName,
  onRespond,
}: CrmCollectCardProps) {
  const payload = extractPayload(interrupt);
  if (!payload) return null;

  // Remount whenever the field set changes, so `values` below always starts
  // fresh — the same "reset all state when an input changes" pattern
  // BookingStepCard uses.
  const resetKey = payload.fields.map((f) => f.id).join(",");
  return (
    <CrmCollectBody
      key={resetKey}
      payload={payload}
      brandColor={brandColor}
      brandName={brandName}
      onRespond={onRespond}
    />
  );
}

function CrmCollectBody({
  payload,
  brandColor,
  brandName,
  onRespond,
}: {
  payload: CrmInterrupt;
  brandColor: string;
  brandName?: string | null;
  onRespond: (response: CrmResume) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const confirmDisabled = !canSubmitContactForm(payload.fields, values);
  const isHandoff = payload.provider === HANDOFF_PROVIDER;
  const team = brandName || "our team";

  return (
    <div css={panel}>
      <span css={title}>
        {isHandoff ? `Talk to someone from ${team}` : <>Let&rsquo;s get you connected</>}
      </span>
      <span css={subtitle}>
        {isHandoff
          ? "Leave your details and they’ll get back to you."
          : `Share a couple details and someone from ${team} will reach out.`}
      </span>

      <ContactFields
        fields={payload.fields}
        values={values}
        onChange={(id, value) => setValues((p) => ({ ...p, [id]: value }))}
      />

      <div css={actionsRow}>
        <button type="button" css={ghostButton} onClick={() => onRespond({ action: "cancel" })}>
          Cancel
        </button>
        <div css={spacer} />
        <button
          type="button"
          css={confirmButton(brandColor)}
          disabled={confirmDisabled}
          onClick={() => onRespond({ values })}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
