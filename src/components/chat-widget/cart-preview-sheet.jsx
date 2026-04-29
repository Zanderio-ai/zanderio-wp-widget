/**
 * CartPreviewSheet — WooCommerce cart confirmation bottom sheet.
 *
 * Triggered when the user clicks "Add to cart" on a ProductCardItem.
 * Uses the existing .cart-preview-* CSS in index.css.
 * Matches Playground's CartPreview.jsx design: handle bar, product row,
 * qty stepper, subtotal, "Continue Shopping" + "Add to Cart" buttons.
 *
 * Props:
 *   preview  — { title, price, image, in_stock, ... } from useCart cartPreview
 *   onClose  — closeCartPreview from useCart
 *   onConfirm — confirmCartPreview from useCart
 *   onUpdateQty — updateCartPreviewQuantity from useCart
 *   isSubmitting — isCartPreviewSubmitting from useCart
 *   accentColor — string hex
 */

import { useState } from "react";

function formatPrice(price) {
  const n = parseFloat(String(price ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(price ?? "");
}

export default function CartPreviewSheet({
  preview,
  onClose,
  onConfirm,
  onUpdateQty,
  isSubmitting,
  accentColor,
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!preview) return null;

  const { title, price, image, quantity = 1 } = preview;
  const priceNum = parseFloat(String(price ?? "").replace(/[^0-9.]/g, "")) || 0;
  const subtotal = (priceNum * quantity).toFixed(2);

  return (
    <div className="cart-preview-overlay">
      {/* Backdrop — click to dismiss */}
      <button
        type="button"
        className="cart-preview-backdrop"
        onClick={onClose}
        aria-label="Close cart preview"
      />

      <div className="cart-preview-sheet">
        {/* Handle bar */}
        <div className="cart-preview-sheet__handle" />

        {/* Header */}
        <div className="cart-preview-sheet__header">
          <p className="cart-preview-sheet__eyebrow">Added to Cart</p>
        </div>

        {/* Product row */}
        <div className="cart-preview-sheet__product">
          {image && !imgFailed ? (
            <img
              className="cart-preview-sheet__image"
              src={image}
              alt={title}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="cart-preview-sheet__image-placeholder">
              {/* Bag icon fallback */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
          )}

          <div className="cart-preview-sheet__product-info">
            <p className="cart-preview-sheet__product-title">{title}</p>
            <p className="cart-preview-sheet__product-price">{formatPrice(price)}</p>

            {/* Quantity stepper */}
            <div className="cart-preview-sheet__qty">
              <button
                type="button"
                className="cart-preview-sheet__qty-btn"
                disabled={quantity <= 1 || isSubmitting}
                onClick={() => onUpdateQty((q) => q - 1)}
              >−</button>
              <span className="cart-preview-sheet__qty-count">{quantity}</span>
              <button
                type="button"
                className="cart-preview-sheet__qty-btn"
                disabled={isSubmitting}
                onClick={() => onUpdateQty((q) => q + 1)}
              >+</button>
            </div>
          </div>

          <p className="cart-preview-sheet__subtotal-inline">${subtotal}</p>
        </div>

        {/* Subtotal row */}
        <div className="cart-preview-sheet__subtotal-row">
          <span className="cart-preview-sheet__subtotal-label">Preview subtotal</span>
          <span className="cart-preview-sheet__subtotal-value">${subtotal}</span>
        </div>

        {/* Actions */}
        <div className="cart-preview-sheet__actions">
          <button
            type="button"
            className="cart-preview-sheet__cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Continue Shopping
          </button>
          <button
            type="button"
            className="cart-preview-sheet__confirm"
            style={{
              background: accentColor,
              color: "var(--widget-accent-contrast)",
              boxShadow: `0 14px 32px var(--widget-accent-shadow)`,
            }}
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Adding…" : `Add to Cart (${quantity})`}
          </button>
        </div>
      </div>
    </div>
  );
}
