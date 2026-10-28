/**
 * @module artifacts/CrmCard
 * @description Confirmation card for conversational lead capture.
 *
 * Emitted once by `crm_submit` as `Artifact(type="crm", data=CrmData(...))`
 * right after the write is queued. `status` is always "submitted", never
 * "created": the actual provider write (monday, etc.) happens later in a
 * background job, so there is no record id or url to show yet — this only
 * confirms the visitor's details were taken, not that the CRM record exists.
 */

import { css } from "@emotion/react";
import { tokens } from "../ui/tokens.js";
import type { Artifact } from "../chat/types.js";

const shell = css`
  width: 100%;
  max-width: 340px;
  background: ${tokens.color.bg};
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg};
  box-shadow: ${tokens.shadow.sm};
  overflow: hidden;
`;

const accentBar = css`
  height: 4px;
  background: ${tokens.color.success};
`;

const body = css`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
`;

const badge = css`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${tokens.color.success}1A;
  color: ${tokens.color.success};
`;

const heading = css`
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
`;

const sub = css`
  font-size: 11px;
  color: ${tokens.color.textSecondary};
`;

export function CrmCard({ artifact }: { artifact: Artifact }) {
  const { title, subtitle } = artifact;

  return (
    <div css={shell}>
      <div css={accentBar} />
      <div css={body}>
        <div css={badge}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 8.5V18a2 2 0 002 2h14a2 2 0 002-2V8.5M3 8.5l9 5.5 9-5.5M3 8.5L12 3l9 5.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div css={css`min-width: 0;`}>
          <div css={heading}>{title || "We'll be in touch"}</div>
          {subtitle && <div css={sub}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
