import { jsx as _jsx } from "@emotion/react/jsx-runtime";
/**
 * @module artifacts/ArtifactCard
 * @description Dispatcher mapping a `data-artifact` payload to its renderer.
 *
 * Cart actions on commerce cards require a {@link CartSheetProvider} ancestor.
 * Without one the buttons render but silently no-op, so mount the provider
 * around whatever renders the message list.
 */
import { memo } from "react";
import { DiscoveryCard } from "./commerce/DiscoveryCard.js";
import { ComparisonCard } from "./commerce/ComparisonCard.js";
import { RecommendationCard } from "./commerce/RecommendationCard.js";
import { SpotlightCard } from "./commerce/SpotlightCard.js";
import { OrderCard } from "./OrderCard.js";
import { ActionCard } from "./ActionCard.js";
import { BookingCard } from "./BookingCard.js";
import { CrmCard } from "./CrmCard.js";
import { InvoiceCard } from "./InvoiceCard.js";
import { FallbackCard } from "./FallbackCard.js";
export const ArtifactCard = memo(function ArtifactCard({ artifact }) {
    const data = artifact;
    if (!data?.type)
        return null;
    switch (data.type) {
        case "discovery":
            return _jsx(DiscoveryCard, { artifact: data });
        case "comparison":
            return _jsx(ComparisonCard, { artifact: data });
        case "recommendation":
            return _jsx(RecommendationCard, { artifact: data });
        case "spotlight":
            return _jsx(SpotlightCard, { artifact: data });
        case "order":
            return _jsx(OrderCard, { artifact: data });
        case "action":
            return _jsx(ActionCard, { artifact: data });
        case "booking":
            return _jsx(BookingCard, { artifact: data });
        case "crm":
            return _jsx(CrmCard, { artifact: data });
        case "invoice":
            return _jsx(InvoiceCard, { artifact: data });
        default:
            return _jsx(FallbackCard, { artifact: data });
    }
});
//# sourceMappingURL=ArtifactCard.js.map