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
export declare const tokens: {
    readonly color: {
        /** Brand primary — overridden per-store at runtime via the `--z-primary` CSS variable. */
        readonly primary: "#7E3FF2";
        readonly primaryDark: "#5B2DB8";
        readonly primaryLight: "#A569F7";
        readonly primaryLighter: "#F4EBFF";
        readonly text: "#111827";
        readonly textSecondary: "#6B7280";
        readonly textDisabled: "#9CA3AF";
        readonly bg: "#FFFFFF";
        readonly bgMuted: "#F9FAFB";
        readonly border: "#E5E7EB";
        readonly success: "#10B981";
        readonly error: "#EF4444";
        readonly warning: "#F59E0B";
        readonly grey: {
            readonly 50: "#F9FAFB";
            readonly 100: "#F3F4F6";
            readonly 200: "#E5E7EB";
            readonly 300: "#D1D5DB";
            readonly 400: "#9CA3AF";
            readonly 500: "#6B7280";
            readonly 600: "#4B5563";
            readonly 700: "#374151";
            readonly 800: "#1F2937";
        };
    };
    readonly radius: {
        readonly sm: "6px";
        readonly md: "8px";
        readonly lg: "12px";
        readonly xl: "16px";
        readonly pill: "999px";
    };
    readonly shadow: {
        readonly sm: "0px 1px 3px rgba(0,0,0,0.08)";
        readonly md: "0px 4px 12px rgba(0,0,0,0.08)";
        readonly brand: "0px 8px 24px rgba(126,63,242,0.24)";
    };
    readonly font: {
        readonly family: "\"Figtree\", system-ui, -apple-system, sans-serif";
    };
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
    readonly brand: {
        readonly primary: "var(--z-primary, #7E3FF2)";
        readonly primaryDark: "var(--z-primary-dark, #5B2DB8)";
    };
};
export type Tokens = typeof tokens;
//# sourceMappingURL=tokens.d.ts.map