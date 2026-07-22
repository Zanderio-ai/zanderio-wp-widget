/**
 * @module artifacts/BookingCard
 * @description Durable confirmation card for a completed booking.
 *
 * Emitted once by the AI booking-confirmation node as
 * `Artifact(type="booking", data=BookingData(...))` after Calendly confirms
 * the invitee. Reads `artifact.data.{provider,event_type_name,start_label,
 * timezone,duration_label,status,reschedule_url,cancel_url}`. The interactive
 * step-by-step flow (type/location/slot/info/review) is rendered separately, inline,
 * by `BookingStepCard`; this card only ever shows the final result.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact, BookingConfirmation } from "@/core/chat-types";
import { panel } from "./shell";

const headerRow = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const badge = (confirmed: boolean) => css`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: ${confirmed ? `${tokens.color.success}1A` : tokens.color.grey[100]};
  color: ${confirmed ? tokens.color.success : tokens.color.grey[500]};
`;

const eventName = css`
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
`;

const statusLine = css`
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;

const when = css`
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const chipsRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const chip = css`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: ${tokens.radius.pill};
  background: ${tokens.color.grey[50]};
  color: ${tokens.color.textSecondary};
  font-size: 11px;
`;

const linksRow = css`
  display: flex;
  gap: 16px;
`;

const link = css`
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.primary};
  text-decoration: none;
`;

const cancelLink = css`
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.error};
  text-decoration: none;
`;

export function BookingCard({ artifact }: { artifact: Artifact }) {
  const data = (artifact.data ?? {}) as Partial<BookingConfirmation>;
  const {
    provider,
    event_type_name: eventTypeName,
    start_label: startLabel,
    timezone,
    duration_label: durationLabel,
    status = "confirmed",
    reschedule_url: rescheduleUrl,
    cancel_url: cancelUrl,
  } = data;

  const isConfirmed = status === "confirmed";

  return (
    <div css={panel}>
      <div css={headerRow}>
        <div css={badge(isConfirmed)}>{isConfirmed ? "✓" : "✕"}</div>
        <div>
          <div css={eventName}>{eventTypeName || "Appointment"}</div>
          <div css={statusLine}>
            {isConfirmed ? "Confirmed" : "Canceled"}
            {provider ? ` · ${provider}` : ""}
          </div>
        </div>
      </div>

      <div css={when}>{startLabel}</div>
      <div css={chipsRow}>
        {durationLabel && <span css={chip}>{durationLabel}</span>}
        {timezone && <span css={chip}>{timezone}</span>}
      </div>

      {(rescheduleUrl || cancelUrl) && (
        <div css={linksRow}>
          {rescheduleUrl && (
            <a css={link} href={rescheduleUrl} target="_blank" rel="noopener noreferrer">
              Reschedule
            </a>
          )}
          {cancelUrl && (
            <a css={cancelLink} href={cancelUrl} target="_blank" rel="noopener noreferrer">
              Cancel
            </a>
          )}
        </div>
      )}
    </div>
  );
}
