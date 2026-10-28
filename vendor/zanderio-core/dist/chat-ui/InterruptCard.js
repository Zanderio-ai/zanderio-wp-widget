import { jsx as _jsx } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/InterruptCard
 * @description Dispatcher mapping a `data-interrupt` payload to its step card.
 *
 * Both apps previously hand-rolled this as an inline ternary chain, and they
 * disagreed: the dashboard routed `payments_*` to a payments card, the widget
 * had no such branch and fell through to the booking card — which then rendered
 * nothing, because the payload has no `phase` it recognises. Routing in one
 * place makes that class of gap impossible.
 *
 * Falls through to the booking card, which is the original flow and the only
 * one whose phases are not prefixed.
 */
import { BookingStepCard } from "./BookingStepCard.js";
import { CrmCollectCard } from "./CrmCollectCard.js";
import { MarketingConsentCard } from "./MarketingConsentCard.js";
import { PaymentsStepCard, isCodePhase } from "./PaymentsStepCard.js";
import { interruptPhase } from "../chat/envelope.js";
export function InterruptCard({ interrupt, brandColor, brandName, onRespond, }) {
    const phase = interruptPhase(interrupt);
    if (phase === "marketing_collect_consent") {
        return (_jsx(MarketingConsentCard, { interrupt: interrupt, brandColor: brandColor, onRespond: onRespond }));
    }
    if (phase?.startsWith("payments_") || isCodePhase(phase)) {
        return (_jsx(PaymentsStepCard, { interrupt: interrupt, brandColor: brandColor, onRespond: onRespond }));
    }
    if (phase === "crm_collect_info") {
        return (_jsx(CrmCollectCard, { interrupt: interrupt, brandColor: brandColor, brandName: brandName, onRespond: onRespond }));
    }
    return _jsx(BookingStepCard, { interrupt: interrupt, brandColor: brandColor, onRespond: onRespond });
}
//# sourceMappingURL=InterruptCard.js.map