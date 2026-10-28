/**
 * @module chat-ui/PaymentsStepCard
 * @description Inline card for the LangGraph HITL payment-verification flow.
 *
 * Renders `payments_collect_email` and the emailed-code step of every flow
 * (`CodePhase`: payments and marketing send the same prompt). A sibling of
 * BookingStepCard and CrmCollectCard rather than another branch on either —
 * this flow asks one short thing at a time and carries its own retry state
 * (`attempts_left`), which neither of the others has a shape for.
 */
import type { PaymentsResume } from "../chat/types.js";
export interface PaymentsStepCardProps {
    interrupt: unknown;
    brandColor: string;
    onRespond: (response: PaymentsResume) => void;
}
/** Whether this phase asks for the emailed one-time code. */
export declare function isCodePhase(phase: unknown): boolean;
export declare function PaymentsStepCard({ interrupt, brandColor, onRespond }: PaymentsStepCardProps): import("@emotion/react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=PaymentsStepCard.d.ts.map