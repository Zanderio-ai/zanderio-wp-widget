/**
 * @module core/use-image-attachment
 * @description The photo chosen for the visitor's next message: pick,
 * preview, send, and why it was refused.
 *
 * Nothing is uploaded until the visitor sends — a photo they change their
 * mind about never reaches the AI service. A photo belongs to the
 * conversation it was chosen in (it is stored under it), so starting a new
 * chat drops one being chosen or uploaded. Storefront twin of client/app
 * playground `use-image-attachment.ts`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { VisitorImage } from "@zanderio/core/chat";
import {
  checkImageSize,
  checkImageType,
  prepareImageFile,
  uploadVisitorImage,
} from "./visitor-image";

/** A photo the AI service accepted, ready to be sent with the chat turn. */
export interface AcceptedImage {
  image: VisitorImage;
  /** The photo as sent, so its bubble can show it without a fetch. */
  blob: Blob;
  /** Any words typed with the photo. */
  text: string;
}

export interface PendingImage {
  file: File;
  previewUrl: string;
}

interface UseImageAttachmentArgs {
  conversationId: string | null;
  token: string | null;
}

export function useImageAttachment({ conversationId, token }: UseImageAttachmentArgs) {
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  // Bumped whenever the choice is replaced or dropped, so a photo still being
  // prepared can't land after the visitor moved on.
  const choiceRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  // Release the preview's object URL whenever it is replaced or removed.
  useEffect(() => {
    const url = pending?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [pending]);

  const select = useCallback(async (file: File) => {
    const choice = ++choiceRef.current;
    const wrongType = checkImageType(file);
    if (wrongType) {
      setError(wrongType);
      return;
    }
    setError(null);
    const prepared = await prepareImageFile(file);
    if (!mountedRef.current || choice !== choiceRef.current) return;
    const tooBig = checkImageSize(prepared);
    if (tooBig) {
      setError(tooBig);
      return;
    }
    setPending({ file: prepared, previewUrl: URL.createObjectURL(prepared) });
  }, []);

  const clear = useCallback(() => {
    choiceRef.current++;
    controllerRef.current?.abort();
    setPending(null);
    setUploading(false);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  // A new chat starts with no photo: the choice is reset while rendering it,
  // and anything still being prepared or uploaded for the old chat is dropped.
  const [chatOfChoice, setChatOfChoice] = useState(conversationId);
  if (chatOfChoice !== conversationId) {
    setChatOfChoice(conversationId);
    setPending(null);
    setUploading(false);
    setError(null);
  }
  useEffect(
    () => () => {
      choiceRef.current++;
      controllerRef.current?.abort();
    },
    [conversationId],
  );

  /**
   * Upload the chosen photo. Resolves to the accepted photo, or `null` when it
   * was not (the reason is in `error`). A refused photo is dropped so the
   * visitor picks another; a failure that a retry might fix keeps it.
   */
  const send = useCallback(
    async (text: string): Promise<AcceptedImage | null> => {
      if (!pending || !conversationId || uploading) return null;
      const controller = new AbortController();
      controllerRef.current = controller;
      setUploading(true);
      setError(null);
      const result = await uploadVisitorImage(
        conversationId,
        pending.file,
        token,
        controller.signal,
      );
      if (!mountedRef.current || controller.signal.aborted) return null;
      setUploading(false);
      if (!result.ok) {
        setError(result.message);
        if (result.rejected) setPending(null);
        return null;
      }
      setPending(null);
      return { image: result.image, blob: pending.file, text };
    },
    [pending, conversationId, token, uploading],
  );

  return { pending, uploading, error, select, clear, dismissError, send };
}
