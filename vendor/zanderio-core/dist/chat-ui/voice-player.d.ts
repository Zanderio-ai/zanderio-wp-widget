/**
 * @module chat-ui/voice-player
 * @description Loads voice message audio and plays one message at a time.
 *
 * Voice messages are private: the bytes come from the AI service behind the
 * same bearer token as chat, so an `<audio src>` can't fetch them — they are
 * fetched to a blob and played from an object URL. Fetching is the host's
 * job, because the hosts authenticate differently (the widget uses `fetch`
 * with an anonymous token, the dashboard its axios client), so each host
 * hands the player a {@link VoiceAudioLoader} with `voicePlayer.setLoader`.
 * A visitor's own recording is primed from the blob they just recorded, so it
 * never round-trips.
 *
 * Playback goes through ONE shared audio element. That gives WhatsApp's
 * behaviour (starting a message stops the previous one) and is what makes
 * autoplay work on iOS Safari: an element the visitor has started once, inside
 * a tap, may be started again later from code. `unlock()` is that first start
 * — call it synchronously from the mic tap.
 */
/** Fetches a stored voice message's bytes, authenticated however the host does it. */
export type VoiceAudioLoader = (audioId: string) => Promise<Blob>;
/** Register a locally recorded blob so its bubble plays without a fetch. */
export declare function primeVoiceAudio(audioId: string, blob: Blob): void;
export interface VoicePlayerState {
    /** The message currently loaded into the player, if any. */
    audioId: string | null;
    status: "idle" | "loading" | "playing" | "paused" | "error";
    positionMs: number;
}
export declare const voicePlayer: {
    /** How the host fetches audio. Set it before any bubble can be played. */
    setLoader(next: VoiceAudioLoader): void;
    subscribe(listener: () => void): () => void;
    getState(): VoicePlayerState;
    /** Must run synchronously inside a user gesture (see module docs). */
    unlock(): void;
    /**
     * Play a voice message from the start. Resolves false when the browser
     * refused (autoplay blocked) — the bubble then waits for a tap.
     */
    play(audioId: string): Promise<boolean>;
    /** Play/pause for a bubble's button. */
    toggle(audioId: string): void;
    stop(): void;
};
/** Player state as seen by one bubble — idle unless it is the loaded message. */
export declare function useVoicePlayback(audioId: string): VoicePlayerState;
//# sourceMappingURL=voice-player.d.ts.map