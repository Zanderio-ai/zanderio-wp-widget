/**
 * @module chat-ui/use-voice-replies
 * @description Voice-to-voice on top of a `useChat` conversation.
 *
 * A voice message is answered with a voice message, never with text. The
 * visitor's recording is sent as its transcript (plus the recording's id), and
 * once the reply has streamed the AI service is asked to speak it; the audio
 * is attached to the assistant message as a `data-audio` part.
 *
 * `voiceReplyPending` covers the live turn from send until its spoken reply is
 * settled; `voiceReplyStatus` tracks each reply that is still being spoken
 * ("pending") or could not be ("failed" — the transcript then offers a retry
 * instead of falling back to text). `voiceReply` is the latest spoken reply
 * the visitor is waiting for, for the host to autoplay.
 *
 * Asking for the voice is the host's job, because the hosts authenticate
 * differently, so each passes a {@link VoiceReplyRequester}. Wiring:
 *
 *   const finish = useRef<VoiceTurnFinish>();
 *   const chat = useChat({ transport, onFinish: (e) => finish.current?.(e) });
 *   const voice = useVoiceReplies({ conversationId, ...chat, requestReply });
 *   useEffect(() => { finish.current = voice.onFinish; }, [voice.onFinish]);
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatUIMessage, VoiceAudio } from "../chat/types.js";
import { missingVoiceReplies } from "../chat/voice.js";
import { primeVoiceAudio } from "./voice-player.js";
import type { RecordedVoiceMessage } from "./use-voice-input.js";

const VOICE_REPLY_ATTEMPTS = 2;

/** Where a spoken reply stands while its message has no audio yet. */
export type VoiceReplyStatus = "pending" | "failed";

/**
 * Ask the AI service to speak one assistant message
 * (`POST {AI}/v1/speech/voice-replies` with `{ thread_id, message_id }`).
 * Resolve with the audio, or `null` when there is nothing to speak (404/422:
 * no such reply, or one made only of cards). Reject on anything worth retrying
 * — network, 5xx, timeout. The requester enforces its own timeout.
 */
export type VoiceReplyRequester = (threadId: string, messageId: string) => Promise<VoiceAudio | null>;

/** The subset of `useChat`'s `onFinish` event this hook reads. */
export type VoiceTurnFinish = (event: {
  message: ChatUIMessage;
  isAbort: boolean;
  isError: boolean;
}) => void;

export interface UseVoiceRepliesArgs {
  conversationId: string | null;
  setMessages: (update: (current: ChatUIMessage[]) => ChatUIMessage[]) => void;
  sendMessage: (
    message: { role: "user"; parts: ChatUIMessage["parts"] },
    options: { body: Record<string, unknown> },
  ) => unknown;
  /** `useChat`'s status — a turn that failed outright has no reply to wait for. */
  status: string;
  requestReply: VoiceReplyRequester;
}

export function useVoiceReplies({
  conversationId,
  setMessages,
  sendMessage,
  status,
  requestReply,
}: UseVoiceRepliesArgs) {
  const [voiceReplyPending, setVoiceReplyPending] = useState(false);
  const [voiceReplyStatus, setVoiceReplyStatus] = useState<Record<string, VoiceReplyStatus>>({});
  const [voiceReply, setVoiceReply] = useState<VoiceAudio | null>(null);
  const voiceTurnRef = useRef(false);
  // The one reply the visitor is waiting to hear. Cleared when they move on
  // (type a message, start a new chat), so a late voice never talks over them.
  const autoplayRef = useRef<string | null>(null);
  const conversationRef = useRef(conversationId);
  // Latest host callbacks, so the stable functions below never go stale.
  const host = useRef({ setMessages, requestReply });
  useEffect(() => {
    host.current = { setMessages, requestReply };
  }, [setMessages, requestReply]);

  // A new conversation starts with no voice turn in flight: one still
  // streaming in the old conversation never reaches `onFinish`, and would
  // otherwise keep the new chat's composer locked waiting for a reply.
  useEffect(() => {
    conversationRef.current = conversationId;
    voiceTurnRef.current = false;
    autoplayRef.current = null;
    setVoiceReplyPending(false);
    setVoiceReply(null);
    setVoiceReplyStatus({});
  }, [conversationId]);

  // The request is idempotent, so a failure is simply tried again; only when
  // every attempt fails is the reply marked failed for the visitor to retry.
  const speak = useCallback(async (messageId: string, autoplay: boolean) => {
    const threadId = conversationRef.current;
    if (!threadId) return;
    // A reply belongs to the conversation it was asked for. If the visitor
    // starts a new chat meanwhile, its result is dropped.
    const stillCurrent = () => conversationRef.current === threadId;
    const mark = (state: VoiceReplyStatus | null) =>
      setVoiceReplyStatus((current) => {
        const next = { ...current };
        if (state) next[messageId] = state;
        else delete next[messageId];
        return next;
      });

    if (autoplay) autoplayRef.current = messageId;
    mark("pending");
    let outcome: "spoken" | "nothing-to-speak" | "failed" = "failed";
    for (let attempt = 0; attempt < VOICE_REPLY_ATTEMPTS && outcome === "failed"; attempt++) {
      try {
        const audio = await host.current.requestReply(threadId, messageId);
        if (!stillCurrent()) return;
        if (!audio) {
          outcome = "nothing-to-speak";
          break;
        }
        host.current.setMessages((current) =>
          current.map((m) =>
            m.id === messageId ? { ...m, parts: [...m.parts, { type: "data-audio", data: audio }] } : m,
          ),
        );
        if (autoplayRef.current === messageId) setVoiceReply(audio);
        outcome = "spoken";
      } catch {
        if (!stillCurrent()) return;
        // network error, 5xx or timeout — try again
      }
    }
    if (autoplayRef.current === messageId) autoplayRef.current = null;
    mark(outcome === "failed" ? "failed" : null);
    setVoiceReplyPending(false);
  }, []);

  const onFinish = useCallback<VoiceTurnFinish>(
    ({ message, isAbort, isError }) => {
      if (!voiceTurnRef.current) return;
      voiceTurnRef.current = false;
      const spoken = message.parts.some((p) => p.type === "text" && p.text.trim().length > 0);
      if (isAbort || isError || !spoken) {
        setVoiceReplyPending(false);
        return;
      }
      void speak(message.id, true);
    },
    [speak],
  );

  /** Send a stored recording as a voice message. */
  const sendVoice = useCallback(
    ({ audio, blob, transcript }: RecordedVoiceMessage) => {
      if (!conversationId || !transcript.trim()) return;
      primeVoiceAudio(audio.audio_id, blob);
      voiceTurnRef.current = true;
      setVoiceReplyPending(true);
      // The transcript is the turn's text — the agent, history and summaries
      // never know the difference — and `voice.audio_id` tells the AI service
      // which recording it came from.
      sendMessage(
        {
          role: "user",
          parts: [
            { type: "data-audio", data: audio },
            { type: "text", text: transcript.trim() },
          ],
        },
        { body: { voice: { audio_id: audio.audio_id } } },
      );
    },
    [conversationId, sendMessage],
  );

  /** Call when the visitor sends a typed message: that turn is answered in text. */
  const endVoiceTurn = useCallback(() => {
    voiceTurnRef.current = false;
    autoplayRef.current = null;
    setVoiceReplyPending(false);
  }, []);

  /**
   * After loading history: speak, one at a time, every reply that answered a
   * voice message but never got its own voice (it failed, or the page was
   * reloaded first). No autoplay — the visitor didn't just ask for it.
   */
  const speakMissingReplies = useCallback(
    async (history: ChatUIMessage[]) => {
      const missing = missingVoiceReplies(history);
      if (missing.length === 0) return;
      // All pending up front, so none flashes its text while waiting its turn.
      setVoiceReplyStatus((current) => {
        const next = { ...current };
        for (const id of missing) next[id] = "pending";
        return next;
      });
      for (const id of missing) await speak(id, false);
    },
    [speak],
  );

  /** Try again to speak a reply whose voice message could not be created. */
  const retryVoiceReply = useCallback((messageId: string) => void speak(messageId, true), [speak]);

  return {
    onFinish,
    sendVoice,
    endVoiceTurn,
    speakMissingReplies,
    retryVoiceReply,
    /** A voice message was sent and its spoken reply hasn't settled yet. */
    voiceReplyPending: voiceReplyPending && status !== "error",
    voiceReply,
    voiceReplyStatus,
  };
}
