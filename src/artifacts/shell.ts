/**
 * @module artifacts/shell
 * @description Shared Emotion styles for the non-commerce artifact cards
 * (order/action/booking/invoice/fallback) so they share one visual shell.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";

export const panel = css`
  width: 100%;
  max-width: 340px;
  background: ${tokens.color.bg};
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg};
  box-shadow: ${tokens.shadow.sm};
  padding: 14px;
`;

export const headerRow = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

export const cardTitle = css`
  font-size: 14px;
  font-weight: 700;
`;
