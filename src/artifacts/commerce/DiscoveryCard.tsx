/**
 * @module artifacts/commerce/DiscoveryCard
 * @description Browse-stage commerce artifact — a horizontal scroller of
 * view-led product tiles (cart de-emphasized as an icon). Reads
 * `artifact.data.items` (CommerceItem[]). Port of the client/app card.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import {
  Badge,
  CartIconButton,
  ColourSwatches,
  OutOfStockVeil,
  PriceRow,
  ProductThumb,
  SaleFlag,
  TypeLabel,
  ViewButton,
  badgeTone,
  type CommerceItem,
} from "./shared";

function Tile({ item }: { item: CommerceItem }) {
  return (
    <div
      css={css`
        min-width: 158px;
        max-width: 158px;
        flex-shrink: 0;
        border: 1px solid ${tokens.color.border};
        border-radius: ${tokens.radius.lg};
        background: ${tokens.color.bg};
        display: flex;
        flex-direction: column;
        padding: 8px;
        scroll-snap-align: start;
      `}
    >
      <ProductThumb image={item.image} alt={item.title} height={104}>
        <SaleFlag discount_pct={item.on_sale ? item.discount_pct : 0} />
        <OutOfStockVeil in_stock={item.in_stock} />
      </ProductThumb>

      {item.badge && (
        <div css={css`margin-top: 6px;`}>
          <Badge label={item.badge} tone={badgeTone(item.badge)} />
        </div>
      )}

      <div css={css`margin-top: 6px; flex: 1;`}>
        {item.brand && <div css={css`font-size: 10px; color: ${tokens.color.textSecondary};`}>{item.brand}</div>}
        <div
          css={css`
            font-size: 12px;
            font-weight: 500;
            line-height: 1.35;
            margin-bottom: 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          `}
        >
          {item.title ?? "Product"}
        </div>
        <PriceRow price={item.price} price_max={item.price_max} compare_at_price={item.compare_at_price} currency={item.currency} />
        <ColourSwatches swatches={item.colour_swatches} />
      </div>

      <div css={css`display: flex; gap: 5px; margin-top: 8px; align-items: stretch;`}>
        <ViewButton url={item.url} fullWidth />
        <CartIconButton item={item} />
      </div>
    </div>
  );
}

export function DiscoveryCard({ artifact }: { artifact: Artifact }) {
  const items = (artifact.data as { items?: CommerceItem[] })?.items ?? [];
  if (!items.length) return null;
  return (
    <div css={cardShell}>
      {artifact.title && <TypeLabel>{artifact.title}</TypeLabel>}
      <div
        css={css`
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          &::-webkit-scrollbar {
            display: none;
          }
        `}
      >
        {items.map((item, i) => (
          <Tile key={item.doc_id ?? i} item={item} />
        ))}
      </div>
    </div>
  );
}

export const cardShell = css`
  width: 100%;
  border: 1px solid ${tokens.color.border};
  border-radius: ${tokens.radius.lg};
  background: ${tokens.color.bg};
  padding: 12px;
`;
