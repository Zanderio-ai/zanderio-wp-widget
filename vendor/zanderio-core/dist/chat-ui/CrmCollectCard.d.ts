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
import type { CrmResume } from "../chat/types.js";
export interface CrmCollectCardProps {
    interrupt: unknown;
    brandColor: string;
    brandName?: string | null;
    onRespond: (response: CrmResume) => void;
}
export declare function CrmCollectCard({ interrupt, brandColor, brandName, onRespond, }: CrmCollectCardProps): import("@emotion/react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=CrmCollectCard.d.ts.map