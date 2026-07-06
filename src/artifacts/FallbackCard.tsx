/**
 * @module artifacts/FallbackCard
 * @description Renderer for artifact types without a dedicated layout — shows
 * the title/subtitle and the raw type so unknown artifacts degrade gracefully.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import { panel, headerRow, cardTitle } from "./shell";

export function FallbackCard({ artifact }: { artifact: Artifact }) {
  if (!artifact.title && !artifact.subtitle) return null;
  return (
    <div css={panel}>
      <div css={headerRow}>
        <span css={cardTitle}>{artifact.title ?? "Content"}</span>
        {artifact.type && (
          <span css={css`font-size: 10px; color: ${tokens.color.textSecondary}; border: 1px solid ${tokens.color.border}; border-radius: 6px; padding: 2px 6px;`}>
            {artifact.type}
          </span>
        )}
      </div>
      {artifact.subtitle && <div css={css`font-size: 13px; color: ${tokens.color.textSecondary}; margin-top: 6px;`}>{artifact.subtitle}</div>}
    </div>
  );
}
