import { jsx as _jsx } from "@emotion/react/jsx-runtime";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { css } from "@emotion/react";
import { getYouTubeId, stripParensAroundYouTubeLinks, YouTubeThumbnail } from "./youtube.js";
/**
 * Font size is deliberately inherited rather than set here — the host's message
 * bubble owns it, and the dashboard's is responsive.
 */
const markdown = css `
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
const image = css `
  max-width: 100%;
  border-radius: 8px;
  margin-top: 6px;
`;
function LinkOrThumbnail({ href, children }) {
    const videoId = getYouTubeId(href);
    if (videoId)
        return _jsx(YouTubeThumbnail, { href: href, videoId: videoId });
    return (_jsx("a", { href: href, target: "_blank", rel: "noopener noreferrer", children: children }));
}
const defaultComponents = { a: LinkOrThumbnail };
export function MessageContent({ message, mdComponents }) {
    const components = mdComponents ? { ...defaultComponents, ...mdComponents } : defaultComponents;
    return (_jsx("div", { css: markdown, children: message.parts.map((part, idx) => {
            if (part.type === "text") {
                return (_jsx(Markdown, { remarkPlugins: [remarkGfm], components: components, children: stripParensAroundYouTubeLinks(part.text) }, idx));
            }
            if (part.type === "file" && part.mediaType?.startsWith("image/")) {
                return _jsx("img", { src: part.url, alt: part.filename ?? "", css: image }, idx);
            }
            return null;
        }) }));
}
//# sourceMappingURL=MessageContent.js.map