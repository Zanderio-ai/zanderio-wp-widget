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
import { useCallback, useEffect, useRef, useState } from "react";
import { toWaveform, voiceLevel } from "../chat/voice.js";
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
const CANDIDATE_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];
function pickMimeType() {
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
        return undefined;
    }
    return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}
// Live waveform: one bar per window, taken at its loudest.
const LEVEL_WINDOW_MS = 80;
const LIVE_BARS = 28;
const UNHEARD = "We couldn't hear that clearly. Please try again or type your question.";
export function useVoiceInput({ upload, onTranscript, mode = "text", conversationId = null, onVoiceMessage, }) {
    const [state, setState] = useState("idle");
    const [errorMessage, setErrorMessage] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const stopTimerRef = useRef(undefined);
    const mountedRef = useRef(true);
    const abortControllerRef = useRef(null);
    // Set when the user cancels a recording — tells the recorder's onstop handler
    // to discard the audio instead of transcribing it.
    const cancelledRef = useRef(false);
    // Voice-activity detection state.
    const audioCtxRef = useRef(null);
    const rafRef = useRef(undefined);
    const spokeRef = useRef(false);
    const vadActiveRef = useRef(false);
    const startedAtRef = useRef(0);
    // Loudness per window for the whole recording, and the latest few as bar
    // heights (0..1) for the live waveform.
    const levelsRef = useRef([]);
    const [levels, setLevels] = useState([]);
    const teardownVad = useCallback(() => {
        if (rafRef.current !== undefined) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = undefined;
        }
        if (audioCtxRef.current) {
            void audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
        }
    }, []);
    useEffect(() => {
        // Set here as well as in the ref's initialiser: StrictMode runs this
        // effect's cleanup once on mount, which would otherwise leave it false.
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearTimeout(stopTimerRef.current);
            abortControllerRef.current?.abort();
            teardownVad();
            mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
        };
    }, [teardownVad]);
    const supported = typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined" &&
        (typeof window === "undefined" || window.isSecureContext !== false);
    const finish = useCallback(async (stream, mimeType) => {
        stream.getTracks().forEach((track) => track.stop());
        const durationMs = Date.now() - startedAtRef.current;
        const vadRan = vadActiveRef.current;
        const spoke = spokeRef.current;
        teardownVad();
        if (!mountedRef.current)
            return;
        // Nothing was said — don't send anything to the chatbot. Skipping the
        // upload here also avoids Whisper hallucinating text from silence.
        if (vadRan && !spoke) {
            // VAD is confident no speech was captured.
            chunksRef.current = [];
            if (durationMs < MIN_RECORDING_MS) {
                setState("idle"); // accidental quick tap — no scary error
            }
            else {
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
            const voice = mode === "voice" && !!conversationId;
            const waveform = toWaveform(levelsRef.current);
            if (voice && conversationId) {
                form.append("thread_id", conversationId);
                if (waveform)
                    form.append("waveform", JSON.stringify(waveform));
            }
            const res = await upload(voice ? "voice-messages" : "transcriptions", form, controller.signal);
            if (!mountedRef.current || controller.signal.aborted)
                return;
            // The server found no speech in a voice message — same outcome as an
            // empty transcript, just reported as a rejection since nothing is kept.
            if (voice && res.status === 422) {
                setErrorMessage(UNHEARD);
                setState("error");
                return;
            }
            if (res.status >= 400)
                throw new Error(`transcription failed: ${res.status}`);
            const data = (res.data ?? {});
            if (!mountedRef.current || controller.signal.aborted)
                return;
            if (!data.transcript?.trim()) {
                setErrorMessage(UNHEARD);
                setState("error");
                return;
            }
            if (voice && data.audio_id) {
                onVoiceMessage?.({
                    audio: {
                        audio_id: data.audio_id,
                        mime: data.mime ?? blob.type,
                        duration_ms: data.duration_ms ?? durationMs,
                        waveform: data.waveform ?? waveform,
                        created_at: data.created_at ?? new Date().toISOString(),
                    },
                    blob,
                    transcript: data.transcript,
                });
            }
            else {
                onTranscript(data.transcript);
            }
            setState("idle");
        }
        catch (err) {
            if (!mountedRef.current || controller.signal.aborted)
                return;
            setErrorMessage("We couldn't process your voice message. Please try again or type your question.");
            setState("error");
        }
    }, [upload, onTranscript, teardownVad, mode, conversationId, onVoiceMessage]);
    // Wire up mic-volume monitoring on the live stream so we can tell whether the
    // user actually spoke. Best-effort: if the Web Audio API is unavailable, VAD
    // stays inactive and the empty-transcript check does the work instead.
    const setupVad = useCallback((stream) => {
        spokeRef.current = false;
        vadActiveRef.current = false;
        let voicedFrames = 0;
        let windowPeak = 0;
        let windowStart = performance.now();
        levelsRef.current = [];
        setLevels([]);
        const Ctx = window.AudioContext ??
            window.webkitAudioContext;
        if (!Ctx)
            return;
        try {
            const ctx = new Ctx();
            audioCtxRef.current = ctx;
            // Safari may hand back a suspended context; resume so the analyser
            // actually processes audio (otherwise every frame reads as silence).
            if (ctx.state === "suspended")
                void ctx.resume().catch(() => { });
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
                    const v = ((buffer[i] ?? 128) - 128) / 128;
                    sumSquares += v * v;
                }
                const rms = Math.sqrt(sumSquares / buffer.length);
                windowPeak = Math.max(windowPeak, rms);
                const now = performance.now();
                if (now - windowStart >= LEVEL_WINDOW_MS) {
                    levelsRef.current.push(windowPeak);
                    windowPeak = 0;
                    windowStart = now;
                    setLevels(levelsRef.current.slice(-LIVE_BARS).map(voiceLevel));
                }
                // Sustained-energy gate: count voiced frames (cumulative, so pauses
                // between words don't reset progress) and only flag speech once real
                // talking — not a single click/breath spike — has been heard.
                if (rms > SPEECH_RMS_THRESHOLD) {
                    voicedFrames += 1;
                    if (voicedFrames >= SPEECH_FRAMES_REQUIRED)
                        spokeRef.current = true;
                }
                rafRef.current = requestAnimationFrame(sample);
            };
            rafRef.current = requestAnimationFrame(sample);
        }
        catch {
            vadActiveRef.current = false;
            teardownVad();
        }
    }, [teardownVad]);
    const start = useCallback(async () => {
        if (!supported || state === "recording" || state === "transcribing")
            return;
        setErrorMessage(null);
        cancelledRef.current = false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = pickMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0)
                    chunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                // Cancelled: drop the audio and return to idle without transcribing.
                if (cancelledRef.current) {
                    cancelledRef.current = false;
                    teardownVad();
                    stream.getTracks().forEach((track) => track.stop());
                    chunksRef.current = [];
                    if (mountedRef.current)
                        setState("idle");
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
                if (mediaRecorderRef.current?.state === "recording")
                    mediaRecorderRef.current.stop();
            }, MAX_RECORDING_MS);
        }
        catch {
            if (!mountedRef.current)
                return;
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
        }
        else {
            teardownVad();
            setState("idle");
        }
    }, [teardownVad]);
    // A recording belongs to the conversation it was started in: a voice message
    // is stored under that conversation and can't be sent into another. Starting
    // a new chat discards one being recorded or uploaded.
    const conversationRef = useRef(conversationId);
    useEffect(() => {
        if (conversationRef.current === conversationId)
            return;
        conversationRef.current = conversationId;
        abortControllerRef.current?.abort();
        cancel();
    }, [conversationId, cancel]);
    const reset = useCallback(() => {
        setErrorMessage(null);
        setState("idle");
    }, []);
    return { state, errorMessage, supported, start, stop, cancel, reset, levels };
}
//# sourceMappingURL=use-voice-input.js.map