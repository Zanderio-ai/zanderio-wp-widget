/**
 * @module core/use-voice-input
 * @description Mic recording + transcription for voice input.
 *
 * Records via MediaRecorder, uploads to the backend's speech transcription
 * endpoint, and hands the resulting text back via `onTranscript` — the
 * caller decides what to do with it (this hook never sends a chat message
 * itself). Never throws: any failure surfaces as `state: "error"` so the
 * existing text input keeps working regardless of mic/network issues.
 *
 * Silence handling: a recording that captured no speech (accidental tap, or
 * holding the mic without speaking) is never sent. We run lightweight
 * voice-activity detection (mic volume via an AnalyserNode) during recording
 * and drop the audio locally if it never crossed the speech threshold — this
 * avoids a wasted API call and, importantly, prevents Whisper's known
 * tendency to hallucinate a phrase (e.g. "Thank you.") from silence. The
 * empty-transcript check remains as a server-side safety net.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/config/env";

export type VoiceInputState = "idle" | "recording" | "transcribing" | "error";

const MAX_RECORDING_MS = 60_000;
// Below this, a stop is treated as an accidental tap: discard silently, no error.
const MIN_RECORDING_MS = 500;
// Normalized RMS amplitude a frame must exceed to count as speech (0..1).
// Low enough to catch quiet talking; true silence/ambient hum stays under it.
const SPEECH_RMS_THRESHOLD = 0.015;
// Frames above the threshold before the recording counts as containing speech.
// One loud frame (a tap, click, or breath) must NOT trip the detector — real
// speech holds energy across many frames. At ~60fps this is roughly 150ms of
// cumulative voiced audio.
const SPEECH_FRAMES_REQUIRED = 9;
const CANDIDATE_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

interface UseVoiceInputArgs {
  token: string | null;
  onTranscript: (text: string) => void;
}

export function useVoiceInput({ token, onTranscript }: UseVoiceInputArgs) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Set when the user cancels a recording — tells the recorder's onstop handler
  // to discard the audio instead of transcribing it.
  const cancelledRef = useRef(false);
  // Voice-activity detection state.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const spokeRef = useRef(false);
  const vadActiveRef = useRef(false);
  const startedAtRef = useRef(0);

  const teardownVad = useCallback(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimeout(stopTimerRef.current);
      abortControllerRef.current?.abort();
      teardownVad();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [teardownVad]);

  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined" &&
    (typeof window === "undefined" || window.isSecureContext !== false);

  const finish = useCallback(
    async (stream: MediaStream, mimeType: string | undefined) => {
      stream.getTracks().forEach((track) => track.stop());
      const durationMs = Date.now() - startedAtRef.current;
      const vadRan = vadActiveRef.current;
      const spoke = spokeRef.current;
      teardownVad();
      if (!mountedRef.current) return;

      // Nothing was said — don't send anything to the chatbot. Skipping the
      // upload here also avoids Whisper hallucinating text from silence.
      if (vadRan && !spoke) {
        // VAD is confident no speech was captured.
        chunksRef.current = [];
        if (durationMs < MIN_RECORDING_MS) {
          setState("idle"); // accidental quick tap — no scary error
        } else {
          setErrorMessage("We didn't catch anything. Please try again or type your question.");
          setState("error");
        }
        return;
      }
      if (!vadRan && durationMs < MIN_RECORDING_MS) {
        // No VAD available and barely any audio — treat as an accidental tap.
        chunksRef.current = [];
        setState("idle");
        return;
      }

      setState("transcribing");

      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      chunksRef.current = [];

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const form = new FormData();
        form.append("audio", blob, "recording.webm");

        const res = await fetch(`${env.AI_URL}/v1/speech/transcriptions`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`transcription failed: ${res.status}`);
        const data = (await res.json()) as { transcript: string };

        if (!mountedRef.current) return;
        if (!data.transcript?.trim()) {
          setErrorMessage("We couldn't hear that clearly. Please try again or type your question.");
          setState("error");
          return;
        }
        onTranscript(data.transcript);
        setState("idle");
      } catch (err) {
        if (!mountedRef.current || (err instanceof Error && err.name === "AbortError")) return;
        setErrorMessage("We couldn't process your voice message. Please try again or type your question.");
        setState("error");
      }
    },
    [token, onTranscript, teardownVad],
  );

  // Wire up mic-volume monitoring on the live stream so we can tell whether the
  // user actually spoke. Best-effort: if the Web Audio API is unavailable, VAD
  // stays inactive and the empty-transcript check does the work instead.
  const setupVad = useCallback((stream: MediaStream) => {
    spokeRef.current = false;
    vadActiveRef.current = false;
    let voicedFrames = 0;
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    try {
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      // Safari may hand back a suspended context; resume so the analyser
      // actually processes audio (otherwise every frame reads as silence).
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buffer = new Uint8Array(analyser.fftSize);
      vadActiveRef.current = true;

      const sample = () => {
        analyser.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        // Sustained-energy gate: count voiced frames (cumulative, so pauses
        // between words don't reset progress) and only flag speech once real
        // talking — not a single click/breath spike — has been heard.
        if (rms > SPEECH_RMS_THRESHOLD) {
          voicedFrames += 1;
          if (voicedFrames >= SPEECH_FRAMES_REQUIRED) spokeRef.current = true;
        }
        rafRef.current = requestAnimationFrame(sample);
      };
      rafRef.current = requestAnimationFrame(sample);
    } catch {
      vadActiveRef.current = false;
      teardownVad();
    }
  }, [teardownVad]);

  const start = useCallback(async () => {
    if (!supported || state === "recording" || state === "transcribing") return;
    setErrorMessage(null);
    cancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // Cancelled: drop the audio and return to idle without transcribing.
        if (cancelledRef.current) {
          cancelledRef.current = false;
          teardownVad();
          stream.getTracks().forEach((track) => track.stop());
          chunksRef.current = [];
          if (mountedRef.current) setState("idle");
          return;
        }
        void finish(stream, mimeType);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setupVad(stream);
      setState("recording");

      stopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, MAX_RECORDING_MS);
    } catch {
      if (!mountedRef.current) return;
      setErrorMessage("Microphone access was blocked. You can still type your question.");
      setState("error");
    }
  }, [supported, state, finish, setupVad, teardownVad]);

  const stop = useCallback(() => {
    clearTimeout(stopTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimeout(stopTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      cancelledRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      teardownVad();
      setState("idle");
    }
  }, [teardownVad]);

  const reset = useCallback(() => {
    setErrorMessage(null);
    setState("idle");
  }, []);

  return { state, errorMessage, supported, start, stop, cancel, reset };
}
