/**
 * Zanderio Widget - Content Block Parser
 *
 * Pure transformer that converts the API content-block array into a flat,
 * renderable list the UI layer can iterate without type-branching.
 *
 * Input shapes (from socket / REST response)
 * -------------------------------------------
 * blocks[] - each element has a `type` field:
 *   text          - plain or markdown text (may contain nested JSON)
 *   product-card  - product card with items array (from action node)
 *   product_card  - legacy single product object
 *   products      - array of product objects
 *   action        - legacy inline action
 *
 * actions[] - separate array of ActionBlock objects from the AI pipeline:
 *   { type, label, url, product_id }
 *   types: add-to-cart, view-product, book-appointment, contact-us,
 *          browse-category, visit-link
 *
 * @module utils/content-blocks
 */

/**
 * @param {object} p - raw product from the API
 * @returns {object} normalised product for ProductCard component
 */
function normalizeProduct(p) {
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
 * @param {Array} actions - ActionBlock array from AI pipeline
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

/**
 * @param {Array} contentBlocks - raw blocks from the API / socket response
 * @returns {Array<{ type: string, content?: string, product?: object, items?: object[], ... }>}
 */
export function parseContentBlocks(contentBlocks) {
  if (!contentBlocks || !Array.isArray(contentBlocks)) return [];

  const result = [];
  let textBuffer = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      result.push({ type: "text", content: textBuffer.join("\n\n") });
      textBuffer = [];
    }
  };

  for (let i = 0; i < contentBlocks.length; i++) {
    const block = contentBlocks[i];

    if (block.type === "text" && typeof block.content === "string") {
      try {
        const parsed = JSON.parse(block.content);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          for (const nested of parsed.blocks) {
            if (nested.type === "text") {
              textBuffer.push(nested.content);
            } else if (
              (nested.type === "product_card" ||
                nested.type === "product-card") &&
              (nested.product || nested.items)
            ) {
              flushText();
              if (nested.items) {
                result.push({
                  type: "products",
                  items: nested.items.map(normalizeProduct),
                });
              } else {
                result.push({
                  type: "product_card",
                  product: normalizeProduct(nested.product),
                });
              }
            } else if (nested.type === "products" && nested.items) {
              flushText();
              result.push({
                type: "products",
                items: nested.items.map(normalizeProduct),
              });
            }
          }
          continue;
        }
      } catch {
        /* not valid JSON - fall through */
      }
    }

    if (block.type === "text") {
      textBuffer.push(block.content);
      const next = contentBlocks[i + 1];
      const isLast = i === contentBlocks.length - 1;
      if (isLast || (next && next.type !== "text")) {
        flushText();
      }
      continue;
    }

    if (block.type === "action") {
      flushText();
      result.push({
        type: "action",
        action_type: block.action_type || block.type,
        label: block.label,
        payload: block.payload,
        url: block.url,
        email: block.email,
        product_id: block.product_id || null,
        metadata: block.metadata || {},
      });
      continue;
    }

    if (
      (block.type === "product_card" || block.type === "product-card") &&
      (block.product || block.items)
    ) {
      flushText();
      if (block.items) {
        result.push({
          type: "products",
          items: block.items.map(normalizeProduct),
        });
      } else {
        result.push({
          type: "product_card",
          product: normalizeProduct(block.product),
        });
      }
      continue;
    }

    if (block.type === "products" && block.items) {
      flushText();
      result.push({
        type: "products",
        items: block.items.map(normalizeProduct),
      });
      continue;
    }
  }

  flushText();
  return result;
}
