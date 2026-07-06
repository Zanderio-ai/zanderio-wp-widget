/**
 * @module artifacts/commerce/SpotlightCard
 * @description Single-product, highest-intent card: large image, sale/stock
 * badges, price, optional pitch, and a primary Add-to-cart (option selection
 * happens in the cart sheet). Reads `artifact.{title,subtitle,media,target,data}`.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import { Badge, CartButton, ProductThumb, SaleFlag, ViewButton, formatPrice, type CommerceItem } from "./shared";

export function SpotlightCard({ artifact }: { artifact: Artifact }) {
  const { title, subtitle, media, target } = artifact;
  const data = (artifact.data ?? {}) as Record<string, unknown>;
  const price = data.price as number | undefined;
  const currency = (data.currency as string) ?? "USD";
  const compareAt = data.compare_at_price as number | undefined;
  const inStock = data.in_stock !== false;
  const brand = data.brand as string | undefined;
  const sku = data.sku as string | undefined;
  const onSale = Boolean(data.on_sale);
  const discount = (data.discount_pct as number) ?? 0;

  const priceStr = formatPrice(price, currency);
  const compareStr = compareAt ? formatPrice(compareAt, currency) : null;

  const cartItem: CommerceItem = {
    doc_id: (data.product_id as string) ?? "",
    title: title ?? undefined,
    price,
    currency,
    image: media as string | undefined,
    url: target as string | undefined,
    in_stock: inStock,
    brand,
    options: (data.options as unknown[]) ?? [],
  };

  return (
    <div
      css={css`
        width: 100%;
        max-width: 360px;
        border: 1px solid ${tokens.color.border};
        border-radius: ${tokens.radius.lg};
        background: ${tokens.color.bg};
        overflow: hidden;
      `}
    >
      <ProductThumb image={media as string} alt={title ?? ""} height={180} ratio="16/9">
        <SaleFlag discount_pct={onSale ? discount : 0} />
      </ProductThumb>

      <div css={css`padding: 12px;`}>
        <div css={css`display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px;`}>
          {onSale && discount > 0 && <Badge label={`${Math.round(discount)}% off`} tone="sale" />}
          <Badge label={inStock ? "In stock" : "Out of stock"} tone={inStock ? "stock" : "budget"} />
        </div>

        <div css={css`font-size: 15px; font-weight: 600; line-height: 1.3;`}>{title ?? "Product"}</div>
        {(brand || sku) && (
          <div css={css`font-size: 12px; color: ${tokens.color.textSecondary}; margin-bottom: 6px;`}>
            {[brand, sku ? `SKU: ${sku}` : null].filter(Boolean).join(" · ")}
          </div>
        )}
        {subtitle && <div css={css`font-size: 12px; color: ${tokens.color.textSecondary}; line-height: 1.5; margin-bottom: 8px;`}>{subtitle}</div>}

        <div css={css`display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px;`}>
          {priceStr && <span css={css`font-size: 18px; font-weight: 600;`}>{priceStr}</span>}
          {compareStr && <span css={css`font-size: 13px; color: ${tokens.color.textDisabled}; text-decoration: line-through;`}>{compareStr}</span>}
        </div>

        <div css={css`display: flex; gap: 8px;`}>
          <ViewButton url={target as string} label="View listing" fullWidth />
          <CartButton item={cartItem} fullWidth />
        </div>
      </div>
    </div>
  );
}
