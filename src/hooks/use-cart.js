/**
 * Zanderio Widget — useCart Hook
 *
 * Manages cart preview state, real storefront cart adds, and transient
 * toast notifications.
 *
 * `requestAddToCart(item)` opens the widget's confirmation sheet for a
 * WooCommerce storefront item. `confirmCartPreview()` performs the real
 * cart mutation only after the shopper confirms.
 *
 * `showToast(message)` displays a brief confirmation message that
 * auto-dismisses after 3 seconds.
 *
 * @returns {{ cartItems, requestAddToCart, cartPreview,
 *             updateCartPreviewQuantity, closeCartPreview,
 *             confirmCartPreview, isCartPreviewSubmitting,
 *             toast, showToast }}
 *
 * @module hooks/use-cart
 */

import { useState, useCallback } from "react";

function normalizeId(value) {
  if (value == null || value === "") {
    return null;
  }

  const id = String(value).trim();
  return id || null;
}

function getSelectedOptionMap(item) {
  return item?.selectedOptions || item?.product?.selectedOptions || {};
}

function buildWooAttributeName(name) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    return null;
  }

  return normalized.startsWith("attribute_")
    ? normalized
    : `attribute_${normalized}`;
}

function hasResolvedWooVariation(item) {
  return Boolean(
    normalizeId(
      item?.product?.matched_variant_id ||
        item?.product?.matchedVariantId ||
        item?.product?.variation_id ||
        item?.product?.variationId,
    ),
  );
}

function requiresWooProductPage(item) {
  const product = item?.product;
  if (!product) {
    return false;
  }

  const variantCount = Number(product.variant_count || 0);
  const hasOptionGroups =
    Array.isArray(product.option_groups) && product.option_groups.length > 0;

  return !hasResolvedWooVariation(item) && (variantCount > 1 || hasOptionGroups);
}

function detectStorefront(settings, remoteConfig) {
  const explicitSource = [
    remoteConfig?.platform,
    remoteConfig?.source,
    remoteConfig?.storefront,
    settings?.platform,
    settings?.source,
    settings?.storefront,
    settings?.integration,
  ].find((value) => typeof value === "string" && value.trim());

  if (explicitSource) {
    if (/shopify/i.test(explicitSource)) {
      return "shopify";
    }
    if (/woo|wordpress/i.test(explicitSource)) {
      return "woocommerce";
    }
  }

  if (window.Shopify?.routes?.root) {
    return "shopify";
  }

  if (
    window.wc_add_to_cart_params ||
    window.wc_cart_fragments_params ||
    document.body?.classList.contains("woocommerce") ||
    document.body?.classList.contains("woocommerce-js") ||
    document.body?.classList.contains("woocommerce-page")
  ) {
    return "woocommerce";
  }

  return "unknown";
}

function getWooAjaxUrl() {
  const ajaxUrl =
    window.wc_add_to_cart_params?.wc_ajax_url ||
    window.wc_cart_fragments_params?.wc_ajax_url;

  if (ajaxUrl) {
    return ajaxUrl.replace("%%endpoint%%", "add_to_cart");
  }

  const url = new URL(window.location.href);
  url.searchParams.set("wc-ajax", "add_to_cart");
  return url.toString();
}

function triggerWooCartRefresh(payload) {
  const body = document.body;
  if (!body) {
    return;
  }

  if (window.jQuery && typeof window.jQuery(body).trigger === "function") {
    window
      .jQuery(body)
      .trigger("added_to_cart", [
        payload?.fragments || {},
        payload?.cart_hash || null,
        null,
      ]);
    window.jQuery(body).trigger("wc_fragment_refresh");
  }

  body.dispatchEvent(
    new CustomEvent("zanderio:cart:added", { detail: payload || {} }),
  );
}

async function addWooCommerceItem(item, quantity) {
  const productId = normalizeId(
    item?.product?.parent_id || item?.product?.product_id || item?.product?.id,
  );
  const variationId = normalizeId(
    item?.product?.matched_variant_id ||
      item?.product?.matchedVariantId ||
      item?.product?.variation_id ||
      item?.product?.variationId,
  );

  if (!productId) {
    throw new Error("missing_woocommerce_product");
  }

  if (requiresWooProductPage(item)) {
    throw new Error("missing_woocommerce_variation");
  }

  const body = new URLSearchParams();
  body.set("product_id", productId);
  body.set("quantity", String(quantity));

  if (variationId) {
    body.set("variation_id", variationId);
  }

  Object.entries(getSelectedOptionMap(item)).forEach(([name, value]) => {
    const attributeName = buildWooAttributeName(name);
    if (attributeName && value != null && value !== "") {
      body.set(attributeName, String(value));
    }
  });

  const response = await fetch(getWooAjaxUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    credentials: "same-origin",
    body: body.toString(),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    throw new Error("woocommerce_cart_failed");
  }

  triggerWooCartRefresh(payload);
  return payload;
}

function areSameCartLine(a, b) {
  if (a.product.id !== b.product.id) return false;
  const left = getSelectedOptionMap(a);
  const right = getSelectedOptionMap(b);
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  return keys.every((key) => left[key] === right[key]);
}

function clampQuantity(value) {
  const normalized = Number.parseInt(value, 10);
  if (!Number.isFinite(normalized) || normalized < 1) {
    return 1;
  }

  return Math.min(normalized, 99);
}

export function useCart(settings = {}, remoteConfig = null) {
  const [cartItems, setCartItems] = useState([]);
  const [cartPreview, setCartPreview] = useState(null);
  const [isCartPreviewSubmitting, setIsCartPreviewSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  const storefront = detectStorefront(settings, remoteConfig);

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }, []);

  const closeCartPreview = useCallback(() => {
    if (isCartPreviewSubmitting) {
      return;
    }

    setCartPreview(null);
  }, [isCartPreviewSubmitting]);

  const updateCartPreviewQuantity = useCallback((nextQuantity) => {
    setCartPreview((previous) => {
      if (!previous) {
        return previous;
      }

      const resolvedQuantity =
        typeof nextQuantity === "function"
          ? nextQuantity(previous.quantity || 1)
          : nextQuantity;

      return {
        ...previous,
        quantity: clampQuantity(resolvedQuantity),
      };
    });
  }, []);

  const requestAddToCart = useCallback(
    (item) => {
      if (storefront !== "woocommerce") {
        showToast(
          "Cart confirmation is only available on WooCommerce/WordPress storefronts.",
        );
        return;
      }

      if (requiresWooProductPage(item)) {
        showToast(
          "This product needs option selection on the product page before it can be added to cart.",
        );
        return;
      }

      setCartPreview({
        ...item,
        quantity: clampQuantity(item?.quantity || 1),
      });
    },
    [showToast, storefront],
  );

  const addToCart = useCallback(
    async (item) => {
      const quantity = item?.quantity || 1;

      try {
        if (storefront === "woocommerce") {
          await addWooCommerceItem(item, quantity);
        } else {
          throw new Error("unsupported_storefront");
        }

        setCartItems((prev) => {
          const existingIndex = prev.findIndex((cartItem) =>
            areSameCartLine(cartItem, item),
          );

          if (existingIndex !== -1) {
            return prev.map((cartItem, index) =>
              index === existingIndex
                ? { ...cartItem, quantity: (cartItem.quantity || 1) + quantity }
                : cartItem,
            );
          }

          return [...prev, { ...item, quantity }];
        });

        showToast(`${item.product.title} added to cart.`);
        return true;
      } catch (error) {
        if (error?.message === "unsupported_storefront") {
          showToast(
            "Cart actions are only available on WooCommerce/WordPress storefronts.",
          );
          return false;
        }

        if (error?.message === "missing_woocommerce_variation") {
          showToast(
            "This product needs option selection on the product page before it can be added to cart.",
          );
          return false;
        }

        showToast("Could not add that item to the cart. Please try again.");
        return false;
      }
    },
    [showToast, storefront],
  );

  const confirmCartPreview = useCallback(async () => {
    if (!cartPreview || isCartPreviewSubmitting) {
      return false;
    }

    setIsCartPreviewSubmitting(true);
    try {
      const didAdd = await addToCart(cartPreview);
      if (didAdd) {
        setCartPreview(null);
      }
      return didAdd;
    } finally {
      setIsCartPreviewSubmitting(false);
    }
  }, [addToCart, cartPreview, isCartPreviewSubmitting]);

  return {
    cartItems,
    requestAddToCart,
    cartPreview,
    updateCartPreviewQuantity,
    closeCartPreview,
    confirmCartPreview,
    isCartPreviewSubmitting,
    toast,
    showToast,
  };
}
