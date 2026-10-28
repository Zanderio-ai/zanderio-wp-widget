/**
 * @module chat-ui/ContactFields
 * @description The labelled text inputs of the contact-style interrupt cards.
 *
 * Shared by `CrmCollectCard` and `MarketingConsentCard`, so both ask for an
 * address the same way: one input per field, a required mark, and the email
 * hint from `chat/contact-form` once the visitor leaves the field.
 */
import type { CrmField } from "../chat/types.js";
export interface ContactFieldsProps {
    fields: CrmField[];
    values: Record<string, string>;
    onChange: (id: string, value: string) => void;
}
export declare function ContactFields({ fields, values, onChange }: ContactFieldsProps): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ContactFields.d.ts.map