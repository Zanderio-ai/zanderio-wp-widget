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

import { useSyncExternalStore } from "react";

/** Fetches a stored voice message's bytes, authenticated however the host does it. */
export type VoiceAudioLoader = (audioId: string) => Promise<Blob>;

// ── Audio bytes ──────────────────────────────────────────────────────────────

// Object URLs hold their audio in memory until revoked, so only the most
// recently used few are kept; an evicted message is simply fetched again.
const MAX_CACHED = 20;
const urls = new Map<string, Promise<string>>();
let loader: VoiceAudioLoader | null = null;

function remember(audioId: string, url: Promise<string>): void {
  // Re-inserting moves the entry to the newest end of the Map's order.
  urls.delete(audioId);
  urls.set(audioId, url);
  for (const id of urls.keys()) {
    if (urls.size <= MAX_CACHED) break;
    // Never revoke what the player is holding right now.
    if (id === audioId || id === state.audioId) continue;
    void urls.get(id)?.then((stale) => URL.revokeObjectURL(stale), () => {});
    urls.delete(id);
  }
}

/** Register a locally recorded blob so its bubble plays without a fetch. */
export function primeVoiceAudio(audioId: string, blob: Blob): void {
  remember(audioId, Promise.resolve(URL.createObjectURL(blob)));
}

function loadVoiceAudio(audioId: string): Promise<string> {
  const cached = urls.get(audioId);
  if (cached) {
    remember(audioId, cached);
    return cached;
  }
  if (!loader) return Promise.reject(new Error("voice audio loader not set"));

  const pending = loader(audioId).then((blob) => URL.createObjectURL(blob));
  // A failed load must not poison the cache — the next tap retries.
  pending.catch(() => urls.delete(audioId));
  remember(audioId, pending);
  return pending;
}

// ── Player ───────────────────────────────────────────────────────────────────

export interface VoicePlayerState {
  /** The message currently loaded into the player, if any. */
  audioId: string | null;
  status: "idle" | "loading" | "playing" | "paused" | "error";
  positionMs: number;
}

const IDLE: VoicePlayerState = { audioId: null, status: "idle", positionMs: 0 };
// Shortest valid WAV — played inside the mic tap to unlock the element.
const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

let state: VoicePlayerState = IDLE;
let element: HTMLAudioElement | null = null;
// Bumped on every play/stop so a slow load can't start after a newer request.
let generation = 0;
const listeners = new Set<() => void>();

function set(next: VoicePlayerState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function player(): HTMLAudioElement | null {
  if (element || typeof Audio === "undefined") return element;
  element = new Audio();
  element.preload = "auto";
  element.addEventListener("timeupdate", () => {
    if (state.status === "playing") {
      set({ ...state, positionMs: Math.round((element?.currentTime ?? 0) * 1000) });
    }
  });
  element.addEventListener("ended", () => {
    if (state.audioId) set({ ...state, status: "paused", positionMs: 0 });
  });
  return element;
}

export const voicePlayer = {
  /** How the host fetches audio. Set it before any bubble can be played. */
  setLoader(next: VoiceAudioLoader): void {
    loader = next;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): VoicePlayerState {
    return state;
  },

  /** Must run synchronously inside a user gesture (see module docs). */
  unlock(): void {
    const audio = player();
    if (!audio || state.status === "playing") return;
    audio.src = SILENCE;
    void audio.play().catch(() => {});
  },

  /**
   * Play a voice message from the start. Resolves false when the browser
   * refused (autoplay blocked) — the bubble then waits for a tap.
   */
  async play(audioId: string): Promise<boolean> {
    const audio = player();
    if (!audio) return false;
    const mine = ++generation;
    audio.pause();
    set({ audioId, status: "loading", positionMs: 0 });
    try {
      const url = await loadVoiceAudio(audioId);
      if (mine !== generation) return false;
      audio.src = url;
      audio.currentTime = 0;
      await audio.play();
      if (mine !== generation) return false;
      set({ audioId, status: "playing", positionMs: 0 });
      return true;
    } catch (err) {
      if (mine !== generation) return false;
      // NotAllowedError = autoplay refused: the audio is fine, it needs a tap.
      const blocked = err instanceof DOMException && err.name === "NotAllowedError";
      set({ audioId, status: blocked ? "paused" : "error", positionMs: 0 });
      return false;
    }
  },

  /** Play/pause for a bubble's button. */
  toggle(audioId: string): void {
    const audio = player();
    if (!audio) return;
    if (state.audioId !== audioId || state.status === "error") {
      void voicePlayer.play(audioId);
    } else if (state.status === "playing") {
      audio.pause();
      set({ ...state, status: "paused" });
    } else if (state.status === "paused") {
      void audio
        .play()
        .then(() => set({ ...state, status: "playing" }))
        .catch(() => {});
    }
  },

  stop(): void {
    generation += 1;
    element?.pause();
    if (state !== IDLE) set(IDLE);
  },
};

/** Player state as seen by one bubble — idle unless it is the loaded message. */
export function useVoicePlayback(audioId: string): VoicePlayerState {
  const current = useSyncExternalStore(
    voicePlayer.subscribe,
    voicePlayer.getState,
    voicePlayer.getState,
  );
  return current.audioId === audioId ? current : IDLE;
}
