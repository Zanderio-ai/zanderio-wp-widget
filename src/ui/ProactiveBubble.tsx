/**
 * @module ui/ProactiveBubble
 * @description Legacy single-timer proactive nudge above the launcher.
 *
 * Driven by `WidgetConfig.proactive` (enabled / message / delaySeconds /
 * maxPerSession). Appears once the delay elapses while the window is closed,
 * respects a per-page-load display cap (in-memory ref), and is dismissable.
 * Mirrors the proactive behaviour of the dashboard widget-appearance editor.
 *
 * Renders the shared {@link NudgeBubble} presentation — kept as its own
 * component (rather than folded into `core/nudges`) because it is a
 * separate, simpler, always-on merchant setting with no server round-trip,
 * not one of the gated multi-trigger nudges. `App.tsx` suppresses this
 * bubble whenever an engine-driven nudge is active so only one ever shows.
 */

import { useEffect, useRef, useState } from "react";
import { NudgeBubble } from "./NudgeBubble";
import type { WidgetConfig } from "@/config/types";

interface ProactiveBubbleProps {
  config: WidgetConfig;
  brandColor: string;
  isOpen: boolean;
  suppressed?: boolean;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  onOpen: () => void;
}

export function ProactiveBubble({ config, brandColor, isOpen, suppressed, position, onOpen }: ProactiveBubbleProps) {
  const { enabled, message, delaySeconds, maxPerSession } = config.proactive;
  const [visible, setVisible] = useState(false);
  const shownCount = useRef(0);

  useEffect(() => {
    if (!enabled || isOpen) return;
    if (maxPerSession > 0 && shownCount.current >= maxPerSession) return;

    const timer = setTimeout(() => {
      shownCount.current += 1;
      setVisible(true);
    }, Math.max(0, delaySeconds) * 1000);

    return () => clearTimeout(timer);
  }, [enabled, isOpen, delaySeconds, maxPerSession]);

  // The chat opening (or a fresh session render) hides the nudge.
  useEffect(() => {
    if (isOpen) setVisible(false);
  }, [isOpen]);

  if (!enabled || !visible || isOpen || !message || suppressed) return null;

  return (
    <NudgeBubble
      message={message}
      name={config.name}
      brandColor={brandColor}
      position={position}
      onOpen={onOpen}
      onDismiss={() => setVisible(false)}
    />
  );
}
