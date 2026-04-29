/**
 * Zanderio Widget - Content Parsers
 *
 * Utilities for normalising API response data into renderable shapes.
 *
 * Products arrive as flat arrays from the history endpoint and are
 * attached to hydrated messages.  The new 10-kind artifact taxonomy
 * (card, select, confirm, …) is passed through as-is by the runtime.
 *
 * @module utils/content-blocks
 */

/**
 * Normalise a raw product object from the history API.
 * Used only for hydrated (historical) product_list / product_card artifacts.
 *
 * @param {object} p - raw product from the API
 * @returns {object} normalised product for rendering
 */
export function normalizeProduct(p) {
  return {
    id: p.id,
    title: p.title,
    image: p.image || p.image_url || p.imageUrl || p.images?.[0] || null,
    price: p.price != null ? Number(p.price) : null,
    compare_at_price:
      p.compare_at_price != null ? Number(p.compare_at_price) : null,
    currency: p.currency || "USD",
    url: p.url || p.product_url || p.productUrl || null,
    in_stock: p.in_stock,
    variant_label: p.variant_label || null,
    variant_summary: p.variant_summary || null,
    variant_count: p.variant_count || 0,
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    materials: Array.isArray(p.materials) ? p.materials : [],
    sku: p.sku || null,
    matched_variant_id: p.matched_variant_id || null,
    option_groups: Array.isArray(p.option_groups) ? p.option_groups : [],
  };
}

/**
 * Parse a flat array of content blocks into a normalised list.
 * Only handles `text` blocks; all other block types are passed through
 * unchanged so the runtime can handle them (new 10-kind artifacts arrive
 * as structured objects and do not need further normalisation here).
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
    const type = (block.type || "").replace(/-/g, "_");

    if (type === "text") {
      const content = block.content || "";
      // Attempt to expand nested JSON
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

    // All other block types (artifact kinds etc.) — pass through unchanged
    flushText();
    result.push(block);
  }

  flushText();
  return result;
}
