/**
 * @module ui/PoweredBy
 * @description Attribution footer pinned below the composer — "Powered by ⬤ Zanderio AI".
 *
 * The mark is imported from `assets/`; Vite inlines it as a data URI (see
 * `assetsInlineLimit` in vite.config.ts), so the bundle stays self-contained
 * and needs no asset URL resolvable from the host page.
 */

import { css } from "@emotion/react";
import markUrl from "../../assets/AiAgentColored-icon.svg";

const footer = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 12px 10px;
  background: var(--z-bg);
  flex-shrink: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--z-text-secondary);
  opacity: 0.85;
`;

const link = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: inherit;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.7;
  }
`;

const mark = css`
  width: 13px;
  height: 14px;
  display: block;
  flex-shrink: 0;
`;

export function PoweredBy() {
  return (
    <div css={footer}>
      <span>Powered by</span>
      <a
        css={link}
        href="https://zanderio.ai"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img css={mark} src={markUrl} alt="" aria-hidden="true" />
        Zanderio AI
      </a>
    </div>
  );
}
