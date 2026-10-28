/**
 * @module chat-ui/use-voice-input
 * @description Mic recording + transcription for voice input.
 *
 * Records via MediaRecorder, uploads to the AI service's speech endpoints, and
 * hands the result back via `onTranscript` / `onVoiceMessage` — the caller
 * decides what to do with it (this hook never sends a chat message itself).
 * Never throws: any failure surfaces as `state: "error"` so the existing text
 * input keeps working regardless of mic/network issues.
 *
 * The upload is the host's job, because the hosts authenticate differently
 * (the widget uses `fetch` with an anonymous token, the dashboard its axios
 * client, which also renews an expired session), so each passes a
 * {@link VoiceUploader}.
 *
 * Silence handling: a recording that captured no speech (accidental tap, or
 * holding the mic without speaking) is never sent. We run lightweight
 * voice-activity detection (mic volume via an AnalyserNode) during recording
 * and drop the audio locally if it never crossed the speech threshold — this
 * avoids a wasted API call and, importantly, prevents Whisper's known
 * tendency to hallucinate a phrase (e.g. "Thank you.") from silence. The
 * empty-transcript check remains as a server-side safety net.
 *
 * Two modes share the recorder. "text" (voice-to-text) keeps nothing: the
 * transcript becomes a typed message. "voice" (voice-to-voice) stores the
 * recording against the conversation and hands back both the audio and its
 * transcript, so the caller can send a voice message.
 */
import type { VoiceAudio } from "../chat/types.js";
export type VoiceInputState = "idle" | "recording" | "transcribing" | "error";
/** A stored recording, ready to send as a voice message. */
export interface RecordedVoiceMessage {
    audio: VoiceAudio;
    blob: Blob;
    transcript: string;
}
/**
 * POSTs `form` to `{AI}/v1/speech/{path}` with the host's auth. Resolves with
 * the status and parsed body for ANY HTTP status (the hook reads 422 itself);
 * rejects only on a network failure or when `signal` aborts.
 */
export type VoiceUploader = (path: "transcriptions" | "voice-messages", form: FormData, signal: AbortSignal) => Promise<{
    status: number;
    data: unknown;
}>;
export interface UseVoiceInputArgs {
    upload: VoiceUploader;
    onTranscript: (text: string) => void;
    /** "voice" stores the recording and reports it via `onVoiceMessage`. */
    mode?: "text" | "voice";
    /** Conversation a voice message is stored under (voice mode only). */
    conversationId?: string | null;
    onVoiceMessage?: (message: RecordedVoiceMessage) => void;
}
export declare function useVoiceInput({ upload, onTranscript, mode, conversationId, onVoiceMessage, }: UseVoiceInputArgs): {
    state: VoiceInputState;
    errorMessage: string | null;
    supported: boolean;
    start: () => Promise<void>;
    stop: () => void;
    cancel: () => void;
    reset: () => void;
    levels: number[];
};
//# sourceMappingURL=use-voice-input.d.ts.map