import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/BookingStepCard
 * @description Inline card for the LangGraph HITL booking flow.
 *
 * Renders whichever `data-interrupt` phase (select_event_type / select_location
 * / select_slot / collect_info / review) is currently pending, inline at the
 * tail of the message list. The response goes back via the JSON-resume message
 * pattern (`onRespond`); `{action: "cancel"}` and `{action: "back"}` are
 * universal control signals honoured at every phase.
 */
import { useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import { panel } from "../ui/shell.js";
import { actionsRow, confirmButton, fieldGroup, fieldLabel, ghostButton, input, pill, spacer, summaryLine, title, } from "./form.js";
import { unwrapInterrupt } from "../chat/envelope.js";
function groupSlotsByDay(options) {
    const groups = [];
    const byDate = new Map();
    for (const opt of options) {
        const dateLabel = opt.date_label ?? "";
        let group = byDate.get(dateLabel);
        if (!group) {
            group = { dateLabel, slots: [] };
            byDate.set(dateLabel, group);
            groups.push(group);
        }
        group.slots.push(opt);
    }
    return groups;
}
const PHASE_TITLE = {
    select_event_type: "Choose appointment type",
    select_location: "Choose a meeting location",
    select_slot: "Choose a time",
    collect_info: "Your details",
    review: "Confirm your booking",
};
function extractPayload(interrupt) {
    const inner = unwrapInterrupt(interrupt);
    return inner && "phase" in inner ? inner : null;
}
const notice = css `
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.warning};
  margin-bottom: 10px;
`;
const optionList = css `
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
`;
const optionRow = (selected, brandColor) => css `
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
const radio = (selected, brandColor) => css `
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid ${selected ? brandColor : tokens.color.grey[300]};
  background: ${selected ? brandColor : "transparent"};
  box-shadow: ${selected ? `inset 0 0 0 3px ${tokens.color.bg}` : "none"};
`;
const dayTabRow = css `
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 6px;
`;
const slotGrid = css `
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 4px;
`;
const slotChip = (selected, brandColor) => css `
  border: 1px solid ${selected ? brandColor : tokens.color.border};
  background: ${selected ? `${brandColor}0F` : tokens.color.bg};
  border-radius: ${tokens.radius.lg};
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 600;
  font-family: ${tokens.font.family};
  color: ${tokens.color.text};
  cursor: pointer;
  text-align: center;
`;
const optionMeta = css `
  display: flex;
  flex-direction: column;
  gap: 1px;
`;
const optionSub = css `
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;
const questionLabel = css `
  display: block;
  font-size: 12px;
  color: ${tokens.color.textSecondary};
  margin-bottom: 6px;
`;
const chipRow = css `
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;
const reviewBlock = css `
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
`;
const divider = css `
  height: 1px;
  background: ${tokens.color.border};
  margin: 8px 0;
`;
export function BookingStepCard({ interrupt, brandColor, onRespond }) {
    const payload = extractPayload(interrupt);
    if (!payload)
        return null;
    // Remount (rather than reset via effect) whenever a new phase or option set
    // appears, so `selected`/`form` below always start fresh — React's
    // recommended pattern for "reset all state when an input changes".
    const resetKey = `${payload.phase}-${payload.options?.length ?? 0}`;
    return (_jsx(BookingStepBody, { payload: payload, brandColor: brandColor, onRespond: onRespond }, resetKey));
}
function BookingStepBody({ payload, brandColor, onRespond, }) {
    const [selected, setSelected] = useState("");
    const [form, setForm] = useState({ name: "", email: "", location: "" });
    const [choiceAnswers, setChoiceAnswers] = useState({});
    const [otherActive, setOtherActive] = useState({});
    const [otherText, setOtherText] = useState({});
    const { phase, options = [] } = payload;
    const questions = payload.questions ?? [];
    const slotDayGroups = phase === "select_slot" ? groupSlotsByDay(options) : [];
    const [activeDay, setActiveDay] = useState(slotDayGroups[0]?.dateLabel ?? "");
    const activeDaySlots = slotDayGroups.find((group) => group.dateLabel === activeDay)?.slots ?? [];
    function selectChoice(question, choice) {
        setChoiceAnswers((prev) => {
            if (question.type !== "multi_select")
                return { ...prev, [question.id]: choice };
            const current = Array.isArray(prev[question.id]) ? prev[question.id] : [];
            const next = current.includes(choice)
                ? current.filter((v) => v !== choice)
                : [...current, choice];
            return { ...prev, [question.id]: next };
        });
    }
    function answerFor(question) {
        const choice = choiceAnswers[question.id];
        const other = otherActive[question.id] ? (otherText[question.id] ?? "").trim() : "";
        if (question.type === "multi_select") {
            const chosen = Array.isArray(choice) ? choice : [];
            return [...chosen, ...(other ? [other] : [])].join(", ");
        }
        return other || (typeof choice === "string" ? choice : "");
    }
    const needsSelection = phase === "select_event_type" || phase === "select_location" || phase === "select_slot";
    const confirmDisabled = (needsSelection && !selected) ||
        (phase === "collect_info" &&
            (!form.name.trim() ||
                !form.email.trim() ||
                (payload.location?.requires_input && !form.location.trim()) ||
                questions.some((q) => !answerFor(q).trim())));
    const showBack = phase !== "select_event_type";
    const confirm = () => {
        if (phase === "select_event_type")
            onRespond({
                event_type_id: selected,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            });
        else if (phase === "select_location")
            onRespond({ location_id: selected });
        else if (phase === "select_slot")
            onRespond({ start_time: selected });
        else if (phase === "collect_info") {
            const answers = Object.fromEntries(questions.map((q) => [q.id, answerFor(q)]));
            onRespond({ ...form, answers });
        }
        else
            onRespond({ confirm: true });
    };
    return (_jsxs("div", { css: panel, children: [_jsx("span", { css: title, children: PHASE_TITLE[phase] ?? "Booking" }), payload.notice && _jsx("span", { css: notice, children: payload.notice }), phase === "select_event_type" && (_jsx("div", { css: optionList, children: options.map((opt, i) => {
                    const id = opt.id ?? String(i);
                    const active = selected === id;
                    return (_jsxs("button", { type: "button", css: optionRow(active, brandColor), onClick: () => setSelected(id), children: [_jsx("span", { css: radio(active, brandColor) }), _jsxs("span", { css: optionMeta, children: [_jsx("span", { children: opt.name ?? `Option ${i + 1}` }), opt.duration && _jsx("span", { css: optionSub, children: opt.duration })] })] }, id));
                }) })), phase === "select_slot" && (_jsxs(_Fragment, { children: [_jsx("div", { css: dayTabRow, children: slotDayGroups.map((group) => (_jsx("button", { type: "button", css: pill(activeDay === group.dateLabel, brandColor), onClick: () => setActiveDay(group.dateLabel), children: group.dateLabel }, group.dateLabel))) }), _jsx("div", { css: slotGrid, children: activeDaySlots.map((opt, i) => {
                            const value = opt.start_time ?? String(i);
                            const active = selected === value;
                            return (_jsx("button", { type: "button", css: slotChip(active, brandColor), onClick: () => setSelected(value), children: String(opt.time_label ?? opt.label ?? opt.start_time ?? `Slot ${i + 1}`) }, value));
                        }) })] })), phase === "select_location" && (_jsx("div", { css: optionList, children: options.map((opt, i) => {
                    const id = opt.id ?? String(i);
                    const active = selected === id;
                    return (_jsxs("button", { type: "button", css: optionRow(active, brandColor), onClick: () => setSelected(id), children: [_jsx("span", { css: radio(active, brandColor) }), String(opt.label ?? opt.location ?? opt.kind ?? `Location ${i + 1}`)] }, id));
                }) })), phase === "collect_info" && (_jsxs("div", { css: fieldGroup, children: [(payload.event_type?.name || payload.start_label) && (_jsxs("span", { css: summaryLine, children: [payload.event_type?.name, payload.start_label ? ` · ${payload.start_label}` : ""] })), _jsxs("div", { children: [_jsx("label", { css: fieldLabel, children: "Name" }), _jsx("input", { css: input, value: form.name, onChange: (e) => setForm((p) => ({ ...p, name: e.target.value })), placeholder: "Your name" })] }), _jsxs("div", { children: [_jsx("label", { css: fieldLabel, children: "Email" }), _jsx("input", { css: input, type: "email", value: form.email, onChange: (e) => setForm((p) => ({ ...p, email: e.target.value })), placeholder: "you@example.com" })] }), payload.location?.requires_input && (_jsxs("div", { children: [_jsx("label", { css: fieldLabel, children: payload.location.kind === "outbound_call" ? "Phone number" : "Meeting location" }), _jsx("input", { css: input, value: form.location, onChange: (e) => setForm((p) => ({ ...p, location: e.target.value })), placeholder: payload.location.kind === "outbound_call"
                                    ? "+1 555 123 4567"
                                    : "Your preferred location" })] })), questions.map((q) => {
                        const hasChips = q.type === "single_select" || q.type === "multi_select";
                        if (!hasChips) {
                            return (_jsxs("div", { children: [_jsx("label", { css: fieldLabel, children: q.name }), _jsx("input", { css: input, value: typeof choiceAnswers[q.id] === "string" ? choiceAnswers[q.id] : "", onChange: (e) => setChoiceAnswers((p) => ({ ...p, [q.id]: e.target.value })) })] }, q.id));
                        }
                        const activeSet = new Set(q.type === "multi_select"
                            ? Array.isArray(choiceAnswers[q.id])
                                ? choiceAnswers[q.id]
                                : []
                            : [choiceAnswers[q.id]].filter((v) => typeof v === "string"));
                        return (_jsxs("div", { children: [_jsx("label", { css: questionLabel, children: q.name }), _jsxs("div", { css: chipRow, children: [(q.answer_choices ?? []).map((choice) => (_jsx("button", { type: "button", css: pill(activeSet.has(choice), brandColor), onClick: () => selectChoice(q, choice), children: choice }, choice))), q.include_other && (_jsx("button", { type: "button", css: pill(!!otherActive[q.id], brandColor), onClick: () => setOtherActive((p) => ({ ...p, [q.id]: !p[q.id] })), children: "Other" }))] }), otherActive[q.id] && (_jsx("input", { css: [input, css `margin-top: 6px;`], placeholder: "Your answer", value: otherText[q.id] ?? "", onChange: (e) => setOtherText((p) => ({ ...p, [q.id]: e.target.value })) }))] }, q.id));
                    })] })), phase === "review" && (_jsxs("div", { css: reviewBlock, children: [_jsx("span", { css: css `font-size: 14px; font-weight: 700;`, children: payload.event_type?.name }), _jsx("span", { css: summaryLine, children: payload.start_label }), _jsx("div", { css: divider }), _jsxs("span", { css: css `font-size: 13px;`, children: [payload.contact?.name, " \u00B7 ", payload.contact?.email] }), payload.location?.label && _jsx("span", { css: optionSub, children: payload.location.label })] })), _jsxs("div", { css: actionsRow, children: [showBack && (_jsx("button", { type: "button", css: ghostButton, onClick: () => onRespond({ action: "back" }), children: "Back" })), _jsx("button", { type: "button", css: ghostButton, onClick: () => onRespond({ action: "cancel" }), children: "Cancel" }), _jsx("div", { css: spacer }), _jsx("button", { type: "button", css: confirmButton(brandColor), disabled: confirmDisabled, onClick: confirm, children: phase === "review" ? "Confirm booking" : "Continue" })] })] }));
}
//# sourceMappingURL=BookingStepCard.js.map