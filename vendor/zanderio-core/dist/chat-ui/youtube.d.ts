/**
 * @module chat-ui/youtube
 * @description Turn a YouTube link in an AI reply into a thumbnail card.
 *
 * Both apps carried their own copy of this, and the dashboard's even said
 * "Kept in sync with the storefront widget's detection" in its header — an
 * invitation to drift that this removes.
 */
/**
 * Accepts every video-link shape an AI reply may use (youtu.be, watch?v=,
 * embed/shorts/live/v paths, www./m./music. hosts and youtube-nocookie.com).
 * Channel and playlist links return null and stay plain links.
 */
export declare function getYouTubeId(url?: string): string | null;
/** Unwrap `(https://youtu.be/…)` so the URL autolinks cleanly into a thumbnail. */
export declare function stripParensAroundYouTubeLinks(text: string): string;
export declare function YouTubeThumbnail({ href, videoId }: {
    href?: string;
    videoId: string;
}): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=youtube.d.ts.map