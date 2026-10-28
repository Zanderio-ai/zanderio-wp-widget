/**
 * @module chat-ui/MarketingConsentCard
 * @description Inline card for the marketing opt-in flow.
 *
 * Renders the `marketing_collect_consent` interrupt: an address and an
 * explicit agreement. The emailed code that follows is `PaymentsStepCard`'s
 * code step. A sibling of `CrmCollectCard` rather than a branch on it: the CRM
 * form collects whichever fields a merchant's board has, while this one asks a
 * fixed question that carries a legal obligation. Both draw their inputs with
 * `ContactFields`.
 *
 * Two things here are contract, not styling. The checkbox starts unticked,
 * because a pre-ticked box is not valid consent under GDPR. And `consent_text`
 * renders verbatim, because the service stores that exact string as the record
 * of what the visitor agreed to.
 */
import type { MarketingResume } from "../chat/types.js";
export interface MarketingConsentCardProps {
    interrupt: unknown;
    brandColor: string;
    onRespond: (response: MarketingResume) => void;
}
export declare function MarketingConsentCard({ interrupt, brandColor, onRespond }: MarketingConsentCardProps): import("@emotion/react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=MarketingConsentCard.d.ts.map