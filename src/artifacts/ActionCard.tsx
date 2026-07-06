/**
 * @module artifacts/ActionCard
 * @description Single call-to-action artifact (book / open / etc.). Accepts both
 * the protocol shape (action in `data`) and a legacy `data.items[0]` wrapper.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import { panel, cardTitle } from "./shell";

export function ActionCard({ artifact }: { artifact: Artifact }) {
  const data = artifact.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const action = ((data.items as Array<Record<string, unknown>>)?.[0] ?? data) as Record<string, unknown>;
  const label = (action.label as string) ?? artifact.title ?? "Action";
  const url = action.url as string | undefined;
  const secondary = action.style === "secondary";

  const styles = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border: 1px solid ${secondary ? tokens.color.border : tokens.color.primary};
    background: ${secondary ? tokens.color.grey[50] : tokens.color.primary};
    color: ${secondary ? tokens.color.text : "#fff"};
  `;

  return (
    <div css={panel}>
      {artifact.title && <div css={[cardTitle, css`margin-bottom: 10px;`]}>{artifact.title}</div>}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" css={styles}>
          {label}
        </a>
      ) : (
        <button type="button" css={styles}>
          {label}
        </button>
      )}
    </div>
  );
}
