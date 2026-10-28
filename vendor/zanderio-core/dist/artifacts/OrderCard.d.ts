/**
 * @module artifacts/OrderCard
 * @description Order-status artifact — line items, total, tracking. Reads
 * `artifact.data.{order_id,status,items,total,currency,tracking_*,carrier,...}`.
 */
import type { Artifact } from "../chat/types.js";
export declare function OrderCard({ artifact }: {
    artifact: Artifact;
}): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=OrderCard.d.ts.map