/**
 * @module ui/MessageContent
 * @description Render a UIMessage's parts — markdown text + image files.
 *
 * Artifacts (`data-artifact`) and interrupts (`data-interrupt`) are rendered by
 * MessageList, not here. Mirrors client/app playground `MessageContent.tsx`.
 */

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { css } from "@emotion/react";
import type { ChatUIMessage } from "@/core/chat-types";

const markdown = css`
  font-size: 14px;
  p {
    margin: 0 0 8px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  a {
    color: inherit;
    text-decoration: underline;
  }
  ul,
  ol {
    margin: 0 0 8px;
    padding-left: 18px;
  }
  code {
    background: var(--z-bg-muted);
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 12px;
  }
`;

const link = (href?: string, children?: React.ReactNode) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

export function MessageContent({ message }: { message: ChatUIMessage }) {
  return (
    <div css={markdown}>
      {message.parts.map((part, idx) => {
        if (part.type === "text") {
          return (
            <Markdown key={idx} remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => link(href, children) }}>
              {part.text}
            </Markdown>
          );
        }
        if (part.type === "file" && part.mediaType?.startsWith("image/")) {
          return (
            <img
              key={idx}
              src={part.url}
              alt={part.filename ?? ""}
              css={css`
                max-width: 100%;
                border-radius: 8px;
                margin-top: 6px;
              `}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
