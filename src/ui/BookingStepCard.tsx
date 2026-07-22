/**
 * @module ui/BookingStepCard
 * @description Inline card for the LangGraph HITL booking flow.
 *
 * Token-styled twin of client/app playground `BookingStepCard.tsx`. Renders
 * whichever `data-interrupt` phase (select_event_type / select_location / select_slot /
 * collect_info / review) is currently pending, inline at the tail of the
 * message list — replaces the old bottom-sheet `InterruptDialog` overlay. The
 * response is sent back via the JSON-resume message pattern
 * (`respondToInterrupt`); `{action: "cancel"}` and `{action: "back"}` are
 * universal control signals honoured at every phase.
 */

import { useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import { panel } from "@/artifacts/shell";
import type { BookingInterrupt, BookingResume } from "@/core/chat-types";

interface BookingStepCardProps {
  interrupt: unknown;
  brandColor: string;
  onRespond: (response: BookingResume) => void;
}

const PHASE_TITLE: Record<string, string> = {
  select_event_type: "Choose appointment type",
  select_location: "Choose a meeting location",
  select_slot: "Choose a time",
  collect_info: "Your details",
  review: "Confirm your booking",
};

function extractPayload(interrupt: unknown): BookingInterrupt | null {
  if (!interrupt || typeof interrupt !== "object") return null;
  const obj = interrupt as Record<string, unknown>;
  const inner = (obj.payload ?? obj.value ?? obj) as BookingInterrupt;
  return inner && typeof inner === "object" && "phase" in inner ? inner : null;
}

const title = css`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
`;

const notice = css`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.warning};
  margin-bottom: 10px;
`;

const optionList = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
`;

const optionRow = (selected: boolean, brandColor: string) => css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid ${selected ? brandColor : tokens.color.border};
  background: ${selected ? `${brandColor}0F` : tokens.color.bg};
  border-radius: ${tokens.radius.lg};
  font-size: 14px;
  color: ${tokens.color.text};
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: ${tokens.font.family};
`;

const radio = (selected: boolean, brandColor: string) => css`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid ${selected ? brandColor : tokens.color.grey[300]};
  background: ${selected ? brandColor : "transparent"};
  box-shadow: ${selected ? `inset 0 0 0 3px ${tokens.color.bg}` : "none"};
`;

const optionMeta = css`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const optionSub = css`
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;

const fieldLabel = css`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.textSecondary};
  margin-bottom: 4px;
`;

const input = css`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.md};
  padding: 10px 12px;
  /* 16px avoids iOS Safari's auto-zoom-on-focus for inputs under 16px. */
  font-size: 16px;
  font-family: ${tokens.font.family};
  outline: none;
  &:focus {
    border-color: ${tokens.color.primary};
  }
`;

const fieldGroup = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const summaryLine = css`
  font-size: 13px;
  color: ${tokens.color.textSecondary};
  margin-bottom: 10px;
`;

const reviewBlock = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
`;

const divider = css`
  height: 1px;
  background: ${tokens.color.border};
  margin: 8px 0;
`;

const actionsRow = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
`;

const ghostButton = css`
  border: none;
  background: transparent;
  color: ${tokens.color.textSecondary};
  font-size: 13px;
  font-weight: 600;
  font-family: ${tokens.font.family};
  cursor: pointer;
  padding: 8px 4px;
`;

const confirmButton = (brandColor: string) => css`
  border: none;
  border-radius: ${tokens.radius.lg};
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: ${tokens.font.family};
  background: ${brandColor};
  color: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function BookingStepCard({ interrupt, brandColor, onRespond }: BookingStepCardProps) {
  const payload = extractPayload(interrupt);
  if (!payload) return null;

  // Remount (rather than reset via effect) whenever a new phase or option set
  // appears, so `selected`/`form` below always start fresh — React's
  // recommended pattern for "reset all state when an input changes".
  const resetKey = `${payload.phase}-${payload.options?.length ?? 0}`;
  return <BookingStepBody key={resetKey} payload={payload} brandColor={brandColor} onRespond={onRespond} />;
}

function BookingStepBody({
  payload,
  brandColor,
  onRespond,
}: {
  payload: BookingInterrupt;
  brandColor: string;
  onRespond: (response: BookingResume) => void;
}) {
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({ name: "", email: "", location: "" });

  const { phase, options = [] } = payload;

  const needsSelection =
    phase === "select_event_type" || phase === "select_location" || phase === "select_slot";
  const confirmDisabled =
    (needsSelection && !selected) ||
    (phase === "collect_info" &&
      (!form.name.trim() ||
        !form.email.trim() ||
        (payload.location?.requires_input && !form.location.trim())));
  const showBack = phase !== "select_event_type";

  const confirm = () => {
    if (phase === "select_event_type")
      onRespond({
        event_type_id: selected,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
    else if (phase === "select_location") onRespond({ location_id: selected });
    else if (phase === "select_slot") onRespond({ start_time: selected });
    else if (phase === "collect_info") onRespond({ ...form });
    else onRespond({ confirm: true });
  };

  return (
    <div css={panel}>
      <span css={title}>{PHASE_TITLE[phase] ?? "Booking"}</span>

      {payload.notice && <span css={notice}>{payload.notice}</span>}

      {phase === "select_event_type" && (
        <div css={optionList}>
          {options.map((opt, i) => {
            const id = opt.id ?? String(i);
            const active = selected === id;
            return (
              <button key={id} type="button" css={optionRow(active, brandColor)} onClick={() => setSelected(id)}>
                <span css={radio(active, brandColor)} />
                <span css={optionMeta}>
                  <span>{opt.name ?? `Option ${i + 1}`}</span>
                  {opt.duration && <span css={optionSub}>{opt.duration}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {phase === "select_slot" && (
        <div css={optionList}>
          {options.map((opt, i) => {
            const value = opt.start_time ?? String(i);
            const active = selected === value;
            return (
              <button key={value} type="button" css={optionRow(active, brandColor)} onClick={() => setSelected(value)}>
                <span css={radio(active, brandColor)} />
                {String(opt.label ?? opt.start_time ?? `Slot ${i + 1}`)}
              </button>
            );
          })}
        </div>
      )}

      {phase === "select_location" && (
        <div css={optionList}>
          {options.map((opt, i) => {
            const id = opt.id ?? String(i);
            const active = selected === id;
            return (
              <button key={id} type="button" css={optionRow(active, brandColor)} onClick={() => setSelected(id)}>
                <span css={radio(active, brandColor)} />
                {String(opt.label ?? opt.location ?? opt.kind ?? `Location ${i + 1}`)}
              </button>
            );
          })}
        </div>
      )}

      {phase === "collect_info" && (
        <div css={fieldGroup}>
          {(payload.event_type?.name || payload.start_label) && (
            <span css={summaryLine}>
              {payload.event_type?.name}
              {payload.start_label ? ` · ${payload.start_label}` : ""}
            </span>
          )}
          <div>
            <label css={fieldLabel}>Name</label>
            <input
              css={input}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div>
            <label css={fieldLabel}>Email</label>
            <input
              css={input}
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          {payload.location?.requires_input && (
            <div>
            <label css={fieldLabel}>
              {payload.location.kind === "outbound_call" ? "Phone number" : "Meeting location"}
            </label>
            <input
              css={input}
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder={payload.location.kind === "outbound_call" ? "+1 555 123 4567" : "Your preferred location"}
            />
            </div>
          )}
        </div>
      )}

      {phase === "review" && (
        <div css={reviewBlock}>
          <span css={css`font-size: 14px; font-weight: 700;`}>{payload.event_type?.name}</span>
          <span css={summaryLine}>{payload.start_label}</span>
          <div css={divider} />
          <span css={css`font-size: 13px;`}>
            {payload.contact?.name} &middot; {payload.contact?.email}
          </span>
          {payload.location?.label && <span css={optionSub}>{payload.location.label}</span>}
        </div>
      )}

      <div css={actionsRow}>
        {showBack && (
          <button type="button" css={ghostButton} onClick={() => onRespond({ action: "back" })}>
            Back
          </button>
        )}
        <button type="button" css={ghostButton} onClick={() => onRespond({ action: "cancel" })}>
          Cancel
        </button>
        <div css={css`flex: 1;`} />
        <button type="button" css={confirmButton(brandColor)} disabled={confirmDisabled} onClick={confirm}>
          {phase === "review" ? "Confirm booking" : "Continue"}
        </button>
      </div>
    </div>
  );
}
