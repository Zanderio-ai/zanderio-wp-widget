/**
 * Zanderio Widget — ProductCard
 *
 * Renders a single product inside the chat conversation with a compact
 * option summary and a cart-only CTA.
 *
 * @param {{ product, isSingle?, onAddToCart? }} props
 *
 * @module components/products/product-card
 */

import { IoCartOutline } from "react-icons/io5";

const pluralize = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const normalizeId = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const getProductUrl = (product) =>
  [product?.url, product?.product_url, product?.permalink].find(
    (value) => typeof value === "string" && value.trim(),
  ) || null;

const hasResolvedCartVariant = (product) =>
  Boolean(
    normalizeId(
      product?.matched_variant_id ||
        product?.matchedVariantId ||
        product?.variation_id ||
        product?.variationId,
    ),
  );

const requiresProductPageSelection = (product) => {
  if (!product) {
    return false;
  }

  const variantCount = Number(product.variant_count || 0);
  const hasOptionGroups =
    Array.isArray(product.option_groups) && product.option_groups.length > 0;

  return !hasResolvedCartVariant(product) && (variantCount > 1 || hasOptionGroups);
};

const buildVariantSummary = (product) => {
  if (product.variant_summary) {
    return product.variant_summary;
  }

  const parts = [];
  if (Array.isArray(product.colors) && product.colors.length) {
    parts.push(pluralize(product.colors.length, "color"));
  }
  if (Array.isArray(product.sizes) && product.sizes.length) {
    parts.push(pluralize(product.sizes.length, "size"));
  }
  if (Array.isArray(product.materials) && product.materials.length) {
    parts.push(pluralize(product.materials.length, "material"));
  }

  if (parts.length > 0) {
    return `${product.variant_label ? "Also available in" : "Available in"} ${parts.join(" / ")}`;
  }

  if (product.variant_count > 1) {
    return `${product.variant_count} variants available`;
  }

  return null;
};

const buildFallbackOptionGroups = (product) => {
  const groups = [];

  if (Array.isArray(product.colors) && product.colors.length) {
    groups.push({
      name: "Color",
      axis: "color",
      values: product.colors.map((label, index) => ({
        label,
        selected: index === 0,
      })),
    });
  }

  if (Array.isArray(product.sizes) && product.sizes.length) {
    groups.push({
      name: "Size",
      axis: "size",
      values: product.sizes.map((label, index) => ({
        label,
        selected: index === 0,
      })),
    });
  }

  if (Array.isArray(product.materials) && product.materials.length) {
    groups.push({
      name: "Material",
      axis: "material",
      values: product.materials.map((label, index) => ({
        label,
        selected: index === 0,
      })),
    });
  }

  return groups;
};

const getOptionGroups = (product) => {
  if (Array.isArray(product.option_groups) && product.option_groups.length) {
    return product.option_groups;
  }

  return buildFallbackOptionGroups(product);
};

const getSelectedOptions = (optionGroups) =>
  optionGroups.reduce((selectedOptions, group) => {
    const selectedValue =
      group.values?.find((value) => value.selected) || group.values?.[0];
    if (!selectedValue?.label) {
      return selectedOptions;
    }

    return {
      ...selectedOptions,
      [group.name]: selectedValue.label,
    };
  }, {});

const colorSwatchStyle = (value) => ({
  ...(value.swatch || value.color
    ? { background: value.swatch || value.color }
    : {
        background: "#e5e7eb",
        color: "#374151",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 700,
      }),
  ...(value.image
    ? {
        backgroundImage: `url(${value.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {}),
  cursor: "default",
});

const ProductCard = ({ product, isSingle = false, onAddToCart }) => {
  const image =
    product.image || product.image_url || product.images?.[0] || null;
  const matchedVariantLabel = product.variant_label || null;
  const variantSummary = buildVariantSummary(product);
  const optionGroups = getOptionGroups(product);
  const selectedOptions = getSelectedOptions(optionGroups);
  const outOfStock =
    product.in_stock === false ||
    product.available === false ||
    product.inventory_quantity === 0;
  const productUrl = getProductUrl(product);
  const requiresProductPage = requiresProductPageSelection(product);
  const showSecondaryAction = Boolean(productUrl) && !requiresProductPage;

  const openProductPage = () => {
    if (
      !productUrl ||
      typeof window === "undefined" ||
      typeof window.location?.assign !== "function"
    ) {
      return;
    }

    window.location.assign(productUrl);
  };

  const handlePrimaryAction = (event) => {
    event.stopPropagation();

    if (outOfStock) {
      return;
    }

    if (requiresProductPage) {
      openProductPage();
      return;
    }

    if (!onAddToCart) {
      return;
    }

    onAddToCart({ product, selectedOptions });
  };

  const handleViewDetails = (event) => {
    event.stopPropagation();
    openProductPage();
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
    <div className={`product-card ${isSingle ? "product-card-single" : ""}`}>
      <div className="product-image-container">
        {outOfStock && (
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
        {matchedVariantLabel ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#7E3FF2",
              lineHeight: 1.4,
            }}
          >
            Best match: {matchedVariantLabel}
          </div>
        ) : null}
        {variantSummary ? (
          <div
            style={{
              marginTop: matchedVariantLabel ? 4 : 6,
              fontSize: 12,
              color: "#6b7280",
              lineHeight: 1.4,
            }}
          >
            {variantSummary}
          </div>
        ) : null}
        {optionGroups.length > 0 ? (
          <div className="product-options">
            {optionGroups.slice(0, 2).map((group) => {
              const isColorGroup = group.axis === "color";
              const visibleValues =
                group.values?.slice(0, isColorGroup ? 5 : 4) || [];
              const remainingCount =
                (group.values?.length || 0) - visibleValues.length;

              return (
                <div
                  className="option-group"
                  key={`${product.id}-${group.name}`}
                >
                  <span className="option-label">{group.name}</span>
                  <div
                    className={isColorGroup ? "color-swatches" : "size-pills"}
                  >
                    {visibleValues.map((value) =>
                      isColorGroup ? (
                        <span
                          key={`${group.name}-${value.label}`}
                          className={`color-swatch${value.selected ? " selected" : ""}${value.available === false ? " unavailable" : ""}`}
                          title={value.label}
                          style={colorSwatchStyle(value)}
                        >
                          {!value.swatch && !value.color && !value.image
                            ? value.label.slice(0, 1).toUpperCase()
                            : null}
                        </span>
                      ) : (
                        <span
                          key={`${group.name}-${value.label}`}
                          className={`size-pill${value.selected ? " selected" : ""}${value.available === false ? " unavailable" : ""}`}
                          style={{ cursor: "default" }}
                        >
                          {value.label}
                        </span>
                      ),
                    )}
                    {remainingCount > 0 ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          alignSelf: "center",
                        }}
                      >
                        +{remainingCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {onAddToCart ? (
          <div className="product-footer">
            {showSecondaryAction ? (
              <button
                type="button"
                className="product-secondary-btn"
                onClick={handleViewDetails}
              >
                View details
              </button>
            ) : null}

            <button
              type="button"
              className={`product-primary-btn${showSecondaryAction ? "" : " product-primary-btn--full"}`}
              onClick={handlePrimaryAction}
              disabled={outOfStock || (requiresProductPage && !productUrl)}
              aria-label={
                outOfStock
                  ? "Out of stock"
                  : requiresProductPage
                    ? "Choose options"
                    : "Add to cart"
              }
              title={
                outOfStock
                  ? "Out of stock"
                  : requiresProductPage
                    ? "Choose options"
                    : "Add to cart"
              }
            >
              {requiresProductPage ? null : (
                <IoCartOutline className="cart-icon" size={16} />
              )}
              <span>
                {outOfStock
                  ? "Out of stock"
                  : requiresProductPage
                    ? "Choose options"
                    : "Add to cart"}
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductCard;
