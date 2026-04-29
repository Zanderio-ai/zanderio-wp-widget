/**
 * BookingSheet — bottom sheet for booking overlay artifacts.
 *
 * Rendered by ChatWindow when an unanswered placement=overlay select
 * artifact is the last agent turn. Matches the Playground's bottom sheet
 * design exactly (pgSheetUp animation, handle bar, scrim, list rows for
 * event type selection, day-tab + time grid for datetime mode).
 */

import { useState, useMemo } from "react";

// ── DateTimeSlotPicker ────────────────────────────────────────────────────────
// Direct port of Playground's DateTimeSlotPicker (Playground.jsx:405-516)
// MUI Button/Box replaced with plain <button> + CSS classes.

function DateTimeSlotPicker({
  options,
  sentinelPrefix,
  accentColor,
  onSelect,
}) {
  const slotsByDay = useMemo(() => {
    const groups = {};
    options.forEach((opt) => {
      const dateObj = new Date(opt.value);
      const dayStr = dateObj.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[dayStr]) groups[dayStr] = [];
      groups[dayStr].push(opt);
    });
    return groups;
  }, [options]);

  const days = Object.keys(slotsByDay);
  const [selectedDay, setSelectedDay] = useState(() => days[0] ?? null);

  // Derive the actual selected day - fallback to first day if current selection is invalid
  const actualSelectedDay = useMemo(() => {
    if (days.length === 0) return null;
    if (!selectedDay || !days.includes(selectedDay)) return days[0];
    return selectedDay;
  }, [days, selectedDay]);

  if (!actualSelectedDay || !slotsByDay[actualSelectedDay]) return null;

  return (
    <div className="booking-slot-picker">
      {/* Day tabs */}
      <div className="booking-slot-picker__days">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className={[
              "booking-slot-picker__day-tab",
              day === actualSelectedDay &&
                "booking-slot-picker__day-tab--active",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              day === actualSelectedDay
                ? {
                    background: accentColor,
                    color: "var(--widget-accent-contrast)",
                    borderColor: accentColor,
                    boxShadow: `0 4px 12px var(--widget-accent-shadow)`,
                  }
                : {}
            }
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="booking-slot-picker__times">
        {slotsByDay[actualSelectedDay].map((opt) => {
          const timeStr = new Date(opt.value).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          });
          return (
            <button
              key={opt.value}
              type="button"
              className="booking-slot-picker__time"
              style={{
                color: accentColor,
                borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
              }}
              disabled={opt.available === false}
              onClick={() => {
                const sentinel = sentinelPrefix
                  ? `${sentinelPrefix}${opt.value}`
                  : opt.label;
                onSelect(sentinel);
              }}
            >
              {timeStr}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── BookingSheet ──────────────────────────────────────────────────────────────

export default function BookingSheet({ artifact, accentColor, onSend }) {
  const {
    options = [],
    mode,
    title,
    sentinel_prefix: sentinelPrefix = "",
  } = artifact.payload;

  if (options.length === 0) return null;

  return (
    <>
      {/* Scrim — minimal opacity, no blur, matches Playground's rgba(0,0,0,0.08) */}
      <div className="booking-sheet-scrim" />

      {/* Panel */}
      <div className="booking-sheet">
        {/* Handle bar */}
        <div className="booking-sheet__handle-wrap">
          <div className="booking-sheet__handle" />
        </div>

        {/* Title */}
        {title && <p className="booking-sheet__title">{title}</p>}

        {/* Content */}
        <div className={`booking-sheet__body booking-sheet__body--${mode}`}>
          {mode === "datetime" ? (
            <DateTimeSlotPicker
              options={options}
              sentinelPrefix={sentinelPrefix}
              accentColor={accentColor}
              onSelect={onSend}
            />
          ) : (
            <ul className="booking-sheet__list">
              {options.map((opt, idx) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    className="booking-sheet__row"
                    disabled={opt.available === false}
                    onClick={() => {
                      const sentinel = sentinelPrefix
                        ? `${sentinelPrefix}${opt.value}`
                        : opt.label;
                      onSend(sentinel);
                    }}
                  >
                    <span className="booking-sheet__row-text">
                      <span className="booking-sheet__row-primary">
                        {opt.label}
                      </span>
                      {opt.subtitle && (
                        <span className="booking-sheet__row-secondary">
                          {opt.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="booking-sheet__row-arrow">›</span>
                  </button>
                  {idx < options.length - 1 && (
                    <div className="booking-sheet__divider" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom safe-area */}
        <div className="booking-sheet__safe-area" />
      </div>
    </>
  );
}
