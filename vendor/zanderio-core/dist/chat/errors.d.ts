/**
 * @module chat/errors
 * @description Classify a chat stream error into what the visitor is shown.
 *
 * The AI service returns RFC 9457-style JSON bodies for failures, but the AI
 * SDK transport throws the raw response text as the error message. This parses
 * that text (and common network failures) so the UI can show the right status
 * banner and recovery action.
 *
 * The rules are shared; the words are the host's. The defaults speak to a
 * shopper; the dashboard playground passes its own copy for a merchant testing
 * their assistant.
 */
export type ChatErrorKind = "UNAUTHORIZED" | "NETWORK" | "CONVERSATION_CLOSED" | "PHOTO_NOT_SENT" | "UNKNOWN";
export interface ChatErrorState {
    kind: ChatErrorKind;
    severity: "error" | "warning" | "info";
    title: string;
    message: string;
}
export type ChatErrorCopy = Partial<Record<ChatErrorKind, {
    title: string;
    message: string;
}>>;
export declare function classifyChatError(error: unknown, copy?: ChatErrorCopy): ChatErrorState;
//# sourceMappingURL=errors.d.ts.map