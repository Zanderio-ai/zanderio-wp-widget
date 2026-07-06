/**
 * @module config/tokens
 * @description Design tokens, ported from client/app `src/config/theme.ts`.
 *
 * The widget does NOT pull in MUI (too heavy for a third-party embed). Instead
 * it mirrors the dashboard's visual language through these tokens, applied as
 * CSS custom properties on the shadow root (see ui/styles.ts) and read directly
 * in Emotion `css` blocks. Keep these in sync with the dashboard theme on
 * release — there is intentionally no live import (decoupled, standalone copy).
 */

export const tokens = {
  color: {
    /** Brand primary — overridden per-store by WidgetConfig.color at runtime. */
    primary: "#7E3FF2",
    primaryDark: "#5B2DB8",
    primaryLight: "#A569F7",
    primaryLighter: "#F4EBFF",

    text: "#111827",
    textSecondary: "#6B7280",
    textDisabled: "#9CA3AF",

    bg: "#FFFFFF",
    bgMuted: "#F9FAFB",
    border: "#E5E7EB",

    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",

    grey: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
    },
  },
  radius: { sm: "6px", md: "8px", lg: "12px", xl: "16px", pill: "999px" },
  shadow: {
    sm: "0px 1px 3px rgba(0,0,0,0.08)",
    md: "0px 4px 12px rgba(0,0,0,0.08)",
    brand: "0px 8px 24px rgba(126,63,242,0.24)",
  },
  font: {
    family: '"Figtree", system-ui, -apple-system, sans-serif',
  },
  z: { host: 2147483647 },
} as const;

export type Tokens = typeof tokens;
