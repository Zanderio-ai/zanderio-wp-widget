/**
 * @module artifacts/commerce/RecommendationCard
 * @description Decision-stage, cart-led ranked list. Top pick gets an accent
 * rail + full Add-to-cart; the rest keep View + an icon cart. Reads
 * `artifact.data.items`. Items may carry agent-written `badge`/`pitch`.
 */
import type { Artifact } from "../../chat/types.js";
export declare function RecommendationCard({ artifact }: {
    artifact: Artifact;
}): import("@emotion/react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=RecommendationCard.d.ts.map