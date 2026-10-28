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
import type { ChatUIMessage, VoiceAudio } from "../chat/types.js";
import type { RecordedVoiceMessage } from "./use-voice-input.js";
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
    sendMessage: (message: {
        role: "user";
        parts: ChatUIMessage["parts"];
    }, options: {
        body: Record<string, unknown>;
    }) => unknown;
    /** `useChat`'s status — a turn that failed outright has no reply to wait for. */
    status: string;
    requestReply: VoiceReplyRequester;
}
export declare function useVoiceReplies({ conversationId, setMessages, sendMessage, status, requestReply, }: UseVoiceRepliesArgs): {
    onFinish: VoiceTurnFinish;
    sendVoice: ({ audio, blob, transcript }: RecordedVoiceMessage) => void;
    endVoiceTurn: () => void;
    speakMissingReplies: (history: ChatUIMessage[]) => Promise<void>;
    retryVoiceReply: (messageId: string) => undefined;
    /** A voice message was sent and its spoken reply hasn't settled yet. */
    voiceReplyPending: boolean;
    voiceReply: VoiceAudio | null;
    voiceReplyStatus: Record<string, VoiceReplyStatus>;
};
//# sourceMappingURL=use-voice-replies.d.ts.map