/**
 * Zanderio Widget — useCart Hook
 *
 * Manages the widget’s local cart state and transient toast notifications.
 *
 * `addToCart(item)` adds a product to the `cartItems` array.  If the same
 * product with identical `selectedOptions` already exists the quantity is
 * incremented instead of inserting a duplicate.  Option equality is
 * checked key-by-key across the union of both option sets.
 *
 * `showToast(message)` displays a brief confirmation message that
 * auto-dismisses after 3 seconds.
 *
 * @returns {{ cartItems, addToCart, toast, showToast }}
 *
 * @module hooks/use-cart
 */

import { useState, useCallback } from "react";

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "" });

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }, []);

  const addToCart = useCallback(
    (item) => {
      const existingIndex = cartItems.findIndex((ci) => {
        if (ci.product.id !== item.product.id) return false;
        const a = ci.selectedOptions || {};
        const b = item.selectedOptions || {};
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
        return keys.every((k) => a[k] === b[k]);
      });

      if (existingIndex !== -1) {
        setCartItems((prev) =>
          prev.map((ci, i) =>
            i === existingIndex
              ? { ...ci, quantity: (ci.quantity || 1) + 1 }
              : ci,
          ),
        );
      } else {
        setCartItems((prev) => [...prev, { ...item, quantity: 1 }]);
      }

      showToast(`${item.product.title} added to cart!`);
    },
    [cartItems, showToast],
  );

  return { cartItems, addToCart, toast, showToast };
}
