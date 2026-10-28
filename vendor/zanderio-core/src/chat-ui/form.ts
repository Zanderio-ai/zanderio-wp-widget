/**
 * @module chat-ui/form
 * @description Form control styles shared by the interrupt (HITL) cards, so the
 * booking form and the lead form cannot drift apart visually.
 */

import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";

export const title = css`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
`;

export const subtitle = css`
  display: block;
  font-size: 12px;
  color: ${tokens.color.textSecondary};
  margin-bottom: 10px;
`;

export const fieldLabel = css`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.color.textSecondary};
  margin-bottom: 4px;
`;

export const input = css`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.md};
  padding: 10px 12px;
  /* 16px avoids iOS Safari's auto-zoom-on-focus for inputs under 16px. */
  font-size: 16px;
  font-family: ${tokens.font.family};
  outline: none;
  &:focus {
    border-color: ${tokens.brand.primary};
  }
`;

export const fieldGroup = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const summaryLine = css`
  font-size: 13px;
  color: ${tokens.color.textSecondary};
  margin-bottom: 10px;
`;

export const actionsRow = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
`;

export const spacer = css`
  flex: 1;
`;

export const ghostButton = css`
  border: none;
  background: transparent;
  color: ${tokens.color.textSecondary};
  font-size: 13px;
  font-weight: 600;
  font-family: ${tokens.font.family};
  cursor: pointer;
  padding: 8px 4px;
`;

export const confirmButton = (brandColor: string) => css`
  border: none;
  border-radius: ${tokens.radius.lg};
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: ${tokens.font.family};
  background: ${brandColor};
  color: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Pill used for day tabs and choice chips.
 *
 * Takes `brandColor` as a value rather than reading `--z-primary`, because the
 * selected state needs an alpha tint (`${brandColor}0F`) and you cannot append
 * hex alpha to a `var()` reference.
 */
export const pill = (selected: boolean, brandColor: string) => css`
  flex-shrink: 0;
  border: 1px solid ${selected ? brandColor : tokens.color.border};
  background: ${selected ? `${brandColor}0F` : tokens.color.bg};
  border-radius: ${tokens.radius.lg};
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: ${tokens.font.family};
  color: ${tokens.color.text};
  cursor: pointer;
  white-space: nowrap;
`;

