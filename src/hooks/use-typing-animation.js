/**
 * Zanderio Widget — useTypingAnimation Hook
 *
 * Drives the character-by-character typing effect for bot messages.
 *
 * How it works
 * ------------
 * `typeText(text, callback)` inserts a new bot message (with `isTyping: true`)
 * into the parent’s `messages` state, then starts a 20 ms interval that
 * reveals one character at a time.  While the animation is running, image
 * markdown tokens (`![alt](url)`) are stripped from the display text so
 * they don’t flash partially — instead, `renderMarkdown` shows a shimmer
 * placeholder.  When the last character is reached the interval clears,
 * the full original text (including image tokens) is restored, and the
 * optional `callback` fires so the next content block can begin.
 *
 * The hook stores the interval ID in a ref and cleans it up on unmount
 * to prevent memory leaks.
 *
 * @param {Function} setMessages — the parent `useState` setter for messages
 * @returns {{ isTyping: boolean, typeText: (text: string, cb?: Function) => void }}
 *
 * @module hooks/use-typing-animation
 */

import { useState, useRef, useCallback, useEffect } from "react";

export function useTypingAnimation(setMessages) {
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /**
   * Types `text` character-by-character into a new bot message.
   * Calls `callback` when the animation completes.
   */
  const typeText = useCallback(
    (text, callback) => {
      setIsTyping(true);
      let index = 0;
      const messageId = Date.now();
      const displayText = text.replace(/!\[.*?\]\(.*?\)/g, "");

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          type: "text",
          text: "",
          id: messageId,
          isTyping: true,
          fullText: text,
        },
      ]);

      intervalRef.current = setInterval(() => {
        if (index < displayText.length) {
          const chunk = displayText.slice(0, index + 1);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId ? { ...msg, text: chunk } : msg,
            ),
          );
          index++;
        } else {
          clearInterval(intervalRef.current);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, text: msg.fullText || text, isTyping: false }
                : msg,
            ),
          );
          setIsTyping(false);
          if (callback) callback();
        }
      }, 20);
    },
    [setMessages],
  );

  return { isTyping, typeText };
}
