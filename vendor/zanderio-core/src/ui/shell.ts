/**
 * @module ui/shell
 * @description Card chrome shared by every chat surface.
 *
 * `panel` is the compact shell used by the single-subject cards (order, action,
 * booking, crm, invoice, fallback) and by the interrupt step cards. `cardShell`
 * is the wider, full-width shell the multi-item commerce cards sit in.
 */

import { css } from "@emotion/react";
import { tokens } from "./tokens.js";

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

export const cardShell = css`
  width: 100%;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg};
  background: ${tokens.color.bg};
  padding: 12px;
`;
