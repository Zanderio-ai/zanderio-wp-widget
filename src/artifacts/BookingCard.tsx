/**
 * @module artifacts/BookingCard
 * @description Booking artifact — provider, duration, and available time slots.
 * Reads `artifact.data.{provider,duration_minutes,timezone,slots}`.
 *
 * When the graph is paused on a HITL interrupt (see {@link useChatActions}) the
 * slots become tappable: choosing one resumes the booking flow with
 * `{ start_time }`. With no pending interrupt the card renders read-only (a
 * historical/illustrative booking summary).
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import { useChatActions } from "./chat-actions";
import { panel } from "./shell";

interface Slot {
  label?: string;
  time?: string;
  start_time?: string;
  booked?: boolean;
  unavailable?: boolean;
}

export function BookingCard({ artifact }: { artifact: Artifact }) {
  const data = (artifact.data ?? {}) as Record<string, unknown>;
  const provider = (data.provider as string) ?? "Booking";
  const duration = data.duration_minutes as number | undefined;
  const timezone = data.timezone as string | undefined;
  const slots = (data.slots as Slot[]) ?? [];
  const { hasPendingInterrupt, respondToInterrupt } = useChatActions();

  return (
    <div css={panel}>
      <div css={css`display: flex; align-items: center; gap: 10px; margin-bottom: 12px;`}>
        <div
          css={css`
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: ${tokens.color.primaryLighter};
            color: ${tokens.color.primary};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
          `}
        >
          {provider[0]?.toUpperCase() ?? "B"}
        </div>
        <div>
          <div css={css`font-size: 14px; font-weight: 700; line-height: 1.2;`}>{provider}</div>
          <div css={css`font-size: 11px; color: ${tokens.color.textSecondary};`}>
            {[duration ? `${duration} min` : null, timezone].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      {artifact.title && <div css={css`font-size: 13px; color: ${tokens.color.textSecondary}; margin-bottom: 12px; line-height: 1.5;`}>{artifact.title}</div>}

      {slots.length > 0 && (
        <div css={css`display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;`}>
          {slots.map((s, i) => {
            const disabled = s.booked || s.unavailable;
            const startTime = s.start_time ?? s.time;
            const interactive = hasPendingInterrupt && !disabled && Boolean(startTime);
            return (
              <button
                key={i}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && respondToInterrupt({ start_time: startTime })}
                css={css`
                  height: 28px;
                  display: inline-flex;
                  align-items: center;
                  padding: 0 10px;
                  font-size: 12px;
                  font-weight: 500;
                  font-family: ${tokens.font.family};
                  border-radius: 999px;
                  border: 1px solid ${disabled ? "transparent" : tokens.color.border};
                  background: ${disabled ? tokens.color.grey[100] : tokens.color.grey[50]};
                  color: ${disabled ? tokens.color.textDisabled : tokens.color.textSecondary};
                  text-decoration: ${disabled ? "line-through" : "none"};
                  cursor: ${interactive ? "pointer" : "default"};
                  &:hover {
                    ${interactive
                      ? `border-color: ${tokens.color.primary}; color: ${tokens.color.primary};`
                      : ""}
                  }
                `}
              >
                {s.label ?? s.time ?? "Slot"}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        disabled={!hasPendingInterrupt}
        css={css`
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 10px;
          background: ${tokens.color.primary};
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          font-family: ${tokens.font.family};
          cursor: ${hasPendingInterrupt ? "pointer" : "default"};
          opacity: ${hasPendingInterrupt ? 1 : 0.55};
        `}
      >
        {hasPendingInterrupt ? "Select a time above" : "Book Appointment"}
      </button>
    </div>
  );
}
