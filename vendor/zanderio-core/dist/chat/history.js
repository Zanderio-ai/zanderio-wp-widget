/**
 * @module chat/history
 * @description Map LangGraph thread state onto UI messages.
 *
 * Pure transforms only — no transport. Fetching thread state stays with each
 * host, which owns its own HTTP client and auth: the widget uses `fetch` with
 * an anonymous AI-service token, the dashboard an axios instance with the
 * user's JWT. Only the mapping was ever duplicated, and it is the part that
 * has to agree.
 */
function isVoiceAudio(data) {
    const audio = data;
    return !!audio && typeof audio.audio_id === "string" && typeof audio.mime === "string";
}
function isVisitorImage(data) {
    const image = data;
    return !!image && typeof image.image_id === "string" && typeof image.mime === "string";
}
function extractText(content) {
    if (typeof content === "string")
        return content;
    if (!Array.isArray(content))
        return "";
    return content
        .filter((block) => block?.type === "text")
        .map((block) => block.text)
        .join("");
}
/**
 * Convert stored LangGraph messages into the same `UIMessage` shape the live
 * SSE stream produces, so a rehydrated thread renders identically to one that
 * just streamed in.
 *
 * Messages that carry no renderable part are dropped rather than rendered
 * empty — a tool-only turn should leave no bubble behind.
 */
export function langGraphToUIMessages(messages) {
    const out = [];
    for (const msg of messages) {
        const role = msg.type === "human" || msg.role === "human"
            ? "user"
            : msg.type === "ai" || msg.role === "ai"
                ? "assistant"
                : null;
        if (!role)
            continue;
        const parts = [];
        for (const part of msg.parts ?? []) {
            if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
                parts.push({ type: "text", text: part.text });
            }
            else if (part.type === "data-artifact" && part.data) {
                parts.push({ type: "data-artifact", data: part.data });
            }
            else if (part.type === "data-suggestions" &&
                Array.isArray(part.data) &&
                part.data.every((item) => typeof item === "string")) {
                parts.push({ type: "data-suggestions", data: part.data });
            }
            else if (part.type === "data-audio" && isVoiceAudio(part.data)) {
                parts.push({
                    type: "data-audio",
                    data: { ...part.data, duration_ms: Number(part.data.duration_ms) || 0 },
                });
            }
            else if (part.type === "data-image" && isVisitorImage(part.data)) {
                parts.push({
                    type: "data-image",
                    data: { image_id: part.data.image_id, mime: part.data.mime },
                });
            }
        }
        if (parts.length === 0) {
            const text = extractText(msg.content).trim();
            if (text)
                parts.push({ type: "text", text });
        }
        if (parts.length === 0)
            continue;
        out.push({
            id: msg.id || crypto.randomUUID(),
            role,
            parts,
        });
    }
    return out;
}
/**
 * Synthesize a trailing assistant message carrying the hydrated interrupt as
 * a `data-interrupt` part — the same shape the live SSE stream produces —
 * so a reopened thread re-renders its in-progress booking step card without
 * any change to how callers derive "the current interrupt" from `messages`.
 */
export function hydratedInterruptMessage(interrupt) {
    if (!interrupt)
        return null;
    const id = interrupt.id ?? "interrupt-hydrated";
    return {
        id: `hydrated-${id}`,
        role: "assistant",
        parts: [{ type: "data-interrupt", id, data: interrupt }],
    };
}
//# sourceMappingURL=history.js.map