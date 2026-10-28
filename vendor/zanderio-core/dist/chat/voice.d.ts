/**
 * @module chat/voice
 * @description Pure voice-to-voice helpers over the chat contract.
 *
 * Shared by every surface that records or shows voice messages — the widget
 * and the dashboard (playground and the Conversations tab) — so a voice turn
 * reads and draws the same everywhere. No React and no audio: recording and
 * playback live in `@zanderio/core/chat-ui`.
 */
import type { ChatUIMessage, VoiceAudio } from "./types.js";
/**
 * Assistant replies that answer a voice message but have no voice of their
 * own yet — the spoken reply failed, or the page was reloaded before it
 * arrived. Voice-to-voice never shows these as text; they are spoken again.
 */
export declare function missingVoiceReplies(messages: ChatUIMessage[]): string[];
/**
 * Bar heights (0.25–1) for a voice message's waveform.
 *
 * Stylised, not measured: a bubble from history hasn't downloaded its audio
 * yet, so there is nothing to analyse. The heights are derived from the audio
 * id instead, which gives every message its own shape that stays the same on
 * every render and reload.
 */
export declare function voiceWaveform(audioId: string, bars?: number): number[];
/**
 * Bar heights (0–1) for a voice bubble: the recording's real loudness when
 * the message carries a waveform, otherwise the generated shape.
 */
export declare function voiceBars(audio: VoiceAudio, bars?: number): number[];
/**
 * A mic loudness reading (RMS, 0..1) as a bar height (0..1). Speech sits low
 * in the RMS range; the square root spreads it out so quiet talking still
 * moves the bars and loud talking doesn't flatten them.
 */
export declare function voiceLevel(rms: number): number;
/** Reduce a recording's loudness readings to its stored waveform. */
export declare function toWaveform(levels: number[], points?: number): number[] | undefined;
/**
 * How a transcript treats replies while their voice is being made.
 * `awaitingId` is the live reply whose text stays hidden until its voice
 * arrives (voice-to-voice never shows the text in its place); `onItsWay` is
 * whether any voice reply is still being made, for the "Recording a voice
 * message…" indicator.
 */
export declare function voiceReplyProgress(messages: ChatUIMessage[], voiceReplyPending: boolean, voiceReplyStatus: Record<string, "pending" | "failed">): {
    awaitingId: string | null;
    onItsWay: boolean;
};
//# sourceMappingURL=voice.d.ts.map