/**
 * @module chat-ui/VoiceInputButton
 * @description Mic button docked inside the input field — starts a recording.
 *
 * Purely presentational: recording/transcribing/error states are handled by
 * the composer (VoicePanel / VoiceErrorBanner). The caller only renders this
 * when voice is enabled and the browser supports recording, so text input is
 * always the fallback.
 */
export interface VoiceInputButtonProps {
    brandColor: string;
    disabled?: boolean;
    onStart: () => void;
}
export declare function VoiceInputButton({ brandColor, disabled, onStart }: VoiceInputButtonProps): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VoiceInputButton.d.ts.map