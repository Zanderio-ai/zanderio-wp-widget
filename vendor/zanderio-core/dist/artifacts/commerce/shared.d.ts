/**
 * @module artifacts/commerce/shared
 * @description Shared primitives for the commerce artifact cards.
 *
 * Every rendered field comes straight from the catalog; only `badge`/`pitch` are
 * agent-generated (and optional), and `match_label` is set by the AI service's
 * image search. Cart actions open the {@link useCartSheet}.
 */
import type { ReactNode } from "react";
import type { CommerceItem, ImageMatchLabel } from "../../chat/types.js";
export type { CommerceItem } from "../../chat/types.js";
export declare function formatPrice(price?: number | null, currency?: string): string | null;
declare const BADGE_TONES: {
    readonly stock: {
        readonly bg: "#EAF3DE";
        readonly fg: "#27500A";
    };
    readonly sale: {
        readonly bg: "#FAEEDA";
        readonly fg: "#633806";
    };
    readonly best: {
        readonly bg: "#EEEDFE";
        readonly fg: "#3C3489";
    };
    readonly value: {
        readonly bg: "#E1F5EE";
        readonly fg: "#085041";
    };
    readonly budget: {
        readonly bg: "#F1EFE8";
        readonly fg: "#444441";
    };
};
export type BadgeTone = keyof typeof BADGE_TONES;
export declare function badgeTone(label?: string): BadgeTone;
export declare function Badge({ label, tone }: {
    label: string;
    tone?: BadgeTone;
}): import("@emotion/react/jsx-runtime").JSX.Element;
/**
 * How a product found by a photo search relates to the photo. Renders nothing
 * for cards that did not come from one.
 */
export declare function MatchBadge({ label }: {
    label?: ImageMatchLabel | null;
}): import("@emotion/react/jsx-runtime").JSX.Element | null;
export declare function ProductThumb({ image, alt, height, ratio, children, }: {
    image?: string;
    alt?: string;
    height?: number;
    ratio?: string;
    children?: ReactNode;
}): import("@emotion/react/jsx-runtime").JSX.Element;
export declare function SaleFlag({ discount_pct }: {
    discount_pct?: number;
}): import("@emotion/react/jsx-runtime").JSX.Element | null;
export declare function OutOfStockVeil({ in_stock }: {
    in_stock?: boolean;
}): import("@emotion/react/jsx-runtime").JSX.Element | null;
export declare function PriceRow({ price, price_max, compare_at_price, currency, size, }: {
    price?: number | null;
    price_max?: number | null;
    compare_at_price?: number | null;
    currency?: string;
    size?: number;
}): import("@emotion/react/jsx-runtime").JSX.Element;
export declare function ColourSwatches({ swatches, max }: {
    swatches?: CommerceItem["colour_swatches"];
    max?: number;
}): import("@emotion/react/jsx-runtime").JSX.Element | null;
export declare function TypeLabel({ children }: {
    children: ReactNode;
}): import("@emotion/react/jsx-runtime").JSX.Element;
export declare function ViewButton({ url, label, fullWidth }: {
    url?: string;
    label?: string;
    fullWidth?: boolean;
}): import("@emotion/react/jsx-runtime").JSX.Element;
export declare function CartButton({ item, label, fullWidth }: {
    item: CommerceItem;
    label?: string;
    fullWidth?: boolean;
}): import("@emotion/react/jsx-runtime").JSX.Element;
export declare function CartIconButton({ item }: {
    item: CommerceItem;
}): import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=shared.d.ts.map