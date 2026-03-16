/**
 * Zanderio Widget — Markdown Rendering Utility
 *
 * Lightweight, zero-dependency (beyond React) renderer that converts a subset
 * of Markdown into React elements.  Used by TextMessage to format bot replies.
 *
 * Supported syntax
 * ----------------
 * | Syntax            | Example               | Rendered as           |
 * |-------------------|-----------------------|-----------------------|
 * | Headings (1-3)    | `# Title`             | `<div>` with bold     |
 * | Bold              | `**text**`            | `<strong>`            |
 * | Images            | `![alt](url)`         | `<img>` or shimmer    |
 *
 * Typing mode
 * -----------
 * When `isTyping` is true, image tokens are replaced with an animated
 * shimmer placeholder so the user sees a loading skeleton while the typing
 * animation is still running.  Once the animation finishes the hook swaps in
 * the full text (including image markdown) which then renders the real `<img>`.
 *
 * The function splits the input on newlines and processes each line top-down:
 *   1. Check for image markdown  → render `<img>` or shimmer
 *   2. Check for heading prefix  → render bold `<div>`
 *   3. Fallback                  → render inline bold spans with `<br>` joins
 *
 * @module utils/markdown
 */

import React from "react";

/**
 * Converts a markdown-like string into an array of React elements.
 *
 * @param {string}  text     — raw text to render (may contain markdown tokens)
 * @param {boolean} isTyping — when true images show a CSS shimmer placeholder
 * @returns {React.ReactNode[]|string|null} array of keyed elements, or the
 *          original falsy value when `text` is empty / null
 */
export function renderMarkdown(text, isTyping = false) {
  if (!text) return text;

  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      const [, altText, imageUrl] = imageMatch;

      if (isTyping) {
        return (
          <div key={lineIndex} style={{ margin: "8px 0" }}>
            <div
              style={{
                display: "inline-block",
                width: "120px",
                height: "120px",
                borderRadius: "8px",
                overflow: "hidden",
                background:
                  "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          </div>
        );
      }

      return (
        <div key={lineIndex} style={{ margin: "8px 0" }}>
          <img
            src={imageUrl}
            alt={altText}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
        </div>
      );
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      return (
        <div
          key={lineIndex}
          style={{
            fontWeight: "bold",
            margin: "10px 0 5px 0",
            fontSize: level === 1 ? "1.2em" : level === 2 ? "1.1em" : "1em",
          }}
        >
          {headingMatch[2]}
        </div>
      );
    }

    return (
      <span key={lineIndex}>
        {lineIndex > 0 && <br />}
        {line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} style={{ fontWeight: "600" }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  });
}
