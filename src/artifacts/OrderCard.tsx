/**
 * @module artifacts/OrderCard
 * @description Order-status artifact — line items, total, tracking. Reads
 * `artifact.data.{order_id,status,items,total,currency,tracking_*,carrier,...}`.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import { panel, headerRow, cardTitle } from "./shell";

const STATUS_COLORS: Record<string, string> = {
  delivered: tokens.color.success,
  shipped: tokens.color.primary,
  processing: tokens.color.warning,
  cancelled: tokens.color.error,
};

interface OrderItem {
  name?: string;
  title?: string;
  quantity?: number;
  price?: number;
}

export function OrderCard({ artifact }: { artifact: Artifact }) {
  const data = (artifact.data ?? {}) as Record<string, unknown>;
  const status = (data.status as string) ?? "";
  const items = (data.items as OrderItem[]) ?? [];
  const total = data.total as number | undefined;
  const currency = (data.currency as string) ?? "USD";
  const sym = currency === "USD" ? "$" : `${currency} `;
  const trackingNumber = data.tracking_number as string | undefined;
  const trackingUrl = data.tracking_url as string | undefined;
  const statusColor = STATUS_COLORS[status.toLowerCase()] ?? tokens.color.grey[400];

  return (
    <div css={panel}>
      <div css={headerRow}>
        <span css={cardTitle}>{artifact.title ?? `Order ${data.order_id ?? ""}`}</span>
        {status && (
          <span css={css`font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; color: #fff; background: ${statusColor};`}>
            {status}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div css={css`margin: 10px 0;`}>
          {items.map((it, i) => (
            <div
              key={i}
              css={css`
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                font-size: 13px;
                color: ${tokens.color.textSecondary};
                border-bottom: ${i < items.length - 1 ? `1px solid ${tokens.color.border}` : "none"};
              `}
            >
              <span>{it.name ?? it.title ?? "Item"} × {it.quantity ?? 1}</span>
              {it.price != null && <span css={css`font-weight: 500; color: ${tokens.color.text};`}>{sym}{it.price.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      )}

      {total != null && <div css={css`font-size: 13px; font-weight: 700; margin-bottom: 8px;`}>Total: {sym}{total.toFixed(2)}</div>}

      {trackingNumber && (
        <div css={css`display: flex; align-items: center; gap: 6px; padding: 8px; background: ${tokens.color.grey[50]}; border-radius: 8px; font-size: 12px; color: ${tokens.color.textSecondary};`}>
          <span>📦 {trackingNumber}</span>
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" css={css`margin-left: auto; font-weight: 600; color: ${tokens.color.primary};`}>
              Track
            </a>
          )}
        </div>
      )}
    </div>
  );
}
