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

const youtubeThumb = css`
  display: block;
  position: relative;
  width: 100%;
  max-width: 280px;
  margin: 12px 0;
  border-radius: 10px;
  overflow: hidden;
  line-height: 0;
  /* Force a clean 16:9 frame; object-fit crops away the black letterbox bars
     that YouTube's 4:3 hqdefault thumbnail would otherwise show. */
  aspect-ratio: 16 / 9;
  background: #000;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const playButton = css`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: "";
    border-style: solid;
    border-width: 9px 0 9px 15px;
    border-color: transparent transparent transparent #fff;
    margin-left: 3px;
  }
`;

const youtubeBadge = css`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px 3px 5px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  color: #0f0f0f;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;

  svg {
    display: block;
  }
`;

// Inline YouTube glyph (red rounded rect + white triangle) — no asset load, so
// the badge always renders even under a strict CSP / shadow-DOM bundle.
const youtubeIcon = (
  <svg width="18" height="13" viewBox="0 0 28 20" aria-hidden="true">
    <path
      d="M27.4 3.1a3.52 3.52 0 0 0-2.48-2.49C22.74 0 14 0 14 0S5.26 0 3.08.61A3.52 3.52 0 0 0 .6 3.1 36.7 36.7 0 0 0 0 10a36.7 36.7 0 0 0 .6 6.9 3.52 3.52 0 0 0 2.48 2.49C5.26 20 14 20 14 20s8.74 0 10.92-.61a3.52 3.52 0 0 0 2.48-2.49A36.7 36.7 0 0 0 28 10a36.7 36.7 0 0 0-.6-6.9Z"
      fill="#FF0000"
    />
    <path d="M11.2 14.29 18.5 10 11.2 5.71v8.58Z" fill="#fff" />
  </svg>
);

// Valid YouTube video IDs are 11 chars from this alphabet; validating avoids
// rendering a broken thumbnail for a channel/playlist/garbage path.
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function getYouTubeId(url: string): string | null {
  let candidate: string | null = null;
  try {
    const u = new URL(url);
    // Normalize host variants: www., m. (mobile), music., and the privacy domain.
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
    if (host === "youtu.be") {
      candidate = u.pathname.slice(1).split("/")[0] || null;
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      // watch?v=<id> (v may ride along with any path), or a /embed|shorts|live|v/<id> path.
      candidate =
        u.searchParams.get("v") ??
        (u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ?? null);
    }
  } catch {
    return null;
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

const link = (href?: string, children?: React.ReactNode) => {
  const videoId = href ? getYouTubeId(href) : null;
  if (videoId) {
    return (
      <a css={youtubeThumb} href={href} target="_blank" rel="noopener noreferrer">
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt="YouTube video thumbnail"
          loading="lazy"
          onError={(e) => {
            // maxresdefault isn't uploaded for every video — fall back to the
            // always-present hqdefault (object-fit crops its 4:3 letterbox).
            const img = e.currentTarget;
            if (img.dataset.fallback !== "1") {
              img.dataset.fallback = "1";
              img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
          }}
        />
        <span css={youtubeBadge}>
          {youtubeIcon}
          YouTube
        </span>
        <span css={playButton} />
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};

const YOUTUBE_URL_IN_PARENS = /\((https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/[^\s()]+)\)/g;

function stripParensAroundYouTubeLinks(text: string): string {
  return text.replace(YOUTUBE_URL_IN_PARENS, "$1");
}

export function MessageContent({ message }: { message: ChatUIMessage }) {
  return (
    <div css={markdown}>
      {message.parts.map((part, idx) => {
        if (part.type === "text") {
          return (
            <Markdown key={idx} remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => link(href, children) }}>
              {stripParensAroundYouTubeLinks(part.text)}
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
