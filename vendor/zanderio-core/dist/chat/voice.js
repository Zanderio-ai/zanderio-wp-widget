/**
 * @module chat/voice
 * @description Pure voice-to-voice helpers over the chat contract.
 *
 * Shared by every surface that records or shows voice messages — the widget
 * and the dashboard (playground and the Conversations tab) — so a voice turn
 * reads and draws the same everywhere. No React and no audio: recording and
 * playback live in `@zanderio/core/chat-ui`.
 */
/**
 * Assistant replies that answer a voice message but have no voice of their
 * own yet — the spoken reply failed, or the page was reloaded before it
 * arrived. Voice-to-voice never shows these as text; they are spoken again.
 */
export function missingVoiceReplies(messages) {
    const missing = [];
    let answeringVoice = false;
    for (const message of messages) {
        const hasVoice = message.parts.some((p) => p.type === "data-audio");
        if (message.role === "user") {
            answeringVoice = hasVoice;
        }
        else if (message.role === "assistant" && answeringVoice && !hasVoice) {
            const hasWords = message.parts.some((p) => p.type === "text" && p.text.trim().length > 0);
            if (hasWords)
                missing.push(message.id);
        }
    }
    return missing;
}
/**
 * Bar heights (0.25–1) for a voice message's waveform.
 *
 * Stylised, not measured: a bubble from history hasn't downloaded its audio
 * yet, so there is nothing to analyse. The heights are derived from the audio
 * id instead, which gives every message its own shape that stays the same on
 * every render and reload.
 */
export function voiceWaveform(audioId, bars = 32) {
    let seed = 2166136261;
    for (let i = 0; i < audioId.length; i++) {
        seed = Math.imul(seed ^ audioId.charCodeAt(i), 16777619);
    }
    const heights = [];
    let previous = 0.6;
    for (let i = 0; i < bars; i++) {
        seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9;
        const random = ((seed >>> 0) % 1000) / 1000;
        // Lean on the previous bar so the shape rolls like speech instead of
        // jumping like noise.
        previous = previous * 0.45 + random * 0.55;
        heights.push(0.25 + previous * 0.75);
    }
    return heights;
}
/**
 * Bar heights (0–1) for a voice bubble: the recording's real loudness when
 * the message carries a waveform, otherwise the generated shape.
 */
export function voiceBars(audio, bars = 32) {
    const stored = audio.waveform;
    if (!stored || stored.length === 0)
        return voiceWaveform(audio.audio_id, bars);
    const heights = [];
    for (let i = 0; i < bars; i++) {
        const from = Math.floor((i * stored.length) / bars);
        const to = Math.max(from + 1, Math.floor(((i + 1) * stored.length) / bars));
        let peak = 0;
        for (let j = from; j < to && j < stored.length; j++)
            peak = Math.max(peak, stored[j] ?? 0);
        // A floor keeps silent stretches visible as a thin line of bars.
        heights.push(Math.max(0.12, Math.min(1, peak / 127)));
    }
    return heights;
}
// ── Recording ────────────────────────────────────────────────────────────────
// The same mic-volume readings that drive silence detection also draw the
// waveform: live bars while recording, and the shape saved with a voice
// message (64 loudness values, 0–127 — the format WhatsApp uses).
const WAVEFORM_POINTS = 64;
/**
 * A mic loudness reading (RMS, 0..1) as a bar height (0..1). Speech sits low
 * in the RMS range; the square root spreads it out so quiet talking still
 * moves the bars and loud talking doesn't flatten them.
 */
export function voiceLevel(rms) {
    return Math.min(1, Math.sqrt(rms) * 1.8);
}
/** Reduce a recording's loudness readings to its stored waveform. */
export function toWaveform(levels, points = WAVEFORM_POINTS) {
    if (levels.length === 0)
        return undefined;
    const waveform = [];
    for (let i = 0; i < points; i++) {
        const from = Math.floor((i * levels.length) / points);
        const to = Math.max(from + 1, Math.floor(((i + 1) * levels.length) / points));
        let peak = 0;
        for (let j = from; j < to && j < levels.length; j++)
            peak = Math.max(peak, levels[j] ?? 0);
        waveform.push(Math.round(voiceLevel(peak) * 127));
    }
    return waveform;
}
/**
 * How a transcript treats replies while their voice is being made.
 * `awaitingId` is the live reply whose text stays hidden until its voice
 * arrives (voice-to-voice never shows the text in its place); `onItsWay` is
 * whether any voice reply is still being made, for the "Recording a voice
 * message…" indicator.
 */
export function voiceReplyProgress(messages, voiceReplyPending, voiceReplyStatus) {
    const last = messages[messages.length - 1];
    return {
        awaitingId: voiceReplyPending && last?.role === "assistant" ? last.id : null,
        onItsWay: voiceReplyPending || Object.values(voiceReplyStatus).includes("pending"),
    };
}
//# sourceMappingURL=voice.js.map