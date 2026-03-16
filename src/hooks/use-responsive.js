/**
 * Zanderio Widget — useResponsive Hook
 *
 * Tracks the viewport width against a configurable breakpoint (default
 * 768 px) and returns `{ isMobile }`.  The widget uses this to swap
 * between `desktopPosition` and `mobilePosition` for the toggle button
 * and chat window.
 *
 * A `resize` event listener is registered once and cleaned up on unmount.
 *
 * @param {number} breakpoint — width threshold in pixels (default 768)
 * @returns {{ isMobile: boolean }}
 *
 * @module hooks/use-responsive
 */

import { useState, useEffect } from "react";

export function useResponsive(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);

  return { isMobile };
}
