import { IoAdd, IoClose, IoRemove } from "react-icons/io5";

function formatPrice(value, currency = "USD") {
  if (value == null || value === "") {
    return null;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

function getDisplayVariant(product, selectedOptions) {
  if (product?.variant_label) {
    return product.variant_label;
  }

  const entries = Object.entries(selectedOptions || {}).filter(
    ([, value]) => value != null && value !== "",
  );

  if (!entries.length) {
    return null;
  }

  return entries.map(([name, value]) => `${name}: ${value}`).join(" • ");
}

export default function CartPreviewSheet({
  item,
  onClose,
  onConfirm,
  onQuantityChange,
  isSubmitting,
}) {
  if (!item?.product) {
    return null;
  }

  const { product } = item;
  const quantity = item.quantity || 1;
  const image =
    product.image || product.image_url || product.images?.[0] || null;
  const optionEntries = Object.entries(item.selectedOptions || {}).filter(
    ([, value]) => value != null && value !== "",
  );
  const unitPrice = formatPrice(product.price, product.currency || "USD");
  const totalPrice =
    product.price != null
      ? formatPrice(Number(product.price) * quantity, product.currency || "USD")
      : null;
  const variantLabel = getDisplayVariant(product, item.selectedOptions);

  return (
    <div className="cart-preview-overlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="cart-preview-backdrop"
        aria-label="Close cart preview"
        onClick={onClose}
        disabled={isSubmitting}
      />

      <div className="cart-preview-sheet">
        <div className="cart-preview-sheet__handle" />

        <div className="cart-preview-sheet__header">
          <div>
            <p className="cart-preview-sheet__eyebrow">Preview cart</p>
            <h3 className="cart-preview-sheet__title">Confirm this item</h3>
          </div>

          <button
            type="button"
            className="cart-preview-sheet__close"
            aria-label="Close cart preview"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <IoClose size={18} />
          </button>
        </div>

        <div className="cart-preview-sheet__product">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="cart-preview-sheet__image"
            />
          ) : (
            <div className="cart-preview-sheet__image cart-preview-sheet__image--placeholder">
              No image
            </div>
          )}

          <div className="cart-preview-sheet__details">
            <p className="cart-preview-sheet__product-title">{product.title}</p>
            {variantLabel ? (
              <p className="cart-preview-sheet__product-variant">
                {variantLabel}
              </p>
            ) : null}
            {unitPrice ? (
              <p className="cart-preview-sheet__product-price">
                {unitPrice} each
              </p>
            ) : null}
          </div>
        </div>

        {optionEntries.length ? (
          <div className="cart-preview-sheet__options">
            {optionEntries.map(([name, value]) => (
              <span
                key={`${name}-${value}`}
                className="cart-preview-sheet__option-pill"
              >
                {name}: {value}
              </span>
            ))}
          </div>
        ) : null}

        <div className="cart-preview-sheet__summary-row">
          <div>
            <p className="cart-preview-sheet__label">Quantity</p>
            <div className="cart-preview-sheet__quantity-control">
              <button
                type="button"
                className="cart-preview-sheet__qty-btn"
                onClick={() => onQuantityChange((current) => current - 1)}
                disabled={isSubmitting || quantity <= 1}
                aria-label="Decrease quantity"
              >
                <IoRemove size={16} />
              </button>

              <span className="cart-preview-sheet__quantity-value">
                {quantity}
              </span>

              <button
                type="button"
                className="cart-preview-sheet__qty-btn"
                onClick={() => onQuantityChange((current) => current + 1)}
                disabled={isSubmitting}
                aria-label="Increase quantity"
              >
                <IoAdd size={16} />
              </button>
            </div>
          </div>

          <div className="cart-preview-sheet__total">
            <p className="cart-preview-sheet__label">Total</p>
            <p className="cart-preview-sheet__total-value">
              {totalPrice || "Calculated at checkout"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="cart-preview-sheet__confirm"
          onClick={onConfirm}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Adding to cart..." : `Add ${quantity} to cart`}
        </button>
      </div>
    </div>
  );
}
