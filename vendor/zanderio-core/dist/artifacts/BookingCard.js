import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/BookingCard
 * @description Durable confirmation card for a completed booking.
 *
 * Emitted once by the AI booking-confirmation node as
 * `Artifact(type="booking", data=BookingData(...))` after Calendly confirms
 * the invitee. Reads `artifact.data.{provider,event_type_name,start_label,
 * timezone,duration_label,status,reschedule_url,cancel_url}`. The interactive
 * step-by-step flow (type/location/slot/info/review) is rendered separately, inline,
 * by each app's `BookingStepCard`; this card only ever shows the final result.
 */
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel } from "../ui/shell.js";
const headerRow = css `
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;
const badge = (confirmed) => css `
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
const eventName = css `
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
`;
const statusLine = css `
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;
const when = css `
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
`;
const chipsRow = css `
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;
const chip = css `
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: ${tokens.radius.pill};
  background: ${tokens.color.grey[50]};
  color: ${tokens.color.textSecondary};
  font-size: 11px;
`;
const linksRow = css `
  display: flex;
  gap: 16px;
`;
const link = css `
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.brand.primary};
  text-decoration: none;
`;
const cancelLink = css `
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.error};
  text-decoration: none;
`;
export function BookingCard({ artifact }) {
    const data = (artifact.data ?? {});
    const { provider, event_type_name: eventTypeName, start_label: startLabel, timezone, duration_label: durationLabel, status = "confirmed", reschedule_url: rescheduleUrl, cancel_url: cancelUrl, } = data;
    const isConfirmed = status === "confirmed";
    return (_jsxs("div", { css: panel, children: [_jsxs("div", { css: headerRow, children: [_jsx("div", { css: badge(isConfirmed), children: isConfirmed ? "✓" : "✕" }), _jsxs("div", { children: [_jsx("div", { css: eventName, children: eventTypeName || "Appointment" }), _jsxs("div", { css: statusLine, children: [isConfirmed ? "Confirmed" : "Canceled", provider ? ` · ${provider}` : ""] })] })] }), _jsx("div", { css: when, children: startLabel }), _jsxs("div", { css: chipsRow, children: [durationLabel && _jsx("span", { css: chip, children: durationLabel }), timezone && _jsx("span", { css: chip, children: timezone })] }), (rescheduleUrl || cancelUrl) && (_jsxs("div", { css: linksRow, children: [rescheduleUrl && (_jsx("a", { css: link, href: rescheduleUrl, target: "_blank", rel: "noopener noreferrer", children: "Reschedule" })), cancelUrl && (_jsx("a", { css: cancelLink, href: cancelUrl, target: "_blank", rel: "noopener noreferrer", children: "Cancel" }))] }))] }));
}
//# sourceMappingURL=BookingCard.js.map