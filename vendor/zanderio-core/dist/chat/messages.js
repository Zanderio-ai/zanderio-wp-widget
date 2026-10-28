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
const textOf = (message) => message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
/**
 * A user message sent purely to resume an interrupt (booking's event-type /
 * location / slot selections) carries `text: ""` — real for the graph, but
 * nothing a shopper should see as an empty bubble in the transcript. A photo
 * sent without words is still a message.
 */
export function isVisibleUserMessage(message) {
    return message.role !== "user" || textOf(message).length > 0 || messageImage(message) !== null;
}
/** Whether an assistant message has anything to draw. */
export function hasRenderableContent(message) {
    return message.parts.some((p) => (p.type === "text" && p.text.trim().length > 0) ||
        p.type === "file" ||
        p.type === "data-artifact" ||
        p.type === "data-suggestions" ||
        p.type === "data-audio" ||
        p.type === "data-image");
}
/** The messages a transcript shows, in order. */
export function visibleMessages(messages) {
    return messages.filter((m) => isVisibleUserMessage(m) && (m.role === "user" || hasRenderableContent(m)));
}
/** The artifact cards attached to a message. */
export function messageArtifacts(message) {
    return message.parts.flatMap((p) => (p.type === "data-artifact" ? [p.data] : []));
}
/** The voice message a message carries, if it is one. */
export function messageVoice(message) {
    const part = message.parts.find((p) => p.type === "data-audio");
    return part?.data ?? null;
}
/** The photo a message carries, if it is a photo search. */
export function messageImage(message) {
    const part = message.parts.find((p) => p.type === "data-image");
    return part?.data ?? null;
}
// Cards that already ask the visitor for the next step; suggestion chips next
// to them would compete with it.
const EXCLUSIVE_ARTIFACTS = new Set(["action", "booking"]);
/**
 * Follow-up questions to offer under a reply, de-duplicated. None when the
 * reply already continues the flow itself — an interrupt, or an action or
 * booking card.
 */
export function followUpSuggestions(message) {
    const exclusive = message.parts.some((p) => p.type === "data-interrupt") ||
        messageArtifacts(message).some((a) => EXCLUSIVE_ARTIFACTS.has(a.type));
    if (exclusive)
        return [];
    return [...new Set(message.parts.flatMap((p) => (p.type === "data-suggestions" ? p.data : [])))];
}
/** The human-in-the-loop interrupt the latest assistant turn is waiting on. */
export function pendingInterrupt(messages) {
    const assistant = [...messages].reverse().find((m) => m.role === "assistant");
    const part = assistant?.parts.find((p) => p.type === "data-interrupt");
    return part?.data ?? null;
}
/**
 * The latest "what's happening" label (e.g. "Searching your products…").
 * Transient — only meaningful while a run is in flight; the AI service never
 * persists these, so a reloaded conversation never has one.
 */
export function streamStatusLabel(messages, isStreaming) {
    if (!isStreaming)
        return null;
    const assistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!assistant)
        return null;
    const labels = assistant.parts.filter((p) => p.type === "data-status");
    const latest = labels[labels.length - 1];
    return latest && "data" in latest && typeof latest.data === "string" ? latest.data : null;
}
//# sourceMappingURL=messages.js.map