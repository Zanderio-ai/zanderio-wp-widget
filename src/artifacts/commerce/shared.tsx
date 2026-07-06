/**
 * @module artifacts/commerce/shared
 * @description Shared primitives for commerce artifact cards — token-styled
 * (Emotion) ports of client/app `shared/components/artifacts/commerce/shared.tsx`.
 *
 * Every rendered field comes straight from the catalog; only `badge`/`pitch` are
 * agent-generated (and optional). Cart actions open the {@link useCartSheet}.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import { useCartSheet } from "./CartSheet";

export interface CommerceItem {
  doc_id?: string;
  title?: string;
  image?: string;
  brand?: string;
  product_type?: string;
  price?: number | null;
  price_max?: number | null;
  compare_at_price?: number | null;
  currency?: string;
  in_stock?: boolean;
  on_sale?: boolean;
  discount_pct?: number;
  url?: string;
  colour_swatches?: Array<{ value: string; hex?: string; in_stock?: boolean }>;
  options?: unknown[];
  badge?: string;
  pitch?: string;
}

export function formatPrice(price?: number | null, currency?: string): string | null {
  if (price == null) return null;
  const code = currency && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
}

const BADGE_TONES: Record<string, { bg: string; fg: string }> = {
  stock: { bg: "#EAF3DE", fg: "#27500A" },
  sale: { bg: "#FAEEDA", fg: "#633806" },
  best: { bg: "#EEEDFE", fg: "#3C3489" },
  value: { bg: "#E1F5EE", fg: "#085041" },
  budget: { bg: "#F1EFE8", fg: "#444441" },
};

export function badgeTone(label?: string): keyof typeof BADGE_TONES {
  const l = (label ?? "").toLowerCase();
  if (l.includes("value")) return "value";
  if (l.includes("budget")) return "budget";
  if (l.includes("stock")) return "stock";
  if (l.includes("sale") || l.includes("off")) return "sale";
  return "best";
}

export function Badge({ label, tone = "best" }: { label: string; tone?: keyof typeof BADGE_TONES }) {
  const t = BADGE_TONES[tone] ?? BADGE_TONES.best;
  return (
    <span
      css={css`
        display: inline-block;
        background: ${t.bg};
        color: ${t.fg};
        font-size: 10px;
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 6px;
        line-height: 1.4;
        white-space: nowrap;
      `}
    >
      {label}
    </span>
  );
}

export function ProductThumb({
  image,
  alt,
  height,
  ratio = "16/10",
  children,
}: {
  image?: string;
  alt?: string;
  height?: number;
  ratio?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      css={css`
        position: relative;
        ${height ? `height: ${height}px;` : `aspect-ratio: ${ratio};`}
        background: ${tokens.color.grey[50]};
        border-radius: ${tokens.radius.md};
        overflow: hidden;
        flex-shrink: 0;
      `}
    >
      {image && (
        <img
          src={image}
          alt={alt ?? ""}
          css={css`
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          `}
          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
        />
      )}
      {children}
    </div>
  );
}

export function SaleFlag({ discount_pct }: { discount_pct?: number }) {
  if (!discount_pct || discount_pct <= 0) return null;
  return (
    <span
      css={css`
        position: absolute;
        top: 5px;
        left: 5px;
        background: #1d9e75;
        color: #fff;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 4px;
      `}
    >
      {Math.round(discount_pct)}% off
    </span>
  );
}

export function OutOfStockVeil({ in_stock }: { in_stock?: boolean }) {
  if (in_stock !== false) return null;
  return (
    <div
      css={css`
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 500;
        color: ${tokens.color.textSecondary};
      `}
    >
      Out of stock
    </div>
  );
}

export function PriceRow({
  price,
  price_max,
  compare_at_price,
  currency,
  size = 13,
}: {
  price?: number | null;
  price_max?: number | null;
  compare_at_price?: number | null;
  currency?: string;
  size?: number;
}) {
  const priceStr = formatPrice(price, currency);
  const compareStr = compare_at_price ? formatPrice(compare_at_price, currency) : null;
  const showFrom = price_max != null && price_max !== price;
  return (
    <div
      css={css`
        display: flex;
        align-items: baseline;
        gap: 4px;
        flex-wrap: wrap;
      `}
    >
      {showFrom && <span css={css`font-size: 10px; color: ${tokens.color.textSecondary};`}>from</span>}
      {priceStr && <span css={css`font-size: ${size}px; font-weight: 600;`}>{priceStr}</span>}
      {compareStr && (
        <span
          css={css`
            font-size: 10px;
            color: ${tokens.color.textDisabled};
            text-decoration: line-through;
          `}
        >
          {compareStr}
        </span>
      )}
    </div>
  );
}

export function ColourSwatches({ swatches, max = 5 }: { swatches?: CommerceItem["colour_swatches"]; max?: number }) {
  if (!swatches?.length) return null;
  const visible = swatches.slice(0, max);
  const overflow = swatches.length - visible.length;
  return (
    <div css={css`display: flex; align-items: center; gap: 3px; margin-top: 6px;`}>
      {visible.map((s, i) => (
        <span
          key={i}
          title={s.value}
          css={css`
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${s.hex ?? "#ccc"};
            border: 1px solid ${tokens.color.border};
            opacity: ${s.in_stock === false ? 0.3 : 1};
          `}
        />
      ))}
      {overflow > 0 && <span css={css`font-size: 10px; color: ${tokens.color.textSecondary};`}>+{overflow}</span>}
    </div>
  );
}

export function TypeLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      css={css`
        font-size: 11px;
        font-weight: 500;
        color: ${tokens.color.textSecondary};
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      `}
    >
      {children}
    </div>
  );
}

const btnBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  padding: 7px 10px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
`;

export function ViewButton({ url, label = "View", fullWidth }: { url?: string; label?: string; fullWidth?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!url}
      css={[
        btnBase,
        css`
          ${fullWidth ? "flex: 1;" : ""}
          border: 1px solid ${tokens.color.border};
          color: ${tokens.color.text};
          background: ${tokens.color.bg};
          pointer-events: ${url ? "auto" : "none"};
          opacity: ${url ? 1 : 0.5};
          &:hover {
            background: ${tokens.color.grey[50]};
          }
        `,
      ]}
    >
      {label}
    </a>
  );
}

export function CartButton({ item, label = "Add to cart", fullWidth }: { item: CommerceItem; label?: string; fullWidth?: boolean }) {
  const openCart = useCartSheet();
  const disabled = item.in_stock === false;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openCart(item);
      }}
      css={[
        btnBase,
        css`
          ${fullWidth ? "flex: 1;" : ""}
          border: none;
          color: #fff;
          background: ${tokens.color.text};
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `,
      ]}
    >
      {label}
    </button>
  );
}

export function CartIconButton({ item }: { item: CommerceItem }) {
  const openCart = useCartSheet();
  const disabled = item.in_stock === false;
  return (
    <button
      type="button"
      aria-label="Add to cart"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openCart(item);
      }}
      css={css`
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        border: 1px solid ${tokens.color.border};
        border-radius: 8px;
        background: ${tokens.color.bg};
        color: ${tokens.color.text};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2m6 18a1 1 0 100-2 1 1 0 000 2Zm10 0a1 1 0 100-2 1 1 0 000 2Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
