/**
 * @module core/visitor-image
 * @description Photo search: sending a product photo to the AI service and
 * loading one back.
 *
 * Like voice messages, a photo is uploaded before the chat turn that carries
 * it: `uploadVisitorImage` returns an `image_id` the turn then claims. The AI
 * service is the authority on what is accepted — safety, whether it fits the
 * store, whether the product can be made out. The checks here only save a
 * round trip, and `prepareImageFile` only shrinks a large phone photo so it
 * uploads quickly; the service re-encodes every photo itself.
 *
 * The bytes live behind the same bearer token as chat, so an `<img src>` can't
 * fetch them; `loadVisitorImage` fetches to a blob and hands back an object
 * URL. The photo just sent is primed from the local file, so it never
 * round-trips. Storefront twin of client/app `shared/chat/visitor-image.ts`.
 */

import { useEffect, useState } from "react";
import { env } from "@/config/env";
import type { VisitorImage } from "@zanderio/core/chat";

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const IMAGE_TYPES = new Set(IMAGE_ACCEPT.split(","));
/** Mirrors the AI service's upload limit. */
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

// The AI service reduces every photo to 1024px; anything much larger is just
// a slower upload on a phone connection.
const MAX_SIDE = 1600;
const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;

/** Why a photo of this type can't be sent, or `null` when it can. */
export function checkImageType(file: File): string | null {
  return IMAGE_TYPES.has(file.type) ? null : "Please choose a JPG, PNG, or WebP photo.";
}

/** Why a photo of this size can't be sent, or `null` when it can. */
export function checkImageSize(file: File): string | null {
  if (file.size === 0) return "That photo is empty. Please choose another.";
  if (file.size > IMAGE_MAX_BYTES) return "That photo is too large. Please choose one under 10 MB.";
  return null;
}

/**
 * A large photo, scaled down to at most 1600px and re-encoded as JPEG; any
 * other photo as it is. Best effort: a browser that can't decode it here sends
 * the original, and the size check still applies.
 */
export async function prepareImageFile(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    // JPEG has no transparency — a transparent PNG would otherwise turn black.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export type ImageUploadResult =
  | { ok: true; image: VisitorImage }
  /** `rejected`: the photo itself can't be used (choose another); otherwise a retry may work. */
  | { ok: false; message: string; rejected: boolean };

const GENERIC_FAILURE = "We couldn't send that photo. Please try again.";

/**
 * Send a photo for checking. A refusal carries the AI service's own
 * explanation — written for the visitor, e.g. what the store sells.
 */
export async function uploadVisitorImage(
  conversationId: string,
  file: File,
  token: string | null,
  signal?: AbortSignal,
): Promise<ImageUploadResult> {
  const form = new FormData();
  form.append("image", file, file.name || "photo");
  try {
    const res = await fetch(`${env.AI_URL}/v1/threads/${conversationId}/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal,
    });
    if (res.ok) {
      const data = (await res.json()) as VisitorImage;
      return { ok: true, image: { image_id: data.image_id, mime: data.mime } };
    }
    if (res.status === 401) {
      return {
        ok: false,
        message: "Your session timed out. Refresh the page to keep chatting.",
        rejected: false,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        message: "You're sending too fast. Please wait a moment.",
        rejected: false,
      };
    }
    const body = (await res.json().catch(() => null)) as { detail?: unknown } | null;
    const detail = body?.detail;
    const explanation = typeof detail === "string" && detail.trim() ? detail : GENERIC_FAILURE;
    // 400: empty or too large; 403: photo search is off; 422: the photo was refused.
    const rejected = res.status === 400 || res.status === 403 || res.status === 422;
    return { ok: false, message: explanation, rejected };
  } catch (err) {
    if ((err as { name?: unknown } | null)?.name === "AbortError") {
      return { ok: false, message: "", rejected: false };
    }
    return { ok: false, message: GENERIC_FAILURE, rejected: false };
  }
}

// ── Photo bytes ──────────────────────────────────────────────────────────────

const urls = new Map<string, Promise<string>>();

/** Register a photo the visitor just sent so its bubble shows without a fetch. */
export function primeVisitorImage(imageId: string, blob: Blob): void {
  urls.set(imageId, Promise.resolve(URL.createObjectURL(blob)));
}

export function loadVisitorImage(imageId: string, token: string | null): Promise<string> {
  const cached = urls.get(imageId);
  if (cached) return cached;

  const pending = fetch(`${env.AI_URL}/v1/images/${encodeURIComponent(imageId)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).then(async (res) => {
    if (!res.ok) throw new Error(`visitor image failed: ${res.status}`);
    return URL.createObjectURL(await res.blob());
  });
  // A failed load must not poison the cache — the next render retries.
  pending.catch(() => urls.delete(imageId));
  urls.set(imageId, pending);
  return pending;
}

/** A stored photo's object URL: `url` once loaded, `failed` when it could not be. */
export function useVisitorImage(
  imageId: string,
  token: string | null,
): { url: string | null; failed: boolean } {
  const [state, setState] = useState<{ id: string; url: string | null; failed: boolean }>({
    id: imageId,
    url: null,
    failed: false,
  });

  useEffect(() => {
    let cancelled = false;
    loadVisitorImage(imageId, token).then(
      (url) => !cancelled && setState({ id: imageId, url, failed: false }),
      () => !cancelled && setState({ id: imageId, url: null, failed: true }),
    );
    return () => {
      cancelled = true;
    };
    // A photo is fetched once; a later token refresh doesn't change its bytes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId]);

  return state.id === imageId
    ? { url: state.url, failed: state.failed }
    : { url: null, failed: false };
}
