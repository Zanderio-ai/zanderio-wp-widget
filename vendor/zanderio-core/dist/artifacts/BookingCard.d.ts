/**
 * @module artifacts/BookingCard
 * @description Durable confirmation card for a completed booking.
 *
 * Emitted once by the AI booking-confirmation node as
 * `Artifact(type="booking", data=BookingData(...))` after Calendly confirms
 * the invitee. Reads `artifact.data.{provider,event_type_name,start_label,
 * timezone,duration_label,status,reschedule_url,cancel_url}`. The interactive
 * step-by-step flow (type/location/slot/info/review) is rendered separately, inline,
 * by each app's `BookingStepCard`; this card only ever shows the final result.
 */
import type { Artifact } from "../chat/types.js";
export declare function BookingCard({ artifact }: {
    artifact: Artifact;
}): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BookingCard.d.ts.map