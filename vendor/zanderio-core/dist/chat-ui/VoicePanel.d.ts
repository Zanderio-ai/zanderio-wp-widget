/**
 * @module chat-ui/VoicePanel
 * @description Composer overlay shown while recording or transcribing voice.
 *
 * Renders the card only — the host places it where its text input goes and
 * owns the spacing around it.
 *
 * Replaces the text input bar for the two transient voice states:
 *   - recording:    animated waveform + "Listening… Tap to stop" + Cancel + Stop
 *   - transcribing: spinner + "Understanding your question…" (or "Sending
 *                   voice message…" when the recording is sent as one)
 * Both are announced via an aria-live region; the waveform/spinner honor
 * prefers-reduced-motion. With `compact` (narrow screens) the secondary hint is
 * dropped and spacing tightens so nothing overflows.
 */
export interface VoicePanelProps {
    mode: "recording" | "transcribing";
    brandColor: string;
    /** Small-screen sizing (tighter spacing, no "Tap to stop" hint). */
    compact?: boolean;
    /** Stop recording and transcribe (only used in recording mode). */
    onStop?: () => void;
    /** Discard the recording and return to the text input (recording mode). */
    onCancel?: () => void;
    /** The recording is sent as a voice message rather than typed out. */
    voiceMessage?: boolean;
    /**
     * Live mic loudness, newest last, as bar heights 0..1. When present the
     * waveform follows the visitor's voice; without it (no Web Audio) the
     * generic "recording" animation plays instead.
     */
    levels?: number[];
}
export declare function VoicePanel({ mode, brandColor, compact, onStop, onCancel, voiceMessage, levels, }: VoicePanelProps): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VoicePanel.d.ts.map