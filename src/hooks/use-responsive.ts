/**
 * @module hooks/use-responsive
 * @description Viewport detection (mobile vs desktop) via matchMedia.
 */

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 640px)";

export function useResponsive() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return { isMobile };
}
