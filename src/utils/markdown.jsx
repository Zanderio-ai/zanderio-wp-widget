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
 * | Italic            | `*text*`              | `<em>`                |
 * | Links             | `[text](url)`         | `<a>`                 |
 * | Bullet lists      | `- item` or `* item`  | `<ul><li>`            |
 * | Images            | `![alt](url)`         | `<img>` or shimmer    |
 *
 * Typing mode
 * -----------
 * When `isTyping` is true, image tokens are replaced with an animated
 * shimmer placeholder so the user sees a loading skeleton while the typing
 * animation is still running.  Once the animation finishes the hook swaps in
 * the full text (including image markdown) which then renders the real `<img>`.
 *
 * @module utils/markdown
 */

import React from "react";

/**
 * Renders inline markdown tokens (bold, italic, links) within a line.
 */
function renderInline(text, keyPrefix) {
  // Match **bold**, *italic*, and [text](url)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} style={{ fontWeight: "600" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "underline" }}
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

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
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          style={{ margin: "4px 0", paddingLeft: "20px" }}
        >
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    // Bullet list item: "- text" or "* text" (but not "**bold**")
    const bulletMatch = line.match(/^[\-\*]\s+(.+)/);
    if (bulletMatch && !line.startsWith("**")) {
      listItems.push(
        <li key={`li-${lineIndex}`}>
          {renderInline(bulletMatch[1], `li-${lineIndex}`)}
        </li>,
      );
      continue;
    }

    // Flush any pending list before rendering non-list content
    flushList();

    // Image
    const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      const [, altText, imageUrl] = imageMatch;

      if (isTyping) {
        elements.push(
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
          </div>,
        );
      } else {
        elements.push(
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
          </div>,
        );
      }
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      elements.push(
        <div
          key={lineIndex}
          style={{
            fontWeight: "bold",
            margin: "10px 0 5px 0",
            fontSize: level === 1 ? "1.2em" : level === 2 ? "1.1em" : "1em",
          }}
        >
          {headingMatch[2]}
        </div>,
      );
      continue;
    }

    // Regular line with inline formatting
    elements.push(
      <span key={lineIndex}>
        {lineIndex > 0 && <br />}
        {renderInline(line, `line-${lineIndex}`)}
      </span>,
    );
  }

  flushList();
  return elements;
}
