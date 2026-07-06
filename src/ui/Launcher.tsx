/**
 * @module ui/Launcher
 * @description Floating toggle button that opens/closes the chat window.
 */

import { useState } from "react";
import { css, keyframes } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { WidgetConfig } from "@/config/types";

interface LauncherProps {
  isOpen: boolean;
  brandColor: string;
  logoUrl?: string | null;
  animation?: WidgetConfig["animation"];
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  onToggle: () => void;
}

// Attention-grabbing idle animations for the launcher, mirrored 1:1 from the
// dashboard widget-appearance preview (ChatWidgetRight.tsx) so the storefront
// widget matches what the merchant sees in the editor.
const wiggleKeyframes = keyframes`
  0%, 70%, 100% { transform: rotate(0deg); }
  73% { transform: rotate(-15deg); }
  76% { transform: rotate(12deg); }
  79% { transform: rotate(-10deg); }
  82% { transform: rotate(8deg); }
  85% { transform: rotate(-4deg); }
  88% { transform: rotate(0deg); }
`;

const buzzKeyframes = keyframes`
  0%, 70%, 100% { transform: translate(0, 0); }
  72%, 76%, 80%, 84%, 88% { transform: translate(-2px, 0); }
  74%, 78%, 82%, 86%, 90% { transform: translate(2px, 0); }
`;

const spinKeyframes = keyframes`
  to { transform: rotate(360deg); }
`;

const base = css`
  position: fixed;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border: none;
  padding: 0;
  border-radius: ${tokens.radius.pill};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
  box-shadow: var(--z-shadow-brand);
  transition: transform 0.15s ease;
  z-index: ${tokens.z.host};
  pointer-events: auto;
  &:hover {
    transform: scale(1.05);
  }
`;

function placement(position: LauncherProps["position"]) {
  if (position === "bottom-left") return css`left: 20px;`;
  if (position === "bottom-center") return css`left: 50%; transform: translateX(-50%);`;
  return css`right: 20px;`;
}

export function Launcher({ isOpen, brandColor, logoUrl, animation, position, onToggle }: LauncherProps) {
  // Animation only plays while the launcher is idle (closed) — opening the
  // chat window stops it, same as the dashboard preview.
  const attention =
    !isOpen && animation?.enabled
      ? css`
          animation: ${animation.type === "buzz" ? buzzKeyframes : wiggleKeyframes} 3s ease-in-out infinite;
        `
      : undefined;

  return (
    <button
      type="button"
      aria-label={isOpen ? "Close chat" : "Open chat"}
      onClick={onToggle}
      css={[base, placement(position), css`background: ${brandColor};`, attention]}
    >
      {isOpen ? <CloseIcon /> : logoUrl ? <LauncherLogo src={logoUrl} /> : <ChatIcon />}
    </button>
  );
}

function LauncherLogo({ src }: { src: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  if (status === "error") return <ChatIcon />;

  return (
    <>
      {status === "loading" && <Spinner />}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        css={css`
          width: 140%;
          height: 140%;
          object-fit: cover;
          display: ${status === "loaded" ? "block" : "none"};
        `}
      />
    </>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      css={css`
        width: 20px;
        height: 20px;
        border-radius: ${tokens.radius.pill};
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: #fff;
        animation: ${spinKeyframes} 0.7s linear infinite;
      `}
    />
  );
}

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4 21l4-1.4c1.2.4 2.6.6 4 .6 5.5 0 10-3.8 10-8.7S17.5 3 12 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
