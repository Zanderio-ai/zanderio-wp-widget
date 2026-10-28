/**
 * When the contact card (`crm_collect_info`) can be sent.
 *
 * Two forms share the card. The CRM lead form marks nothing required and only
 * needs some way to reach the visitor, so any filled field will do. The AI's
 * "talk to a person" handoff form (provider `handoff`) marks the fields the
 * team needs as `required`, and the card waits for all of them. Either way, an
 * email field with text in it must look like an address: the team would only
 * fail to reach a typo.
 *
 * Pure, like the rest of this entry point. Both the widget and the dashboard
 * use these through `CrmCollectCard`.
 */
import type { CrmField } from "./types.js";
/** Loose on purpose: catches typos, never rejects a real address. */
export declare const EMAIL_PATTERN: RegExp;
/** The handoff form's provider tag, used to give it its own heading. */
export declare const HANDOFF_PROVIDER = "handoff";
/** Why a field's current value can't be sent, or null when it's fine. */
export declare function contactFieldError(field: CrmField, value: string | undefined): string | null;
/** Whether the card's Continue button may send these values. */
export declare function canSubmitContactForm(fields: CrmField[], values: Record<string, string>): boolean;
//# sourceMappingURL=contact-form.d.ts.map