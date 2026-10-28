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
import type { BookingResume } from "../chat/types.js";
export interface BookingStepCardProps {
    interrupt: unknown;
    brandColor: string;
    onRespond: (response: BookingResume) => void;
}
export declare function BookingStepCard({ interrupt, brandColor, onRespond }: BookingStepCardProps): import("@emotion/react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=BookingStepCard.d.ts.map