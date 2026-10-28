/**
 * @module core/voice-audio
 * @description The widget's transport for voice messages.
 *
 * Only the transport lives here. Recording, playback, the voice-to-voice turn
 * and every voice component are in `@zanderio/core/chat-ui`, shared with the
 * dashboard. They take these as ports because the hosts authenticate
 * differently: the widget uses `fetch` with its anonymous AI-service token,
 * the dashboard its axios client.
 */

import { env } from "@/config/env";
import type { VoiceAudio } from "@zanderio/core/chat";
import type { VoiceReplyRequester, VoiceUploader } from "@zanderio/core/chat-ui";

// Speaking a long answer takes a while; well past that, something is wrong.
const VOICE_REPLY_TIMEOUT_MS = 60_000;

const auth = (token: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

/** For `voicePlayer.setLoader`: a stored voice message's bytes. */
export async function fetchVoiceAudio(audioId: string, token: string | null): Promise<Blob> {
  const res = await fetch(`${env.AI_URL}/v1/speech/audio/${encodeURIComponent(audioId)}`, {
    headers: auth(token),
  });
  if (!res.ok) throw new Error(`voice audio failed: ${res.status}`);
  return res.blob();
}

/** For `useVoiceInput`: uploads a recording for transcription or as a voice message. */
export function voiceUploader(token: string | null): VoiceUploader {
  return async (path, form, signal) => {
    const res = await fetch(`${env.AI_URL}/v1/speech/${path}`, {
      method: "POST",
      headers: auth(token),
      body: form,
      signal,
    });
    return { status: res.status, data: res.ok ? await res.json() : null };
  };
}

/** For `useVoiceReplies`: asks the AI service to speak an assistant message. */
export function voiceReplyRequester(getToken: () => string | null): VoiceReplyRequester {
  return async (threadId, messageId) => {
    const res = await fetch(`${env.AI_URL}/v1/speech/voice-replies`, {
      method: "POST",
      signal: AbortSignal.timeout(VOICE_REPLY_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", ...auth(getToken()) },
      body: JSON.stringify({ thread_id: threadId, message_id: messageId }),
    });
    if (res.ok) return (await res.json()) as VoiceAudio;
    // No such reply, or one made only of cards — there are no words.
    if (res.status === 404 || res.status === 422) return null;
    throw new Error(`voice reply failed: ${res.status}`);
  };
}
