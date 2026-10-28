/**
 * @module ui/styles
 * @description Global stylesheet for the shadow root, derived from design tokens.
 *
 * Exposes tokens as CSS custom properties scoped to `:host`, plus a small reset.
 * Components style themselves with Emotion `css`, but read brand/spacing values
 * from these variables so the runtime brand color (WidgetConfig.color) can be
 * swapped on one element without re-rendering Emotion styles.
 */

import { tokens } from "@/config/tokens";

export function globalStyles(brandColor: string): string {
  return `
    :host {
      --z-primary: ${brandColor};
      --z-primary-dark: ${tokens.color.primaryDark};
      --z-text: ${tokens.color.text};
      --z-text-secondary: ${tokens.color.textSecondary};
      --z-text-disabled: ${tokens.color.textDisabled};
      --z-bg: ${tokens.color.bg};
      --z-bg-muted: ${tokens.color.bgMuted};
      --z-border: ${tokens.color.border};
      --z-radius-md: ${tokens.radius.md};
      --z-radius-lg: ${tokens.radius.lg};
      --z-radius-xl: ${tokens.radius.xl};
      --z-shadow-md: ${tokens.shadow.md};
      --z-shadow-brand: ${tokens.shadow.brand};
      --z-font: ${tokens.font.family};

      /*
       * The widget's palette is a fixed light one, but color-scheme is an
       * inherited property that crosses the shadow boundary — so on a host page
       * that declares \`color-scheme: dark\`, the UA system colors used by form
       * controls (fieldtext, field, and the placeholder/selection colors derived
       * from them) flip to their dark variants inside our shadow root. That is
       * what made typed text render white-on-white in the composer. Pinning the
       * scheme here keeps every UA-supplied color aligned with our tokens.
       */
      color-scheme: light;
    }

    #zanderio-root, #zanderio-root * {
      box-sizing: border-box;
      margin: 0;
      font-family: var(--z-font);
    }

    #zanderio-root {
      color: var(--z-text);
      line-height: 1.5;
    }

    /*
     * Form controls don't inherit color/font from their container by default,
     * so they'd otherwise fall back to UA system colors. Wrapped in :where() so
     * the whole selector has zero specificity and any component's Emotion class
     * still wins.
     */
    :where(#zanderio-root) :where(input, textarea, select, button) {
      color: var(--z-text);
      font-family: var(--z-font);
    }

    @keyframes z-bounce-dot {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    @keyframes z-msg-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes z-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes z-pop-in {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
}
