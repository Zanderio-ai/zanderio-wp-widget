/**
 * @module artifacts/commerce/RecommendationCard
 * @description Decision-stage, cart-led ranked list. Top pick gets an accent
 * rail + full Add-to-cart; the rest keep View + an icon cart. Reads
 * `artifact.data.items`. Items may carry agent-written `badge`/`pitch`.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import {
  Badge,
  CartButton,
  CartIconButton,
  ProductThumb,
  TypeLabel,
  ViewButton,
  badgeTone,
  formatPrice,
  type CommerceItem,
} from "./shared";
import { cardShell } from "./DiscoveryCard";

function Row({ item, rank, top }: { item: CommerceItem; rank: number; top: boolean }) {
  const priceStr = formatPrice(item.price, item.currency);
  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: 60px 1fr;
        gap: 10px;
        padding: 10px;
        background: ${tokens.color.bg};
        border: 1px solid ${tokens.color.border};
        border-left: ${top ? `3px solid ${tokens.color.primary}` : `1px solid ${tokens.color.border}`};
        border-radius: ${top ? "0 12px 12px 0" : tokens.radius.lg};
      `}
    >
      <div>
        <ProductThumb image={item.image} alt={item.title} ratio="1/1" />
        <div css={css`font-size: 10px; color: ${tokens.color.textSecondary}; text-align: center; margin-top: 4px;`}>#{rank}</div>
      </div>
      <div css={css`min-width: 0;`}>
        {item.badge && (
          <div css={css`margin-bottom: 4px;`}>
            <Badge label={item.badge} tone={badgeTone(item.badge)} />
          </div>
        )}
        <div css={css`font-size: 13px; font-weight: 500; line-height: 1.3;`}>{item.title ?? "Product"}</div>
        {item.brand && <div css={css`font-size: 10px; color: ${tokens.color.textSecondary};`}>{item.brand}</div>}
        {item.pitch && <div css={css`font-size: 11px; color: ${tokens.color.textSecondary}; line-height: 1.4; margin-top: 4px;`}>{item.pitch}</div>}
        <div css={css`display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px;`}>
          {priceStr && <span css={css`font-size: 14px; font-weight: 600;`}>{priceStr}</span>}
          <div css={css`display: flex; gap: 6px; align-items: center;`}>
            <ViewButton url={item.url} />
            {top ? <CartButton item={item} /> : <CartIconButton item={item} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecommendationCard({ artifact }: { artifact: Artifact }) {
  const items = (artifact.data as { items?: CommerceItem[] })?.items ?? [];
  if (!items.length) return null;
  return (
    <div css={cardShell}>
      <TypeLabel>{artifact.title ?? "Top picks"}</TypeLabel>
      <div css={css`display: flex; flex-direction: column; gap: 8px;`}>
        {items.map((item, i) => (
          <Row key={item.doc_id ?? i} item={item} rank={i + 1} top={i === 0} />
        ))}
      </div>
    </div>
  );
}
