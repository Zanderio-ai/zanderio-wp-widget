/**
 * @module chat-ui/MessageContent
 * @description Render a UIMessage's parts — markdown text and image files.
 *
 * Artifacts (`data-artifact`) and interrupts (`data-interrupt`) are rendered by
 * the host's message list, not here, so they can receive chat actions.
 *
 * YouTube links become thumbnail cards. Everything else renders as GFM
 * markdown, so tables and strikethrough from the agent come out right.
 */

import type { ComponentType, ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { css } from "@emotion/react";
import type { ChatUIMessage } from "../chat/types.js";
import { getYouTubeId, stripParensAroundYouTubeLinks, YouTubeThumbnail } from "./youtube.js";

/**
 * Font size is deliberately inherited rather than set here — the host's message
 * bubble owns it, and the dashboard's is responsive.
 */
const markdown = css`
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
    /* Fallback matters: only the widget defines --z-bg-muted on its shadow root. */
    background: var(--z-bg-muted, #f9fafb);
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 0.86em;
  }
`;

const image = css`
  max-width: 100%;
  border-radius: 8px;
  margin-top: 6px;
`;

type MdComponents = Record<string, ComponentType<{ href?: string; children?: ReactNode }>>;

function LinkOrThumbnail({ href, children }: { href?: string; children?: ReactNode }) {
  const videoId = getYouTubeId(href);
  if (videoId) return <YouTubeThumbnail href={href} videoId={videoId} />;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const defaultComponents: MdComponents = { a: LinkOrThumbnail };

export interface MessageContentProps {
  message: ChatUIMessage;
  /**
   * Override or extend the markdown renderers. Merged over the defaults, so
   * passing `{ a: ... }` replaces the YouTube-aware link renderer.
   */
  mdComponents?: MdComponents;
}

export function MessageContent({ message, mdComponents }: MessageContentProps) {
  const components = mdComponents ? { ...defaultComponents, ...mdComponents } : defaultComponents;

  return (
    <div css={markdown}>
      {message.parts.map((part, idx) => {
        if (part.type === "text") {
          return (
            <Markdown key={idx} remarkPlugins={[remarkGfm]} components={components}>
              {stripParensAroundYouTubeLinks(part.text)}
            </Markdown>
          );
        }
        if (part.type === "file" && part.mediaType?.startsWith("image/")) {
          return <img key={idx} src={part.url} alt={part.filename ?? ""} css={image} />;
        }
        return null;
      })}
    </div>
  );
}
