/**
 * @module ui/tokens
 * @description Design tokens for the shared chat artifacts.
 *
 * This is the single source of truth for artifact styling, consumed by both the
 * embeddable widget and the dashboard playground. It deliberately carries no
 * MUI dependency — the widget is a third-party embed and cannot afford one — so
 * the dashboard derives its MUI palette from these values rather than the other
 * way round. Previously this table existed twice (widget `src/config/tokens.ts`
 * and dashboard `src/config/theme.ts`) and was kept aligned by hand.
 *
 * Scope note: only artifact-relevant tokens live here. Widget shell concerns
 * (host z-index, launcher sizing) stay in the widget.
 */
export const tokens = {
    color: {
        /** Brand primary — overridden per-store at runtime via the `--z-primary` CSS variable. */
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
            800: "#1F2937",
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
    /**
     * Themed accents — use these, not `color.primary`, for anything that should
     * follow the host's brand.
     *
     * `color.primary` above is the literal Zanderio purple: the canonical default
     * a host uses when it has no brand colour of its own. These read a CSS custom
     * property instead, so one card renders in the merchant's colour inside the
     * widget and in the store's colour inside the dashboard playground, with the
     * literal as the fallback when nothing sets the variable.
     *
     * Hosts set it on any ancestor of the cards:
     *   widget — `--z-primary` on the shadow root (already done, in ui/styles.ts)
     *   portal — `--z-primary` on the playground container
     */
    brand: {
        primary: "var(--z-primary, #7E3FF2)",
        primaryDark: "var(--z-primary-dark, #5B2DB8)",
    },
};
//# sourceMappingURL=tokens.js.map