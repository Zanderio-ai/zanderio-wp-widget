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
      --z-bg: ${tokens.color.bg};
      --z-bg-muted: ${tokens.color.bgMuted};
      --z-border: ${tokens.color.border};
      --z-radius-md: ${tokens.radius.md};
      --z-radius-lg: ${tokens.radius.lg};
      --z-radius-xl: ${tokens.radius.xl};
      --z-shadow-md: ${tokens.shadow.md};
      --z-shadow-brand: ${tokens.shadow.brand};
      --z-font: ${tokens.font.family};
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

    @keyframes z-sheet-up {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes z-pop-in {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
}
