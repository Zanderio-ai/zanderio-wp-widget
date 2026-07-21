/**
 * @module artifacts/commerce/CartSheet
 * @description Bottom-sheet cart configurator + provider.
 *
 * Port of client/app `commerce/CartSheet.tsx`, but instead of a mock in-memory
 * cart it drives the real storefront via {@link getCartAdapter}:
 *   - WooCommerce → adds through the Blocks cart store / Store API.
 *   - Shopify → adds through the storefront Cart Ajax API.
 *   - Custom → opens the verified product page.
 *
 * Per product direction, the add-to-cart action lives on the product card; this
 * sheet only appears after the shopper taps it, to pick options + confirm.
 *
 * Product and variant identifiers are emitted as explicit artifact fields. The
 * widget never derives a storefront ID from an internal document identifier.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import { detectStorefront } from "@/platform/detect";
import { getCartAdapter } from "@/platform/cart";
import { formatPrice, type CommerceItem } from "./shared";

interface AxisValue {
  value: string;
  hex?: string;
  in_stock?: boolean;
}
interface Axis {
  name: string;
  role: string;
  values: AxisValue[];
}

type OpenCart = (item: CommerceItem) => void;

const CartSheetContext = createContext<OpenCart>(() => {});

export function useCartSheet(): OpenCart {
  return useContext(CartSheetContext);
}

function buildAxes(item: CommerceItem | null): Axis[] {
  if (!item) return [];
  if (Array.isArray(item.options) && item.options.length) {
    return (item.options as Array<Record<string, unknown>>).map((opt) => {
      const inStock = new Set((opt.values_in_stock as string[]) ?? (opt.values as string[]) ?? []);
      const swatches = opt.role === "colour" ? (opt.swatches as Array<Record<string, unknown>>) : null;
      const values: AxisValue[] = swatches?.length
        ? swatches.map((s) => ({ value: String(s.value), hex: s.hex as string, in_stock: inStock.has(String(s.value)) }))
        : ((opt.values as string[]) ?? []).map((v) => ({ value: v, in_stock: inStock.has(v) }));
      return { name: String(opt.name ?? "Option"), role: String(opt.role ?? "generic"), values };
    });
  }
  if (item.colour_swatches?.length) {
    return [
      {
        name: "Colour",
        role: "colour",
        values: item.colour_swatches.map((s) => ({ value: s.value, hex: s.hex, in_stock: s.in_stock !== false })),
      },
    ];
  }
  return [];
}

function defaultSelections(axes: Axis[]): Record<string, string> {
  const sel: Record<string, string> = {};
  for (const axis of axes) {
    const first = axis.values.find((v) => v.in_stock !== false) ?? axis.values[0];
    if (first) sel[axis.name] = first.value;
  }
  return sel;
}

function resolveVariant(item: CommerceItem, selections: Record<string, string>) {
  return item.variants?.find(
    (variant) =>
      variant.in_stock !== false &&
      Object.entries(selections).every(([name, value]) =>
        variant.options?.some(
          (option) => option.name?.toLocaleLowerCase() === name.toLocaleLowerCase() && option.value === value,
        ),
      ),
  );
}

function SheetBody({
  item,
  onClose,
  onConfirm,
  submitting,
}: {
  item: CommerceItem;
  onClose: () => void;
  onConfirm: (selections: Record<string, string>) => void;
  submitting: boolean;
}) {
  const axes = useMemo(() => buildAxes(item), [item]);
  const [selections, setSelections] = useState(() => defaultSelections(axes));
  const priceStr = formatPrice(item.price, item.currency);
  const ready = axes.every((a) => Boolean(selections[a.name]));
  const oos = item.in_stock === false;

  return (
    <div css={css`padding: 8px 16px 16px;`}>
      <div css={css`width: 36px; height: 4px; border-radius: 2px; background: ${tokens.color.border}; margin: 0 auto 12px;`} />

      <div css={css`display: flex; gap: 12px; align-items: center;`}>
        <div
          css={css`
            width: 56px; height: 56px; border-radius: 10px; flex-shrink: 0; overflow: hidden;
            background: ${tokens.color.grey[50]};
          `}
        >
          {item.image && <img src={item.image} alt="" css={css`width: 100%; height: 100%; object-fit: cover;`} />}
        </div>
        <div css={css`flex: 1; min-width: 0;`}>
          <div css={css`font-size: 14px; font-weight: 600; line-height: 1.3;`}>{item.title ?? "Product"}</div>
          {item.brand && <div css={css`font-size: 11px; color: ${tokens.color.textSecondary};`}>{item.brand}</div>}
          {priceStr && <div css={css`font-size: 15px; font-weight: 600; margin-top: 2px;`}>{priceStr}</div>}
        </div>
        <button type="button" aria-label="Close" onClick={onClose} css={css`border: none; background: none; cursor: pointer; color: ${tokens.color.textSecondary}; padding: 4px;`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      {axes.map((axis) => (
        <div key={axis.name} css={css`margin-top: 16px;`}>
          <div css={css`font-size: 11px; color: ${tokens.color.textSecondary}; margin-bottom: 8px;`}>
            {axis.name}
            {selections[axis.name] && <span css={css`color: ${tokens.color.text}; font-weight: 500; margin-left: 6px;`}>— {selections[axis.name]}</span>}
          </div>
          <div css={css`display: flex; flex-wrap: wrap; gap: 8px;`}>
            {axis.values.map((v, i) => {
              const isOos = v.in_stock === false;
              const active = selections[axis.name] === v.value;
              const pick = () => !isOos && setSelections((p) => ({ ...p, [axis.name]: v.value }));
              return axis.role === "colour" && v.hex ? (
                <span
                  key={i}
                  title={v.value}
                  onClick={pick}
                  css={css`
                    width: 30px; height: 30px; border-radius: 50%; background: ${v.hex}; flex-shrink: 0;
                    border: ${active ? "2px" : "1px"} solid ${active ? tokens.color.text : tokens.color.border};
                    opacity: ${isOos ? 0.35 : 1}; cursor: ${isOos ? "not-allowed" : "pointer"};
                  `}
                />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={pick}
                  disabled={isOos}
                  css={css`
                    height: 34px; padding: 0 12px; font-size: 13px; border-radius: 8px; cursor: ${isOos ? "not-allowed" : "pointer"};
                    background: ${active ? tokens.color.text : tokens.color.bg};
                    color: ${active ? "#fff" : tokens.color.text};
                    border: 1px solid ${active ? tokens.color.text : tokens.color.border};
                    text-decoration: ${isOos ? "line-through" : "none"};
                  `}
                >
                  {v.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={!ready || oos || submitting}
        onClick={() => onConfirm(selections)}
        css={css`
          width: 100%; margin-top: 20px; padding: 14px; border: none; border-radius: 12px; cursor: pointer;
          font-size: 15px; font-weight: 600; background: ${tokens.color.text}; color: #fff;
          &:disabled { opacity: 0.5; cursor: not-allowed; }
        `}
      >
        {oos ? "Out of stock" : submitting ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}

export function CartSheetProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<CommerceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openCart = useCallback<OpenCart>((next) => setItem(next), []);
  const close = useCallback(() => !submitting && setItem(null), [submitting]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const confirm = useCallback(
    async (selections: Record<string, string>) => {
      if (!item) return;
      const adapter = getCartAdapter(detectStorefront());
      const productId = item.product_id ?? "";
      const variant = resolveVariant(item, selections);
      const variantId = variant?.id || (Object.keys(selections).length === 0 ? item.default_variant_id : "");

      if (!adapter.supportsCart || !productId || (item.platform === "shopify" && !variantId)) {
        if (item.url) window.open(item.url, "_blank", "noopener");
        setItem(null);
        return;
      }

      setSubmitting(true);
      try {
        await adapter.add({ productId, variationId: variantId || undefined, quantity: 1, attributes: selections });
        const selectionLabel = Object.values(selections).join(" · ");
        showToast(`${item.title ?? "Item"} added to cart${selectionLabel ? ` — ${selectionLabel}` : ""}`);
        setItem(null);
      } catch {
        showToast("Couldn't add to cart. Try the product page.");
      } finally {
        setSubmitting(false);
      }
    },
    [item, showToast],
  );

  return (
    <CartSheetContext.Provider value={openCart}>
      {children}

      {item && (
        <>
          <div onClick={close} css={css`position: absolute; inset: 0; background: rgba(0,0,0,0.4); z-index: 5;`} />
          <div
            css={css`
              position: absolute; left: 0; right: 0; bottom: 0; z-index: 6;
              background: ${tokens.color.bg};
              border-radius: ${tokens.radius.xl} ${tokens.radius.xl} 0 0;
              box-shadow: ${tokens.shadow.md};
              animation: z-msg-in 0.2s ease-out;
            `}
          >
            <SheetBody item={item} onClose={close} onConfirm={confirm} submitting={submitting} />
          </div>
        </>
      )}

      {toast && (
        <div
          css={css`
            position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 7;
            background: ${tokens.color.text}; color: #fff; font-size: 13px;
            padding: 10px 16px; border-radius: ${tokens.radius.pill}; white-space: nowrap;
            box-shadow: ${tokens.shadow.md};
          `}
        >
          {toast}
        </div>
      )}
    </CartSheetContext.Provider>
  );
}
