/**
 * Zanderio Widget — ProductCard
 *
 * Renders a single product inside the chat conversation.  Displays:
 *
 *   • **Image** — single product image with dot indicators when multiple.
 *   • **Price** — overlaid badge on the image.
 *   • **Title** — product name, 2 lines max.
 *   • **Out-of-stock badge** — when `product.in_stock === false`.
 *   • **External link** — small link button to view on the store.
 *
 * Variant selection, swatch pickers, and add-to-cart happen on the
 * product's own page — the card is intentionally lean.
 *
 * When `isSingle` is true the card stretches to fill its container;
 * otherwise it uses the fixed carousel-card width.
 *
 * @param {{ product, isSingle? }} props
 *
 * @module components/products/product-card
 */

import { IoLinkOutline } from "react-icons/io5";

const ProductCard = ({ product, isSingle = false }) => {
  const image = product.image || null;

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (product.url) {
      window.open(product.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCardClick = () => {
    if (product.url) {
      window.open(product.url, "_blank", "noopener,noreferrer");
    }
  };

  const formatPrice = () => {
    if (product.price == null) return null;
    const currency = product.currency || "USD";
    const fmt = (value) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
        }).format(Number(value));
      } catch {
        return `${value}`;
      }
    };
    const formatted = fmt(product.price);

    if (
      product.compare_at_price != null &&
      product.compare_at_price > product.price
    ) {
      const compareFormatted = fmt(product.compare_at_price);
      return (
        <>
          <span className="product-price-current">{formatted}</span>
          <span className="product-price-compare">{compareFormatted}</span>
        </>
      );
    }
    return formatted;
  };

  return (
    <div
      className={`product-card ${isSingle ? "product-card-single" : ""}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      style={{ cursor: product.url ? "pointer" : "default" }}
    >
      <div className="product-image-container">
        {product.in_stock === false && (
          <div className="product-badge">
            <svg
              className="badge-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
        )}

        {product.url && (
          <button
            className="product-link-btn"
            onClick={handleLinkClick}
            aria-label="View product"
            title="View on store"
          >
            <IoLinkOutline size={18} color="#ffffff" />
          </button>
        )}

        {formatPrice() && <div className="product-price">{formatPrice()}</div>}

        {image ? (
          <img src={image} alt={product.title} className="product-image" />
        ) : (
          <div className="product-image-placeholder">
            <span>No image</span>
          </div>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.title}</h3>
      </div>
    </div>
  );
};

export default ProductCard;
