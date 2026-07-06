/**
 * @module artifacts/commerce/ComparisonCard
 * @description Evaluation-stage, dual-action columns (2–3 items). Spec rows show
 * only fields we actually hold (price/type/stock/colours). A `badge` flags a
 * featured column. Reads `artifact.data.items`.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import {
  Badge,
  CartButton,
  ProductThumb,
  SaleFlag,
  TypeLabel,
  ViewButton,
  badgeTone,
  formatPrice,
  type CommerceItem,
} from "./shared";
import { cardShell } from "./DiscoveryCard";

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        padding: 4px 0;
        border-bottom: 1px solid ${tokens.color.border};
        &:last-of-type {
          border-bottom: none;
        }
      `}
    >
      <span css={css`color: ${tokens.color.textSecondary};`}>{label}</span>
      <span css={css`font-weight: 500;`}>{children}</span>
    </div>
  );
}

function Column({ item, featured }: { item: CommerceItem; featured: boolean }) {
  const colours = item.colour_swatches?.length ?? 0;
  return (
    <div
      css={css`
        flex: 0 0 168px;
        background: ${tokens.color.bg};
        border-radius: ${tokens.radius.lg};
        border: ${featured ? `2px solid ${tokens.color.primary}` : `1px solid ${tokens.color.border}`};
        padding: 10px;
      `}
    >
      <div css={css`min-height: 18px; margin-bottom: 6px; text-align: center;`}>
        {item.badge && <Badge label={item.badge} tone={badgeTone(item.badge)} />}
      </div>
      <ProductThumb image={item.image} alt={item.title} height={92}>
        <SaleFlag discount_pct={item.on_sale ? item.discount_pct : 0} />
      </ProductThumb>
      <div
        css={css`
          font-size: 12px;
          font-weight: 500;
          line-height: 1.3;
          margin-top: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        `}
      >
        {item.title ?? "Product"}
      </div>
      {item.brand && <div css={css`font-size: 10px; color: ${tokens.color.textSecondary}; margin-bottom: 6px;`}>{item.brand}</div>}

      <SpecRow label="Price">{formatPrice(item.price, item.currency) ?? "—"}</SpecRow>
      {item.product_type && <SpecRow label="Type">{item.product_type}</SpecRow>}
      <SpecRow label="Stock">{item.in_stock === false ? "Out" : "In stock"}</SpecRow>
      {colours > 0 && <SpecRow label="Colours">{colours}</SpecRow>}

      <div css={css`display: flex; gap: 5px; margin-top: 10px;`}>
        <ViewButton url={item.url} fullWidth />
        <CartButton item={item} label="Cart" fullWidth />
      </div>
    </div>
  );
}

export function ComparisonCard({ artifact }: { artifact: Artifact }) {
  const items = (artifact.data as { items?: CommerceItem[] })?.items ?? [];
  if (!items.length) return null;
  return (
    <div css={cardShell}>
      <TypeLabel>{artifact.title ?? "Comparison"}</TypeLabel>
      <div
        css={css`
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          &::-webkit-scrollbar {
            display: none;
          }
        `}
      >
        {items.map((item, i) => (
          <Column key={item.doc_id ?? i} item={item} featured={Boolean(item.badge)} />
        ))}
      </div>
    </div>
  );
}
