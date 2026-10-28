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
import type { ChatUIMessage } from "../chat/types.js";
type MdComponents = Record<string, ComponentType<{
    href?: string;
    children?: ReactNode;
}>>;
export interface MessageContentProps {
    message: ChatUIMessage;
    /**
     * Override or extend the markdown renderers. Merged over the defaults, so
     * passing `{ a: ... }` replaces the YouTube-aware link renderer.
     */
    mdComponents?: MdComponents;
}
export declare function MessageContent({ message, mdComponents }: MessageContentProps): import("@emotion/react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=MessageContent.d.ts.map