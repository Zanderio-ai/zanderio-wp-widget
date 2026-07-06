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
  isLoading?: boolean;
  isMobile?: boolean;
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

const shimmerKeyframes = keyframes`
  0% { background-position: -150% 0; }
  100% { background-position: 150% 0; }
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

const skeletonCss = css`
  background: #e2e2e2
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%);
  background-size: 80% 100%;
  background-repeat: no-repeat;
  animation: ${shimmerKeyframes} 1.4s ease-in-out infinite;
`;

export function Launcher({ isOpen, isLoading, isMobile, brandColor, logoUrl, animation, position, onToggle }: LauncherProps) {
  // On mobile the launcher sits right above the chat window's send button,
  // and the chat header already has its own close (X) button — so once the
  // widget is open there's no need for this button and it would only overlap
  // the send button. Desktop keeps it since there's no overlap risk there.
  if (isMobile && isOpen) return null;

  // Animation only plays while the launcher is idle (closed) — opening the
  // chat window stops it, same as the dashboard preview.
  const attention =
    !isOpen && animation?.enabled
      ? css`
          animation: ${animation.type === "buzz" ? buzzKeyframes : wiggleKeyframes} 3s ease-in-out infinite;
        `
      : undefined;

  const [logoStatus, setLogoStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Until config arrives, and then until its logo image has actually finished
  // loading, show a neutral gray skeleton — never flash the brand color/chat
  // icon while a real logo is still on the way in. If there's no logo to show
  // at all (missing or failed to load), the skeleton stays put permanently
  // rather than falling back to a chat icon.
  const showSkeleton = !isOpen && (isLoading || !logoUrl || logoStatus !== "loaded");

  return (
    <button
      type="button"
      aria-label={isOpen ? "Close chat" : "Open chat"}
      onClick={onToggle}
      css={[
        base,
        placement(position),
        showSkeleton ? skeletonCss : css`background: ${brandColor};`,
        !showSkeleton && attention,
      ]}
    >
      {isOpen ? (
        <CloseIcon />
      ) : logoUrl ? (
        <LauncherLogo
          src={logoUrl}
          hidden={showSkeleton}
          onLoad={() => setLogoStatus("loaded")}
          onError={() => setLogoStatus("error")}
        />
      ) : null}
    </button>
  );
}

function LauncherLogo({
  src,
  hidden,
  onLoad,
  onError,
}: {
  src: string;
  hidden: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onLoad={onLoad}
      onError={onError}
      css={css`
        width: 110%;
        height: 110%;
        object-fit: cover;
        display: ${hidden ? "none" : "block"};
      `}
    />
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
