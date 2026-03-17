/**
 * Zanderio Widget - Content Parsers
 *
 * Utilities for normalising API response data into renderable shapes.
 *
 * Products arrive as flat arrays from the history endpoint.
 * Actions arrive as { type, label, url } objects.
 *
 * @module utils/content-blocks
 */

/**
 * @param {object} p - raw product from the API
 * @returns {object} normalised product for ProductCard component
 */
export function normalizeProduct(p) {
  return {
    id: p.id,
    title: p.title,
    image: p.image || p.images?.[0] || null,
    price: p.price ? `$${p.price}` : "N/A",
    compare_at_price:
      p.compare_at_price != null ? `$${p.compare_at_price}` : null,
    url: p.url,
    in_stock: p.in_stock,
  };
}

/**
 * Parse a flat array of content blocks (text, product_card, products, action)
 * into a normalised list suitable for rendering.
 *
 * @param {Array|null} blocks
 * @returns {Array}
 */
export function parseContentBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) return [];

  const result = [];
  let pendingText = "";

  const flushText = () => {
    if (pendingText) {
      result.push({ type: "text", content: pendingText });
      pendingText = "";
    }
  };

  for (const block of blocks) {
    // Normalise type: product-card → product_card
    const type = (block.type || "").replace(/-/g, "_");

    if (type === "text") {
      // Attempt to expand nested JSON
      const content = block.content || "";
      try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
          flushText();
          result.push(...parseContentBlocks(parsed.blocks));
          continue;
        }
      } catch {
        // not JSON — treat as plain text
      }
      pendingText = pendingText ? `${pendingText}\n\n${content}` : content;
      continue;
    }

    if (type === "product_card") {
      flushText();
      // If it has an items array, treat as a products block
      if (block.items && Array.isArray(block.items)) {
        result.push({
          type: "products",
          items: block.items.map(normalizeProduct),
        });
      } else {
        result.push({
          type: "product_card",
          product: block.product ? normalizeProduct(block.product) : null,
        });
      }
      continue;
    }

    if (type === "products") {
      flushText();
      result.push({
        type: "products",
        items: (block.items || []).map(normalizeProduct),
      });
      continue;
    }

    if (type === "action") {
      flushText();
      result.push({
        type: "action",
        action_type: block.action_type,
        label: block.label,
        url: block.url || null,
        product_id: block.product_id || null,
        ...(block.metadata ? { metadata: block.metadata } : {}),
      });
      continue;
    }

    // Unknown type — flush text and pass through
    flushText();
    result.push(block);
  }

  flushText();
  return result;
}

/**
 * @param {Array} actions - action array from AI pipeline
 * @returns {Array<{ type: "action", action_type: string, label: string, url?: string, product_id?: string }>}
 */
export function parseActions(actions) {
  if (!actions || !Array.isArray(actions)) return [];

  return actions.map((action) => ({
    type: "action",
    action_type: action.type,
    label: action.label,
    url: action.url || null,
    product_id: action.product_id || null,
  }));
}
