/**
 * @module chat/types
 * @description The chat stream contract shared by the widget and the dashboard.
 *
 * These mirror the AI service's Python schemas and are the frontend half of a
 * cross-language contract. They existed twice before (widget
 * `core/chat-types.ts`, dashboard `shared/chat/history.ts`) and drifted: the
 * dashboard had the whole payments flow typed while the widget had none of it,
 * so the widget could not render a payments interrupt at all.
 *
 * Backend counterparts, worth checking when any of this changes:
 *   ai/app/modules/booking/schemas.py::InterruptEnvelope
 *   ai/app/modules/crm/nodes.py::crm_collect
 *   ai/app/modules/payments/nodes.py
 *   ai/app/contracts/artifacts.py::CrmData
 *   ai/app/contracts/artifacts.py::CarouselItem, ProductData (match_label)
 *   ai/app/contracts/parts.py (data-audio, data-image)
 */
import type { UIMessage } from "ai";
/** A rich content block rendered below an assistant turn (product cards, etc.). */
export interface Artifact {
    type: string;
    title?: string;
    subtitle?: string;
    media?: unknown;
    target?: unknown;
    /**
     * Per-type payload. Left `unknown` on purpose: each renderer narrows it
     * itself, and the backend contract is still evolving. Narrowing this into a
     * discriminated union is a worthwhile follow-up, not a prerequisite.
     */
    data?: unknown;
}
/**
 * `type: "booking"` payload — emitted once by the AI booking-confirmation node
 * after the provider confirms the invitee.
 */
export interface BookingConfirmation {
    provider: string;
    event_type_name: string;
    start_time: string;
    start_label: string;
    timezone: string;
    duration_label?: string | null;
    status: "confirmed" | "canceled";
    reschedule_url?: string | null;
    cancel_url?: string | null;
}
/**
 * A catalog product as it appears in commerce artifacts. Every field comes
 * straight from the merchant's catalog except `badge` and `pitch`, which are
 * agent-generated and always optional.
 */
export interface CommerceItem {
    doc_id?: string;
    product_id?: string;
    platform?: string;
    default_variant_id?: string;
    variants?: Array<{
        id: string;
        options?: Array<{
            name?: string;
            value?: string;
        }>;
        in_stock?: boolean;
        price?: number | null;
    }>;
    title?: string;
    image?: string;
    brand?: string;
    product_type?: string;
    price?: number | null;
    price_max?: number | null;
    compare_at_price?: number | null;
    currency?: string;
    in_stock?: boolean;
    on_sale?: boolean;
    discount_pct?: number;
    url?: string;
    colour_swatches?: Array<{
        value: string;
        hex?: string;
        in_stock?: boolean;
    }>;
    options?: unknown[];
    badge?: string;
    pitch?: string;
    /**
     * How a product found by image search relates to the visitor's photo:
     * "similar" when one of its catalog images closely matches the photo,
     * "related" otherwise. Assigned by the AI service's code from retrieval
     * scores, never by the model. Absent on cards not from an image search.
     * The same field rides on a spotlight artifact's data.
     */
    match_label?: ImageMatchLabel;
}
/** See `CommerceItem.match_label`. */
export type ImageMatchLabel = "exact" | "similar" | "related";
/** A stored voice message — the visitor's recording or the spoken reply. */
export interface VoiceAudio {
    audio_id: string;
    mime: string;
    duration_ms: number;
    /**
     * Loudness across the recording — 64 values, 0–127. Present on visitor
     * recordings; a message without it draws a generated shape instead.
     */
    waveform?: number[] | null;
    /** ISO time the visitor's recording was sent, or the reply was ready. */
    created_at?: string | null;
}
/**
 * A photo the visitor uploaded for image search. Like voice audio, the bytes
 * live in object storage and are read through the AI service's authenticated
 * image route by `image_id`; no URL is ever part of the message.
 */
export interface VisitorImage {
    image_id: string;
    mime: string;
}
/** Custom data-part payloads carried in the stream. */
export type ChatDataTypes = {
    artifact: Artifact;
    /** Marks a message as a voice message; rendered as a playable bubble. */
    audio: VoiceAudio;
    /** The photo a visitor sent with an image-search message. */
    image: VisitorImage;
    suggestions: string[];
    interrupt: {
        id: string | null;
        value: unknown;
    };
    /** Transient "what's happening" label — never persisted, live-stream only. */
    status: string;
};
export type ChatUIMessage = UIMessage<never, ChatDataTypes>;
export type BookingPhase = "select_event_type" | "select_location" | "select_slot" | "collect_info" | "review";
export interface BookingOption {
    id?: string;
    name?: string;
    description?: string | null;
    duration?: string | null;
    start_time?: string;
    label?: string;
    date_label?: string;
    time_label?: string;
    kind?: string;
    location?: string | null;
    requires_input?: boolean;
}
export interface BookingQuestion {
    id: string;
    name: string;
    type: string;
    answer_choices?: string[];
    include_other?: boolean;
}
export interface BookingInterrupt {
    phase: BookingPhase;
    provider: string;
    timezone: string;
    options?: BookingOption[];
    event_type?: {
        id: string;
        name: string;
    } | null;
    start_time?: string;
    start_label?: string;
    required?: string[];
    contact?: {
        name: string;
        email: string;
    } | null;
    location?: BookingOption | null;
    questions?: BookingQuestion[];
    notice?: string | null;
}
/** Sent back via `sendMessage({ text: "" }, { body: { resume } })`. */
export type BookingResume = {
    action: "cancel" | "back";
} | Record<string, unknown>;
export type CrmPhase = "crm_collect_info";
export interface CrmField {
    id: string;
    label: string;
    type: string;
    /** Must be filled before the form can be sent. Sent by the AI for the handoff form. */
    required?: boolean;
}
export interface CrmInterrupt {
    phase: CrmPhase;
    provider: string;
    fields: CrmField[];
}
/** Sent back via `sendMessage({ text: "" }, { body: { resume } })`. */
export type CrmResume = {
    action: "cancel";
} | {
    values: Record<string, string>;
};
/**
 * `type: "crm"` artifact payload. `status` is always "submitted", never
 * "created" — the provider write happens later in a queued job, so at
 * artifact-emission time there is no record id or url yet.
 */
export interface CrmData {
    provider: string;
    status: "submitted";
    fields_collected: string[];
}
export type PaymentsPhase = "payments_collect_email" | "payments_collect_code";
/**
 * The emailed one-time-code step. OTP lives in the AI service's shared
 * identity module, so every flow that verifies an address sends this same
 * prompt and takes the same `{ code }` back; `PaymentsStepCard` renders it.
 */
export type CodePhase = "payments_collect_code" | "marketing_collect_code";
export interface PaymentsInterrupt {
    phase: PaymentsPhase | CodePhase;
    /** Masked ("a***@b.com") on the code step so the visitor can confirm where it went. */
    sent_to?: string;
    /** Code lifetime in seconds, for a countdown. */
    expires_in?: number;
    /** Present only after a wrong code. */
    attempts_left?: number;
}
/** Sent back via `sendMessage({ text: "" }, { body: { resume } })`. */
export type PaymentsResume = {
    action: "cancel";
} | {
    email: string;
} | {
    code: string;
};
export type MarketingPhase = "marketing_collect_consent" | "marketing_collect_code";
export interface MarketingConsentInterrupt {
    phase: "marketing_collect_consent";
    provider: string;
    list_name?: string;
    /**
     * The agreement wording. Rendered verbatim, because the service stores this
     * exact string as the record of what the visitor agreed to.
     */
    consent_text: string;
    fields: CrmField[];
}
/** Sent back via `sendMessage({ text: "" }, { body: { resume } })`. */
export type MarketingResume = {
    action: "cancel";
} | {
    values: Record<string, string | boolean>;
} | {
    code: string;
};
export interface LangGraphMessage {
    id?: string;
    type?: string;
    role?: string;
    content?: string | Array<{
        type?: string;
        text?: string;
        image_url?: {
            url?: string;
        };
    }>;
    parts?: Array<{
        type?: string;
        text?: string;
        data?: unknown;
    }>;
}
export interface ThreadState {
    status?: "open" | "closed";
    values?: {
        messages?: LangGraphMessage[];
    };
    /** Pending HITL interrupt (booking, etc.) if the thread was left mid-flow. */
    interrupt?: {
        id: string | null;
        value: unknown;
    } | null;
}
//# sourceMappingURL=types.d.ts.map