import { jsx as _jsx, jsxs as _jsxs } from "@emotion/react/jsx-runtime";
/**
 * @module chat-ui/SuggestedQuestions
 * @description Starter-question cards shown on an empty chat, right above the
 * composer. The list is decided by the server (widget bootstrap / playground
 * settings) — this component only renders and reports selection.
 *
 * Ported from the widget's `ui/SuggestedQuestions.tsx`, itself a 1:1 port of
 * the dashboard Playground's MUI `SuggestedQuestionCards`, so the two surfaces
 * kept drifting apart by hand. Stacked full-width cards, 12px radius, divider
 * border, brand-tinted hover with a trailing arrow, 60ms staggered fade-up.
 *
 * Surface and border colours read the host's `--z-bg` / `--z-border` variables
 * (set on the widget's shadow root) and fall back to the tokens, so the card
 * also renders correctly in a host that sets neither.
 */
import { css, keyframes } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
const STAGGER_MS = 60;
const fadeUp = keyframes `
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;
const container = (compact) => css `
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 ${compact ? "12px" : "16px"} 8px;
`;
// color-mix keeps the brand tints valid for any color format the merchant
// saved (3/6-digit hex, rgb(), named) — hex-alpha suffixes only work on #RRGGBB.
const card = (brandColor, compact, index) => css `
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  border: 1px solid var(--z-border, ${tokens.color.border});
  border-radius: ${tokens.radius.lg};
  background: var(--z-bg, ${tokens.color.bg});
  color: ${tokens.color.grey[800]};
  font-size: ${compact ? "12.5px" : "13px"};
  font-weight: 500;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${index * STAGGER_MS}ms;

  & .z-suggest-arrow {
    flex-shrink: 0;
    margin-left: auto;
    width: 16px;
    height: 16px;
    fill: ${brandColor};
    opacity: 0;
    transform: translateX(-4px);
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  &:hover:not(:disabled) {
    background: color-mix(in srgb, ${brandColor} 4%, var(--z-bg, ${tokens.color.bg}));
    border-color: color-mix(in srgb, ${brandColor} 50%, transparent);
    box-shadow: 0 2px 10px color-mix(in srgb, ${brandColor} 12%, transparent);
  }

  &:hover:not(:disabled) .z-suggest-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  &:focus-visible {
    outline: 2px solid ${brandColor};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
const text = css `
  flex: 1;
  min-width: 0;
`;
export function SuggestedQuestions({ questions, brandColor, compact = false, onSelect, disabled = false, }) {
    if (questions.length === 0)
        return null;
    return (_jsx("div", { css: container(compact), role: "group", "aria-label": "Suggested questions", children: questions.map((question, index) => (_jsxs("button", { type: "button", css: card(brandColor, compact, index), disabled: disabled, onClick: () => onSelect(question), children: [_jsx("span", { css: text, children: question }), _jsx("svg", { className: "z-suggest-arrow", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M5 13h11.17l-4.88 4.88c-.39.39-.39 1.03 0 1.42s1.02.39 1.41 0l6.59-6.59a.996.996 0 0 0 0-1.41l-6.58-6.6a.996.996 0 1 0-1.41 1.41L16.17 11H5c-.55 0-1 .45-1 1s.45 1 1 1" }) })] }, question))) }));
}
//# sourceMappingURL=SuggestedQuestions.js.map