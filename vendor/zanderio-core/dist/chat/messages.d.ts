/**
 * @module chat/messages
 * @description What a transcript shows, derived from the message list.
 *
 * Every chat surface — the widget and the dashboard playground — renders the
 * same stream, so the rules for which messages are visible, which follow-up
 * suggestions a reply offers, which interrupt is pending and what the
 * "working on it" label says have to agree. They used to be written twice.
 * Pure: no React. Each host draws the result in its own design.
 */
import type { Artifact, ChatDataTypes, ChatUIMessage, VisitorImage, VoiceAudio } from "./types.js";
/**
 * A user message sent purely to resume an interrupt (booking's event-type /
 * location / slot selections) carries `text: ""` — real for the graph, but
 * nothing a shopper should see as an empty bubble in the transcript. A photo
 * sent without words is still a message.
 */
export declare function isVisibleUserMessage(message: ChatUIMessage): boolean;
/** Whether an assistant message has anything to draw. */
export declare function hasRenderableContent(message: ChatUIMessage): boolean;
/** The messages a transcript shows, in order. */
export declare function visibleMessages(messages: ChatUIMessage[]): ChatUIMessage[];
/** The artifact cards attached to a message. */
export declare function messageArtifacts(message: ChatUIMessage): Artifact[];
/** The voice message a message carries, if it is one. */
export declare function messageVoice(message: ChatUIMessage): VoiceAudio | null;
/** The photo a message carries, if it is a photo search. */
export declare function messageImage(message: ChatUIMessage): VisitorImage | null;
/**
 * Follow-up questions to offer under a reply, de-duplicated. None when the
 * reply already continues the flow itself — an interrupt, or an action or
 * booking card.
 */
export declare function followUpSuggestions(message: ChatUIMessage): string[];
/** The human-in-the-loop interrupt the latest assistant turn is waiting on. */
export declare function pendingInterrupt(messages: ChatUIMessage[]): ChatDataTypes["interrupt"] | null;
/**
 * The latest "what's happening" label (e.g. "Searching your products…").
 * Transient — only meaningful while a run is in flight; the AI service never
 * persists these, so a reloaded conversation never has one.
 */
export declare function streamStatusLabel(messages: ChatUIMessage[], isStreaming: boolean): string | null;
//# sourceMappingURL=messages.d.ts.map