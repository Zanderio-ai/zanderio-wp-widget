/**
 * @module ui/InterruptDialog
 * @description Human-in-the-loop interrupt prompt for the booking flow.
 *
 * Token-styled twin of client/app playground `InterruptDialog.tsx` (no MUI). The
 * AI service pauses the graph and streams a `data-interrupt` part describing the
 * phase (select_event_type / select_slot / collect_info) and its options; the
 * visitor's choice is sent back via the JSON-resume message pattern
 * (`respondToInterrupt`). Rendered as an in-panel overlay scoped to the chat
 * window so it never escapes the shadow root.
 */

import { useEffect, useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";

interface InterruptDialogProps {
  /** The `data-interrupt` payload, or null when no interrupt is pending. */
  interrupt: unknown;
  brandColor: string;
  onRespond: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface InterruptPayload {
  phase?: string;
  options?: Array<Record<string, unknown>>;
  event_type?: { name?: string };
  start_time?: string;
}

function extractPayload(interrupt: unknown): InterruptPayload | null {
  if (!interrupt || typeof interrupt !== "object") return null;
  const obj = interrupt as Record<string, unknown>;
  const inner = (obj.payload ?? obj.value ?? obj) as InterruptPayload;
  return inner && typeof inner === "object" ? inner : null;
}

const overlay = css`
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(17, 24, 39, 0.4);
  animation: z-fade-in 0.18s ease-out;
`;

const sheet = css`
  width: 100%;
  max-height: 88%;
  overflow-y: auto;
  background: ${tokens.color.bg};
  border-radius: ${tokens.radius.xl} ${tokens.radius.xl} 0 0;
  padding: 18px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: z-sheet-up 0.22s ease-out;
`;

const title = css`
  font-size: 16px;
  font-weight: 700;
  color: ${tokens.color.text};
`;

const fieldLabel = css`
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.textSecondary};
`;

const optionRow = (selected: boolean, brandColor: string) => css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
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

const input = css`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.md};
  padding: 10px 12px;
  font-size: 14px;
  font-family: ${tokens.font.family};
  outline: none;
  &:focus {
    border-color: ${tokens.color.primary};
  }
`;

export function InterruptDialog({ interrupt, brandColor, onRespond, onCancel }: InterruptDialogProps) {
  const payload = extractPayload(interrupt);
  const phase = payload?.phase;
  const options = payload?.options ?? [];

  const [selected, setSelected] = useState("");
  const [form, setForm] = useState<{ name: string; email: string; notes: string }>({
    name: "",
    email: "",
    notes: "",
  });

  // Reset transient input whenever a new interrupt phase appears.
  useEffect(() => {
    setSelected("");
    setForm({ name: "", email: "", notes: "" });
  }, [phase, options.length]);

  if (!payload || !phase) return null;

  const confirm = () => {
    if (phase === "select_event_type") onRespond({ event_type_id: selected });
    else if (phase === "select_slot") onRespond({ start_time: selected });
    else if (phase === "collect_info") onRespond({ ...form });
  };

  const needsSelection = phase === "select_event_type" || phase === "select_slot";
  const confirmDisabled =
    (needsSelection && !selected) ||
    (phase === "collect_info" && (!form.name.trim() || !form.email.trim()));

  const heading =
    phase === "select_event_type"
      ? "Choose appointment type"
      : phase === "select_slot"
        ? "Choose a time"
        : "Your details";

  return (
    <div css={overlay} role="dialog" aria-modal="true" aria-label={heading} onClick={onCancel}>
      <div css={sheet} onClick={(e) => e.stopPropagation()}>
        <span css={title}>{heading}</span>

        {phase === "select_event_type" && (
          <div css={css`display: flex; flex-direction: column; gap: 8px;`}>
            {options.map((opt, i) => {
              const id = String(opt.id ?? i);
              const dur = opt.duration ? ` (${String(opt.duration)})` : "";
              return (
                <button key={id} type="button" css={optionRow(selected === id, brandColor)} onClick={() => setSelected(id)}>
                  <span css={radio(selected === id, brandColor)} />
                  {String(opt.name ?? `Option ${i + 1}`)}
                  {dur}
                </button>
              );
            })}
          </div>
        )}

        {phase === "select_slot" && (
          <div css={css`display: flex; flex-direction: column; gap: 8px;`}>
            {options.map((opt, i) => {
              const value = String(opt.start_time ?? i);
              return (
                <button
                  key={value}
                  type="button"
                  css={optionRow(selected === value, brandColor)}
                  onClick={() => setSelected(value)}
                >
                  <span css={radio(selected === value, brandColor)} />
                  {String(opt.label ?? opt.start_time ?? `Slot ${i + 1}`)}
                </button>
              );
            })}
          </div>
        )}

        {phase === "collect_info" && (
          <div css={css`display: flex; flex-direction: column; gap: 10px;`}>
            {(payload.event_type?.name || payload.start_time) && (
              <span css={css`font-size: 12px; color: ${tokens.color.textSecondary};`}>
                Booking: {payload.event_type?.name ?? ""}
                {payload.start_time ? ` at ${payload.start_time}` : ""}
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
            <div>
              <label css={fieldLabel}>Notes (optional)</label>
              <input
                css={input}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Anything else?"
              />
            </div>
          </div>
        )}

        <div css={css`display: flex; gap: 8px; margin-top: 4px;`}>
          <button
            type="button"
            onClick={onCancel}
            css={css`
              flex: 1;
              padding: 11px;
              border: 1px solid ${tokens.color.border};
              border-radius: ${tokens.radius.lg};
              background: ${tokens.color.bg};
              color: ${tokens.color.textSecondary};
              font-size: 14px;
              font-weight: 600;
              font-family: ${tokens.font.family};
              cursor: pointer;
            `}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={confirmDisabled}
            css={css`
              flex: 2;
              padding: 11px;
              border: none;
              border-radius: ${tokens.radius.lg};
              background: ${brandColor};
              color: #fff;
              font-size: 14px;
              font-weight: 600;
              font-family: ${tokens.font.family};
              cursor: pointer;
              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
