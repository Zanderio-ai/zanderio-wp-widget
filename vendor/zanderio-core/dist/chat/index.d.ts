/**
 * @zanderio/core/chat — the chat stream contract.
 *
 * Types and pure transforms only: no React, no HTTP client. Both the widget and
 * the dashboard talk to the same LangGraph AI service, so the message shape,
 * the interrupt envelopes, and the LangGraph→UIMessage mapping have to agree.
 *
 * Transport stays with each host — the widget fetches thread state with an
 * anonymous token, the dashboard with the user's JWT.
 *
 * `ai` (the Vercel AI SDK, for `UIMessage`) is an OPTIONAL peer dependency:
 * only apps importing this path need it.
 *
 * The React components that render these interrupts live at
 * `@zanderio/core/chat-ui`.
 */
export { langGraphToUIMessages, hydratedInterruptMessage } from "./history.js";
export { interruptPhase, unwrapInterrupt } from "./envelope.js";
export { missingVoiceReplies, toWaveform, voiceBars, voiceLevel, voiceReplyProgress, voiceWaveform, } from "./voice.js";
export { followUpSuggestions, hasRenderableContent, isVisibleUserMessage, messageArtifacts, messageImage, messageVoice, pendingInterrupt, streamStatusLabel, visibleMessages, } from "./messages.js";
export { classifyChatError } from "./errors.js";
export type { ChatErrorCopy, ChatErrorKind, ChatErrorState } from "./errors.js";
export { EMAIL_PATTERN, HANDOFF_PROVIDER, canSubmitContactForm, contactFieldError, } from "./contact-form.js";
export type { ChatDataTypes, ChatUIMessage, VoiceAudio, VisitorImage, LangGraphMessage, ThreadState, BookingPhase, BookingOption, BookingQuestion, BookingInterrupt, BookingResume, CrmPhase, CrmField, CrmInterrupt, CrmResume, CrmData, PaymentsPhase, PaymentsInterrupt, PaymentsResume, CodePhase, MarketingPhase, MarketingConsentInterrupt, MarketingResume, } from "./types.js";
export type { Artifact, BookingConfirmation, CommerceItem, ImageMatchLabel } from "./types.js";
//# sourceMappingURL=index.d.ts.map