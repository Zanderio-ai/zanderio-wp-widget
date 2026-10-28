/**
 * @module artifacts/CrmCard
 * @description Confirmation card for conversational lead capture.
 *
 * Emitted once by `crm_submit` as `Artifact(type="crm", data=CrmData(...))`
 * right after the write is queued. `status` is always "submitted", never
 * "created": the actual provider write (monday, etc.) happens later in a
 * background job, so there is no record id or url to show yet — this only
 * confirms the visitor's details were taken, not that the CRM record exists.
 */
import type { Artifact } from "../chat/types.js";
export declare function CrmCard({ artifact }: {
    artifact: Artifact;
}): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CrmCard.d.ts.map