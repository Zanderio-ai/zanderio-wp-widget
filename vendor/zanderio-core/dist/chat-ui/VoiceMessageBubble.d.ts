/**
 * @module chat-ui/VoiceMessageBubble
 * @description A voice message in the transcript — play/pause, a waveform
 * that fills as it plays, and the length.
 *
 * Used for both sides of a voice-to-voice turn: the visitor's recording and
 * the assistant's spoken reply, in the widget and in the dashboard. The length
 * comes from the message itself, not the audio element — recordings straight
 * from MediaRecorder carry no duration metadata, so the element can't be
 * trusted to report one.
 *
 * Playback goes through `voicePlayer`, so the host must have given it a loader
 * (`voicePlayer.setLoader`). Surfaces read the host's `--z-bg-muted` /
 * `--z-text` variables, with the tokens as fallback.
 */
import type { VoiceAudio } from "../chat/types.js";
export interface VoiceMessageBubbleProps {
    audio: VoiceAudio;
    /** Assistant messages sit on a neutral surface; the visitor's on the brand colour. */
    isBot: boolean;
    brandColor: string;
}
export declare function VoiceMessageBubble({ audio, isBot, brandColor }: VoiceMessageBubbleProps): import("@emotion/react/jsx-runtime").JSX.Element;
/**
 * Stands in for a voice reply that could not be created. Voice-to-voice
 * answers a voice message with a voice message, so the written answer is not
 * shown in its place — the visitor asks for the voice again instead.
 */
export interface VoiceReplyFailedProps {
    brandColor: string;
    onRetry: () => void;
}
export declare function VoiceReplyFailed({ brandColor, onRetry }: VoiceReplyFailedProps): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VoiceMessageBubble.d.ts.map