/**
 * Zanderio Widget — Position Utilities
 *
 * Pure functions for computing CSS `position` / `top` / `bottom` /
 * `left` / `right` values based on the configured widget placement.
 *
 * Supported position strings
 * --------------------------
 * Composed from two segments joined by a hyphen:
 *   vertical   → "bottom" (default) | "top"
 *   horizontal → "right" (default) | "left" | "center"
 *
 * Examples: `"bottom-right"`, `"top-left"`, `"bottom-center"`.
 *
 * `getPositionStyle(position)` — CSS for the outer widget wrapper
 * (toggle button + toast).  All values use a 20 px inset from the
 * viewport edge; center positions use `translateX(-50%)`.
 *
 * `getChatWindowStyle(position)` — CSS for the chat panel relative to
 * the toggle button.  The window sits 80 px above (bottom) or below
 * (top) the button.
 *
 * @module utils/position
 */

/**
 * Returns CSS position values for the widget wrapper.
 *
 * @param {string|null} position — e.g. "bottom-right", "top-left", "bottom-center"
 * @returns {object} CSS style object
 */
export function getPositionStyle(position) {
  if (!position) return { bottom: "20px", right: "20px" };

  const styles = {
    bottom: "20px",
    left: "auto",
    right: "auto",
    top: "auto",
    transform: "none",
  };

  if (position.includes("bottom")) styles.bottom = "20px";
  if (position.includes("top")) {
    styles.top = "20px";
    styles.bottom = "auto";
  }

  if (position.includes("right")) styles.right = "20px";
  if (position.includes("left")) styles.left = "20px";
  if (position.includes("center")) {
    styles.left = "50%";
    styles.right = "auto";
    styles.transform = "translateX(-50%)";
  }

  return styles;
}

/**
 * Returns CSS position values for the chat window relative to the toggle button.
 *
 * @param {string} position — e.g. "bottom-right", "top-left"
 * @returns {object} CSS style object
 */
export function getChatWindowStyle(position) {
  const style = {
    bottom: position.includes("top") ? "auto" : "80px",
    top: position.includes("top") ? "80px" : "auto",
    right: position.includes("left") ? "auto" : "0",
    left: position.includes("right") ? "auto" : "0",
  };

  if (position.includes("center")) {
    style.left = "50%";
    style.right = "auto";
    style.transform = "translateX(-50%)";
  }

  return style;
}
